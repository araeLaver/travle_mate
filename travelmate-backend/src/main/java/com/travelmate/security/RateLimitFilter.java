package com.travelmate.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Rate Limiting Filter
 * 요청 빈도 제한을 통한 DoS 방지
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.security.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.security.rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    @Value("${app.security.rate-limit.auth-requests-per-minute:10}")
    private int authRequestsPerMinute;

    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, RateLimitBucket> authBuckets = new ConcurrentHashMap<>();

    // 인증 관련 엔드포인트 (더 엄격한 제한)
    private static final String[] AUTH_ENDPOINTS = {
        "/auth/login",
        "/users/login",
        "/users/register",
        "/users/request-password-reset"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientId = getClientIdentifier(request);
        String path = request.getRequestURI();

        // 인증 엔드포인트 여부 확인
        boolean isAuthEndpoint = isAuthEndpoint(path);

        // Rate limit 체크
        if (isRateLimited(clientId, isAuthEndpoint)) {
            log.warn("Rate limit exceeded for client: {} on path: {}", clientId, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"Too many requests\",\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIdentifier(HttpServletRequest request) {
        // X-Forwarded-For 헤더 확인 (프록시/로드밸런서 뒤에 있을 경우)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        // X-Real-IP 헤더 확인
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        // 기본 원격 주소
        return request.getRemoteAddr();
    }

    private boolean isAuthEndpoint(String path) {
        for (String endpoint : AUTH_ENDPOINTS) {
            if (path.contains(endpoint)) {
                return true;
            }
        }
        return false;
    }

    private boolean isRateLimited(String clientId, boolean isAuthEndpoint) {
        int limit = isAuthEndpoint ? authRequestsPerMinute : requestsPerMinute;
        Map<String, RateLimitBucket> targetBuckets = isAuthEndpoint ? authBuckets : buckets;

        RateLimitBucket bucket = targetBuckets.computeIfAbsent(clientId, k -> new RateLimitBucket());
        return !bucket.tryConsume(limit);
    }

    /**
     * Token Bucket 알고리즘 기반 Rate Limit 버킷
     */
    private static class RateLimitBucket {
        private final AtomicInteger tokens;
        private final AtomicLong lastRefillTime;
        private static final long REFILL_INTERVAL_MS = 60_000; // 1분

        public RateLimitBucket() {
            this.tokens = new AtomicInteger(0);
            this.lastRefillTime = new AtomicLong(System.currentTimeMillis());
        }

        public synchronized boolean tryConsume(int limit) {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTime.get();

            // 1분 이상 지났으면 토큰 리필
            if (elapsed >= REFILL_INTERVAL_MS) {
                tokens.set(0);
                lastRefillTime.set(now);
            }

            // 현재 토큰 수가 제한을 초과하면 거부
            if (tokens.get() >= limit) {
                return false;
            }

            // 토큰 소비
            tokens.incrementAndGet();
            return true;
        }
    }

    /**
     * 주기적으로 오래된 버킷 정리
     */
    @jakarta.annotation.PostConstruct
    public void startCleanupTask() {
        Thread cleanupThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    Thread.sleep(300_000); // 5분마다
                    cleanupOldBuckets();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        cleanupThread.setDaemon(true);
        cleanupThread.setName("rate-limit-cleanup");
        cleanupThread.start();
    }

    private void cleanupOldBuckets() {
        long now = System.currentTimeMillis();
        long threshold = 300_000; // 5분

        buckets.entrySet().removeIf(entry -> {
            RateLimitBucket bucket = entry.getValue();
            return (now - bucket.lastRefillTime.get()) > threshold;
        });

        authBuckets.entrySet().removeIf(entry -> {
            RateLimitBucket bucket = entry.getValue();
            return (now - bucket.lastRefillTime.get()) > threshold;
        });

        log.debug("Rate limit buckets cleaned up. Current size - general: {}, auth: {}",
                buckets.size(), authBuckets.size());
    }
}
