package com.travelmate.security;

import com.travelmate.security.audit.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 보안 관련 예외 처리기
 */
@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class SecurityExceptionHandler {

    private final SecurityAuditService securityAuditService;

    /**
     * 인증 실패 처리
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {

        String reason = determineAuthFailureReason(ex);
        securityAuditService.logAuthenticationFailure("unknown", reason, request);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(createErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "인증에 실패했습니다",
                request.getRequestURI()
            ));
    }

    /**
     * 잘못된 자격 증명
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentialsException(
            BadCredentialsException ex, HttpServletRequest request) {

        securityAuditService.logAuthenticationFailure("unknown", "잘못된 자격 증명", request);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(createErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "이메일 또는 비밀번호가 올바르지 않습니다",
                request.getRequestURI()
            ));
    }

    /**
     * 계정 잠김
     */
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<Map<String, Object>> handleLockedException(
            LockedException ex, HttpServletRequest request) {

        securityAuditService.logAuthenticationFailure("unknown", "계정 잠김", request);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(createErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "계정이 잠겨 있습니다. 관리자에게 문의하세요",
                request.getRequestURI()
            ));
    }

    /**
     * 계정 비활성화
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabledException(
            DisabledException ex, HttpServletRequest request) {

        securityAuditService.logAuthenticationFailure("unknown", "계정 비활성화", request);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(createErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "계정이 비활성화되어 있습니다",
                request.getRequestURI()
            ));
    }

    /**
     * 접근 거부
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {

        securityAuditService.logAccessDenied("unknown", request.getRequestURI(), request);

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(createErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "접근 권한이 없습니다",
                request.getRequestURI()
            ));
    }

    /**
     * 인증 실패 원인 분석
     */
    private String determineAuthFailureReason(AuthenticationException ex) {
        if (ex instanceof BadCredentialsException) {
            return "잘못된 자격 증명";
        } else if (ex instanceof LockedException) {
            return "계정 잠김";
        } else if (ex instanceof DisabledException) {
            return "계정 비활성화";
        } else {
            return ex.getMessage();
        }
    }

    /**
     * 에러 응답 생성
     */
    private Map<String, Object> createErrorResponse(int status, String message, String path) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("timestamp", LocalDateTime.now().toString());
        error.put("status", status);
        error.put("error", HttpStatus.valueOf(status).getReasonPhrase());
        error.put("message", message);
        error.put("path", path);
        return error;
    }
}
