package com.travelmate.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.MDC;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Optional;

/**
 * 보안 관련 이벤트 로깅을 위한 AOP
 */
@Aspect
@Component
@Slf4j(topic = "com.travelmate.security")
public class SecurityLoggingAspect {

    /**
     * 인증이 필요한 Controller 메서드 접근 로깅
     */
    @Before("execution(* com.travelmate.controller..*(..)) && " +
            "@annotation(org.springframework.security.access.prepost.PreAuthorize)")
    public void logSecureEndpointAccess(JoinPoint joinPoint) {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth != null && auth.isAuthenticated() ? auth.getName() : "anonymous";
        String clientIP = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String methodName = joinPoint.getSignature().toShortString();

        // MDC에 보안 관련 정보 추가
        MDC.put("userId", userId);
        MDC.put("clientIP", clientIP);
        MDC.put("endpoint", uri);

        log.info("SECURE_ACCESS: 사용자 {} ({})가 보안 엔드포인트 접근 - {} {} | 메서드: {} | User-Agent: {}",
                userId, clientIP, method, uri, methodName, sanitizeUserAgent(userAgent));
    }

    /**
     * 권한 부족으로 접근이 거부된 경우 로깅
     */
    @AfterThrowing(pointcut = "execution(* com.travelmate.controller..*(..))", 
                  throwing = "ex")
    public void logAccessDenied(JoinPoint joinPoint, AccessDeniedException ex) {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth != null && auth.isAuthenticated() ? auth.getName() : "anonymous";
        String clientIP = getClientIP(request);
        String method = request.getMethod();
        String uri = request.getRequestURI();

        log.warn("ACCESS_DENIED: 사용자 {} ({})의 {} {} 접근이 거부됨 - 이유: {}",
                userId, clientIP, method, uri, ex.getMessage());
    }

    /**
     * 관리자 기능 접근 로깅
     */
    @Before("execution(* com.travelmate.controller..*(..)) && " +
           "within(@org.springframework.security.access.prepost.PreAuthorize *)")
    public void logAdminAccess(JoinPoint joinPoint) {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) return;

        String uri = request.getRequestURI();
        if (!uri.contains("/admin")) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth != null ? auth.getName() : "unknown";
        String clientIP = getClientIP(request);
        String method = request.getMethod();

        log.warn("ADMIN_ACCESS: 관리자 {} ({})가 관리 기능 접근 - {} {} | 파라미터: {}",
                userId, clientIP, method, uri, Arrays.toString(joinPoint.getArgs()));
    }

    /**
     * 민감한 데이터 조회 로깅 (사용자 정보, 개인정보 등)
     */
    @AfterReturning(pointcut = "execution(* com.travelmate.service.UserService.findById(..))", 
                    returning = "result")
    public void logSensitiveDataAccess(JoinPoint joinPoint, Object result) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = auth != null ? auth.getName() : "unknown";
        Object[] args = joinPoint.getArgs();
        String targetUserId = args.length > 0 ? args[0].toString() : "unknown";

        HttpServletRequest request = getCurrentRequest();
        String clientIP = request != null ? getClientIP(request) : "unknown";

        // 자신의 정보가 아닌 다른 사용자 정보 조회 시 로깅
        if (!currentUserId.equals(targetUserId)) {
            log.warn("SENSITIVE_DATA_ACCESS: 사용자 {} ({})가 다른 사용자 {} 정보 조회",
                    currentUserId, clientIP, targetUserId);
        }
    }

    /**
     * 파일 업로드 보안 로깅
     */
    @Before("execution(* com.travelmate.service.FileUploadService.*(..))")
    public void logFileUpload(JoinPoint joinPoint) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth != null ? auth.getName() : "anonymous";
        HttpServletRequest request = getCurrentRequest();
        String clientIP = request != null ? getClientIP(request) : "unknown";

        log.info("FILE_UPLOAD: 사용자 {} ({})가 파일 업로드 시도 - 메서드: {}",
                userId, clientIP, joinPoint.getSignature().toShortString());
    }

    /**
     * 로그인 시도 로깅 (성공/실패)
     */
    @AfterReturning(pointcut = "execution(* com.travelmate.service.UserService.login(..))", 
                    returning = "result")
    public void logLoginSuccess(JoinPoint joinPoint, Object result) {
        HttpServletRequest request = getCurrentRequest();
        String clientIP = request != null ? getClientIP(request) : "unknown";
        String userAgent = request != null ? request.getHeader("User-Agent") : "unknown";
        
        Object[] args = joinPoint.getArgs();
        String email = args.length > 0 ? args[0].toString() : "unknown";

        log.info("LOGIN_SUCCESS: 사용자 {} 로그인 성공 - IP: {} | User-Agent: {}",
                email, clientIP, sanitizeUserAgent(userAgent));
    }

    @AfterThrowing(pointcut = "execution(* com.travelmate.service.UserService.login(..))", 
                  throwing = "ex")
    public void logLoginFailure(JoinPoint joinPoint, Exception ex) {
        HttpServletRequest request = getCurrentRequest();
        String clientIP = request != null ? getClientIP(request) : "unknown";
        String userAgent = request != null ? request.getHeader("User-Agent") : "unknown";
        
        Object[] args = joinPoint.getArgs();
        String email = args.length > 0 ? args[0].toString() : "unknown";

        log.warn("LOGIN_FAILURE: 사용자 {} 로그인 실패 - IP: {} | 이유: {} | User-Agent: {}",
                email, clientIP, ex.getMessage(), sanitizeUserAgent(userAgent));
    }

    // 유틸리티 메서드들

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }

    private String sanitizeUserAgent(String userAgent) {
        if (userAgent == null) return "unknown";
        
        // User-Agent 길이 제한 및 특수 문자 제거
        String sanitized = userAgent.length() > 200 ? userAgent.substring(0, 200) : userAgent;
        return sanitized.replaceAll("[\\r\\n\\t]", " ");
    }
}