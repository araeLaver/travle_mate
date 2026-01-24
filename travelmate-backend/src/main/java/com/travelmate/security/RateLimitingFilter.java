package com.travelmate.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.exception.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.scheduling.annotation.Scheduled;

@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${app.security.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${app.security.rate-limit.default-requests-per-minute:60}")
    private int defaultRequestsPerMinute;

    @Value("${app.security.rate-limit.login-requests-per-minute:5}")
    private int loginRequestsPerMinute;

    @Value("${app.security.rate-limit.api-requests-per-minute:30}")
    private int apiRequestsPerMinute;

    @Value("${app.security.rate-limit.upload-requests-per-minute:10}")
    private int uploadRequestsPerMinute;

    private final ConcurrentHashMap<String, RateLimitInfo> rateLimitMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicInteger> loginFailureMap = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static class RateLimitInfo {
        private AtomicInteger requestCount = new AtomicInteger(0);
        private long windowStart = System.currentTimeMillis();
        private final int maxRequests;

        public RateLimitInfo(int maxRequests) {
            this.maxRequests = maxRequests;
        }

        public boolean isAllowed() {
            long currentTime = System.currentTimeMillis();

            // 1분 윈도우 리셋
            if (currentTime - windowStart >= 60000) {
                requestCount.set(0);
                windowStart = currentTime;
            }

            return requestCount.incrementAndGet() <= maxRequests;
        }

        public int getRemainingRequests() {
            return Math.max(0, maxRequests - requestCount.get());
        }

        public long getResetTime() {
            return windowStart + 60000;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

        if (!rateLimitEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIpAddress(request);
        String requestPath = request.getRequestURI();

        // 요청 유형에 따른 제한 설정
        int requestLimit = getRequestLimit(requestPath);
        String rateLimitKey = clientIp + ":" + getRateLimitCategory(requestPath);

        RateLimitInfo rateLimitInfo = rateLimitMap.computeIfAbsent(
            rateLimitKey,
            k -> new RateLimitInfo(requestLimit)
        );

        if (!rateLimitInfo.isAllowed()) {
            handleRateLimitExceeded(response, rateLimitInfo, clientIp, requestPath);
            return;
        }

        // Rate limit 헤더 추가
        response.setHeader("X-RateLimit-Limit", String.valueOf(requestLimit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(rateLimitInfo.getRemainingRequests()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(rateLimitInfo.getResetTime()));

        filterChain.doFilter(request, response);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    private int getRequestLimit(String requestPath) {
        // 인증 엔드포인트는 가장 엄격한 제한
        if (requestPath.contains("/login") || requestPath.contains("/register") ||
            requestPath.contains("/password") || requestPath.contains("/2fa")) {
            return loginRequestsPerMinute;
        }

        // 파일 업로드 엔드포인트
        if (requestPath.contains("/upload") || requestPath.contains("/file")) {
            return uploadRequestsPerMinute;
        }

        // API 엔드포인트
        if (requestPath.startsWith("/api/")) {
            return apiRequestsPerMinute;
        }

        return defaultRequestsPerMinute;
    }

    private String getRateLimitCategory(String requestPath) {
        if (requestPath.contains("/login") || requestPath.contains("/register") ||
            requestPath.contains("/password") || requestPath.contains("/2fa")) {
            return "auth";
        }
        if (requestPath.contains("/upload") || requestPath.contains("/file")) {
            return "upload";
        }
        if (requestPath.startsWith("/api/")) {
            return "api";
        }
        return "general";
    }

    /**
     * 로그인 실패 기록 (UserController에서 호출)
     */
    public void recordLoginFailure(String clientIp) {
        loginFailureMap.computeIfAbsent(clientIp, k -> new AtomicInteger(0)).incrementAndGet();
        log.warn("로그인 실패 기록: IP={}, 실패 횟수={}", clientIp, loginFailureMap.get(clientIp).get());
    }

    /**
     * 로그인 성공 시 실패 기록 초기화
     */
    public void clearLoginFailure(String clientIp) {
        loginFailureMap.remove(clientIp);
    }

    /**
     * IP 차단 여부 확인 (5회 이상 실패 시 15분 차단)
     */
    public boolean isBlocked(String clientIp) {
        AtomicInteger failures = loginFailureMap.get(clientIp);
        return failures != null && failures.get() >= 5;
    }

    private void handleRateLimitExceeded(HttpServletResponse response, RateLimitInfo rateLimitInfo,
                                       String clientIp, String requestPath) throws IOException {

        log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, requestPath);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.TOO_MANY_REQUESTS.value())
                .error(HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase())
                .message("요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.")
                .code("RATE_LIMIT_EXCEEDED")
                .path(requestPath)
                .build();

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("X-RateLimit-Limit", String.valueOf(rateLimitInfo.maxRequests));
        response.setHeader("X-RateLimit-Remaining", "0");
        response.setHeader("X-RateLimit-Reset", String.valueOf(rateLimitInfo.getResetTime()));
        response.setHeader("Retry-After", "60");

        objectMapper.writeValue(response.getWriter(), errorResponse);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();

        // H2 콘솔, 정적 파일, WebSocket 등은 rate limiting 제외
        return path.startsWith("/h2-console") ||
               path.startsWith("/uploads") ||
               path.startsWith("/ws") ||
               path.startsWith("/error") ||
               path.equals("/") ||
               "OPTIONS".equals(request.getMethod());
    }

    /**
     * 주기적으로 오래된 rate limit 정보 정리 (메모리 누수 방지)
     * 2분마다 실행
     */
    @Scheduled(fixedRate = 120000)
    public void cleanupExpiredEntries() {
        long currentTime = System.currentTimeMillis();
        int rateLimitRemoved = 0;
        int loginFailureRemoved = 0;

        // Rate limit 정보 정리 (5분 후)
        var rateLimitIterator = rateLimitMap.entrySet().iterator();
        while (rateLimitIterator.hasNext()) {
            var entry = rateLimitIterator.next();
            if (currentTime - entry.getValue().windowStart > 300000) {
                rateLimitIterator.remove();
                rateLimitRemoved++;
            }
        }

        // 로그인 실패 기록 정리 (15분 후)
        var loginFailureIterator = loginFailureMap.entrySet().iterator();
        while (loginFailureIterator.hasNext()) {
            loginFailureIterator.next();
            // 모든 실패 기록 15분 후 초기화
            loginFailureIterator.remove();
            loginFailureRemoved++;
        }

        if (rateLimitRemoved > 0 || loginFailureRemoved > 0) {
            log.debug("Rate limit 정리: rateLimitMap={}개 제거, loginFailureMap={}개 제거",
                    rateLimitRemoved, loginFailureRemoved);
        }
    }
}