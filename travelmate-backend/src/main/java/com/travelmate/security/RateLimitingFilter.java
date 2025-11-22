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

@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${app.security.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${app.security.rate-limit.default-requests-per-minute:60}")
    private int defaultRequestsPerMinute;

    @Value("${app.security.rate-limit.login-requests-per-minute:5}")
    private int loginRequestsPerMinute;

    private final ConcurrentHashMap<String, RateLimitInfo> rateLimitMap = new ConcurrentHashMap<>();
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
        // 로그인/회원가입 엔드포인트는 더 엄격한 제한
        if (requestPath.contains("/login") || requestPath.contains("/register")) {
            return loginRequestsPerMinute;
        }

        return defaultRequestsPerMinute;
    }

    private String getRateLimitCategory(String requestPath) {
        if (requestPath.contains("/login") || requestPath.contains("/register")) {
            return "auth";
        }
        return "general";
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

    // 주기적으로 오래된 rate limit 정보 정리 (메모리 누수 방지)
    public void cleanupExpiredEntries() {
        long currentTime = System.currentTimeMillis();
        rateLimitMap.entrySet().removeIf(entry -> {
            RateLimitInfo info = entry.getValue();
            return currentTime - info.windowStart > 300000; // 5분 후 정리
        });
    }
}