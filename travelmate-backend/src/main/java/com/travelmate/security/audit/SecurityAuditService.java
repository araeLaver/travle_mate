package com.travelmate.security.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 보안 감사 로깅 서비스
 */
@Service
@Slf4j
public class SecurityAuditService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    /**
     * 인증 성공 로깅
     */
    @Async
    public void logAuthenticationSuccess(String username, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        log.info("[SECURITY_AUDIT] AUTH_SUCCESS | time={} | user={} | ip={} | userAgent={}",
            getCurrentTime(), username, clientIp, sanitizeLogValue(userAgent));
    }

    /**
     * 인증 실패 로깅
     */
    @Async
    public void logAuthenticationFailure(String username, String reason, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        log.warn("[SECURITY_AUDIT] AUTH_FAILURE | time={} | user={} | reason={} | ip={} | userAgent={}",
            getCurrentTime(), username, reason, clientIp, sanitizeLogValue(userAgent));
    }

    /**
     * 접근 거부 로깅
     */
    @Async
    public void logAccessDenied(String username, String resource, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String method = request.getMethod();

        log.warn("[SECURITY_AUDIT] ACCESS_DENIED | time={} | user={} | resource={} | method={} | ip={}",
            getCurrentTime(), username, resource, method, clientIp);
    }

    /**
     * Rate Limit 초과 로깅
     */
    @Async
    public void logRateLimitExceeded(String clientId, String path, HttpServletRequest request) {
        log.warn("[SECURITY_AUDIT] RATE_LIMIT_EXCEEDED | time={} | clientId={} | path={} | ip={}",
            getCurrentTime(), clientId, path, getClientIp(request));
    }

    /**
     * 의심스러운 활동 로깅
     */
    @Async
    public void logSuspiciousActivity(String type, String details, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        String path = request.getRequestURI();

        log.warn("[SECURITY_AUDIT] SUSPICIOUS_ACTIVITY | time={} | type={} | details={} | path={} | ip={} | userAgent={}",
            getCurrentTime(), type, sanitizeLogValue(details), path, clientIp, sanitizeLogValue(userAgent));
    }

    /**
     * XSS 시도 로깅
     */
    @Async
    public void logXssAttempt(String field, String value, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        log.warn("[SECURITY_AUDIT] XSS_ATTEMPT | time={} | field={} | path={} | ip={} | value={}",
            getCurrentTime(), field, path, clientIp, truncate(sanitizeLogValue(value), 200));
    }

    /**
     * SQL Injection 시도 로깅
     */
    @Async
    public void logSqlInjectionAttempt(String field, String value, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        log.warn("[SECURITY_AUDIT] SQL_INJECTION_ATTEMPT | time={} | field={} | path={} | ip={} | value={}",
            getCurrentTime(), field, path, clientIp, truncate(sanitizeLogValue(value), 200));
    }

    /**
     * 비밀번호 변경 로깅
     */
    @Async
    public void logPasswordChange(Long userId, String username, HttpServletRequest request) {
        String clientIp = getClientIp(request);

        log.info("[SECURITY_AUDIT] PASSWORD_CHANGED | time={} | userId={} | user={} | ip={}",
            getCurrentTime(), userId, username, clientIp);
    }

    /**
     * 권한 변경 로깅
     */
    @Async
    public void logPermissionChange(Long targetUserId, String targetUsername, String action, String actor, HttpServletRequest request) {
        String clientIp = getClientIp(request);

        log.info("[SECURITY_AUDIT] PERMISSION_CHANGED | time={} | targetUser={} | targetUserId={} | action={} | actor={} | ip={}",
            getCurrentTime(), targetUsername, targetUserId, action, actor, clientIp);
    }

    /**
     * 데이터 접근 로깅 (민감한 데이터)
     */
    @Async
    public void logSensitiveDataAccess(String username, String dataType, String dataId, HttpServletRequest request) {
        String clientIp = getClientIp(request);

        log.info("[SECURITY_AUDIT] SENSITIVE_DATA_ACCESS | time={} | user={} | dataType={} | dataId={} | ip={}",
            getCurrentTime(), username, dataType, dataId, clientIp);
    }

    /**
     * 토큰 무효화 로깅
     */
    @Async
    public void logTokenInvalidation(String username, String reason, HttpServletRequest request) {
        String clientIp = getClientIp(request);

        log.info("[SECURITY_AUDIT] TOKEN_INVALIDATED | time={} | user={} | reason={} | ip={}",
            getCurrentTime(), username, reason, clientIp);
    }

    /**
     * 로그아웃 로깅
     */
    @Async
    public void logLogout(String username, HttpServletRequest request) {
        String clientIp = getClientIp(request);

        log.info("[SECURITY_AUDIT] LOGOUT | time={} | user={} | ip={}",
            getCurrentTime(), username, clientIp);
    }

    /**
     * 클라이언트 IP 추출
     */
    private String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

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

    /**
     * 현재 시간 문자열
     */
    private String getCurrentTime() {
        return LocalDateTime.now().format(FORMATTER);
    }

    /**
     * 로그 값 정제 (로그 인젝션 방지)
     */
    private String sanitizeLogValue(String value) {
        if (value == null) {
            return "null";
        }
        // 개행 문자, 캐리지 리턴 제거
        return value.replaceAll("[\\n\\r\\t]", "_");
    }

    /**
     * 문자열 자르기
     */
    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...[truncated]";
    }
}
