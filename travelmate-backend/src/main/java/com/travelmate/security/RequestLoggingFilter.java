package com.travelmate.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final List<String> SENSITIVE_HEADERS = Arrays.asList(
        "authorization", "cookie", "set-cookie", "x-auth-token"
    );

    private static final List<String> SENSITIVE_PARAMS = Arrays.asList(
        "password", "token", "secret", "key"
    );

    // 로깅하지 않을 경로들
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
        "/actuator/health",
        "/favicon.ico",
        "/static/",
        "/css/",
        "/js/",
        "/images/"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        // 제외 경로 체크
        if (shouldSkipLogging(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();
        String requestId = generateRequestId();

        try {
            // 요청 로깅
            logRequest(wrappedRequest, requestId);
            
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            
            // 응답 로깅
            logResponse(wrappedRequest, wrappedResponse, requestId, duration);
            
            // 응답 내용을 실제 클라이언트에게 전송
            wrappedResponse.copyBodyToResponse();
        }
    }

    private void logRequest(ContentCachingRequestWrapper request, String requestId) {
        try {
            String clientIP = getClientIP(request);
            String userAgent = request.getHeader("User-Agent");
            String method = request.getMethod();
            String uri = request.getRequestURI();
            String queryString = request.getQueryString();
            
            // 요청 헤더 (민감 정보 제외)
            String headers = getFilteredHeaders(request);
            
            // 요청 파라미터 (민감 정보 제외)
            String parameters = getFilteredParameters(request);
            
            // 요청 본문 (POST/PUT 요청의 경우)
            String requestBody = getRequestBody(request);

            log.info("REQUEST [{}] {} {} from {} | Headers: {} | Params: {} | Body: {} | User-Agent: {}",
                requestId, method, uri + (queryString != null ? "?" + queryString : ""), 
                clientIP, headers, parameters, requestBody, userAgent);

            // 보안 관련 특별 로깅
            if (isSensitiveEndpoint(uri)) {
                log.warn("SECURITY [{}] Sensitive endpoint accessed: {} from {}", 
                    requestId, uri, clientIP);
            }

            // 관리자 API 접근 로깅
            if (uri.startsWith("/api/admin")) {
                log.warn("ADMIN_ACCESS [{}] Admin API accessed: {} from {} | User-Agent: {}", 
                    requestId, uri, clientIP, userAgent);
            }

        } catch (Exception e) {
            log.error("Error logging request: ", e);
        }
    }

    private void logResponse(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response,
                           String requestId, long duration) {
        try {
            int status = response.getStatus();
            String method = request.getMethod();
            String uri = request.getRequestURI();
            String clientIP = getClientIP(request);

            // 응답 헤더 (민감 정보 제외)
            String responseHeaders = getFilteredResponseHeaders(response);

            log.info("RESPONSE [{}] {} {} | Status: {} | Duration: {}ms | Headers: {}", 
                requestId, method, uri, status, duration, responseHeaders);

            // 에러 응답 특별 로깅
            if (status >= 400) {
                String responseBody = getResponseBody(response);
                log.warn("ERROR_RESPONSE [{}] {} {} | Status: {} | Duration: {}ms | Body: {} | Client: {}", 
                    requestId, method, uri, status, duration, responseBody, clientIP);
            }

            // 느린 응답 로깅 (3초 이상)
            if (duration > 3000) {
                log.warn("SLOW_RESPONSE [{}] {} {} | Duration: {}ms | Client: {}", 
                    requestId, method, uri, duration, clientIP);
            }

            // 의심스러운 활동 탐지
            if (isSuspiciousActivity(request, response, duration)) {
                log.error("SUSPICIOUS_ACTIVITY [{}] Potential security threat detected from {} | {} {} | Status: {} | Duration: {}ms", 
                    requestId, clientIP, method, uri, status, duration);
            }

        } catch (Exception e) {
            log.error("Error logging response: ", e);
        }
    }

    private boolean shouldSkipLogging(String uri) {
        return EXCLUDED_PATHS.stream().anyMatch(uri::startsWith);
    }

    private boolean isSensitiveEndpoint(String uri) {
        return uri.contains("/login") || 
               uri.contains("/register") || 
               uri.contains("/password") ||
               uri.contains("/auth") ||
               uri.contains("/token");
    }

    private boolean isSuspiciousActivity(ContentCachingRequestWrapper request, 
                                       ContentCachingResponseWrapper response, long duration) {
        // SQL 인젝션 패턴 감지
        String uri = request.getRequestURI();
        String queryString = request.getQueryString();
        
        if (queryString != null && (queryString.toLowerCase().contains("union") ||
                                   queryString.toLowerCase().contains("select") ||
                                   queryString.toLowerCase().contains("drop"))) {
            return true;
        }

        // XSS 패턴 감지
        if (uri.contains("<script>") || uri.contains("javascript:")) {
            return true;
        }

        // 무차별 대입 공격 감지 (로그인 실패가 많은 경우)
        if (uri.contains("/login") && response.getStatus() == 401) {
            return true;
        }

        // 디렉토리 트래버설 공격 감지
        if (uri.contains("../") || uri.contains("..\\")) {
            return true;
        }

        return false;
    }

    private String generateRequestId() {
        return "REQ-" + System.currentTimeMillis() + "-" + Thread.currentThread().getId();
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getFilteredHeaders(HttpServletRequest request) {
        return Collections.list(request.getHeaderNames()).stream()
            .filter(name -> !SENSITIVE_HEADERS.contains(name.toLowerCase()))
            .map(name -> name + "=" + request.getHeader(name))
            .collect(Collectors.joining(", "));
    }

    private String getFilteredResponseHeaders(ContentCachingResponseWrapper response) {
        return response.getHeaderNames().stream()
            .filter(name -> !SENSITIVE_HEADERS.contains(name.toLowerCase()))
            .map(name -> name + "=" + response.getHeader(name))
            .collect(Collectors.joining(", "));
    }

    private String getFilteredParameters(HttpServletRequest request) {
        return request.getParameterMap().entrySet().stream()
            .filter(entry -> !SENSITIVE_PARAMS.contains(entry.getKey().toLowerCase()))
            .map(entry -> entry.getKey() + "=" + Arrays.toString(entry.getValue()))
            .collect(Collectors.joining(", "));
    }

    private String getRequestBody(ContentCachingRequestWrapper request) {
        byte[] content = request.getContentAsByteArray();
        if (content.length > 0) {
            String body = new String(content);
            // 민감 정보 마스킹
            return maskSensitiveData(body);
        }
        return "";
    }

    private String getResponseBody(ContentCachingResponseWrapper response) {
        byte[] content = response.getContentAsByteArray();
        if (content.length > 0) {
            String body = new String(content);
            // 민감 정보 마스킹
            return maskSensitiveData(body);
        }
        return "";
    }

    private String maskSensitiveData(String data) {
        if (data == null) return "";
        
        // 패스워드 마스킹
        data = data.replaceAll("(\"password\"\\s*:\\s*\")[^\"]+", "$1***");
        
        // 토큰 마스킹
        data = data.replaceAll("(\"token\"\\s*:\\s*\")[^\"]+", "$1***");
        data = data.replaceAll("(\"accessToken\"\\s*:\\s*\")[^\"]+", "$1***");
        
        // 이메일 부분 마스킹
        data = data.replaceAll("([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})", "$1***@$2");
        
        return data;
    }
}