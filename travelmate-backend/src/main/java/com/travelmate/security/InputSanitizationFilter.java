package com.travelmate.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 입력값 정제 필터
 * 요청 파라미터에서 XSS 패턴을 제거
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Slf4j
public class InputSanitizationFilter extends OncePerRequestFilter {

    // SQL Injection 패턴
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "('(''|[^'])*')|" +
        "(;)|" +
        "(--)|" +
        "(/\\*)|" +
        "(\\*/)|" +
        "(\\bunion\\b)|" +
        "(\\bselect\\b)|" +
        "(\\binsert\\b)|" +
        "(\\bupdate\\b)|" +
        "(\\bdelete\\b)|" +
        "(\\bdrop\\b)|" +
        "(\\btruncate\\b)|" +
        "(\\bexec\\b)|" +
        "(\\bexecute\\b)|" +
        "(\\bxp_\\b)",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // 파일 업로드 요청은 스킵
        String contentType = request.getContentType();
        if (contentType != null && contentType.contains("multipart/form-data")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 래핑된 요청으로 진행
        SanitizedRequestWrapper sanitizedRequest = new SanitizedRequestWrapper(request);
        filterChain.doFilter(sanitizedRequest, response);
    }

    /**
     * 정제된 요청 래퍼
     */
    private static class SanitizedRequestWrapper extends HttpServletRequestWrapper {

        private final Map<String, String[]> sanitizedParams;

        public SanitizedRequestWrapper(HttpServletRequest request) {
            super(request);
            this.sanitizedParams = sanitizeParameters(request.getParameterMap());
        }

        private Map<String, String[]> sanitizeParameters(Map<String, String[]> params) {
            Map<String, String[]> sanitized = new HashMap<>();

            for (Map.Entry<String, String[]> entry : params.entrySet()) {
                String[] values = entry.getValue();
                String[] sanitizedValues = new String[values.length];

                for (int i = 0; i < values.length; i++) {
                    sanitizedValues[i] = sanitizeValue(values[i]);
                }

                sanitized.put(entry.getKey(), sanitizedValues);
            }

            return sanitized;
        }

        private String sanitizeValue(String value) {
            if (value == null) {
                return null;
            }

            // XSS 패턴 제거
            String result = XssUtils.sanitize(value);

            // HTML 엔티티로 인코딩 (추가 보호)
            // 단, JSON body나 특정 필드는 제외해야 할 수 있음
            // result = XssUtils.escapeHtml(result);

            return result;
        }

        @Override
        public String getParameter(String name) {
            String[] values = sanitizedParams.get(name);
            return (values != null && values.length > 0) ? values[0] : null;
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            return Collections.unmodifiableMap(sanitizedParams);
        }

        @Override
        public Enumeration<String> getParameterNames() {
            return Collections.enumeration(sanitizedParams.keySet());
        }

        @Override
        public String[] getParameterValues(String name) {
            return sanitizedParams.get(name);
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            // 특정 헤더만 정제
            if ("Referer".equalsIgnoreCase(name) || "User-Agent".equalsIgnoreCase(name)) {
                return sanitizeValue(value);
            }
            return value;
        }
    }

    /**
     * SQL Injection 패턴 감지
     */
    public static boolean containsSqlInjection(String input) {
        if (input == null) {
            return false;
        }
        return SQL_INJECTION_PATTERN.matcher(input).find();
    }
}
