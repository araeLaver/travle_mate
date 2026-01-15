package com.travelmate.security;

import java.util.regex.Pattern;

/**
 * XSS (Cross-Site Scripting) 방지 유틸리티
 */
public final class XssUtils {

    private XssUtils() {
        // 유틸리티 클래스
    }

    // 위험한 HTML 태그 패턴
    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
        "<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final Pattern SCRIPT_SRC_PATTERN = Pattern.compile(
        "src[\\s]*=[\\s]*'(.*?)'", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

    private static final Pattern SCRIPT_SRC_DOUBLE_QUOTE_PATTERN = Pattern.compile(
        "src[\\s]*=[\\s]*\"(.*?)\"", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

    private static final Pattern EVENT_HANDLER_PATTERN = Pattern.compile(
        "on\\w+\\s*=\\s*['\"][^'\"]*['\"]", Pattern.CASE_INSENSITIVE);

    private static final Pattern EVAL_PATTERN = Pattern.compile(
        "eval\\s*\\([^)]*\\)", Pattern.CASE_INSENSITIVE);

    private static final Pattern EXPRESSION_PATTERN = Pattern.compile(
        "expression\\s*\\([^)]*\\)", Pattern.CASE_INSENSITIVE);

    private static final Pattern JAVASCRIPT_PATTERN = Pattern.compile(
        "javascript:", Pattern.CASE_INSENSITIVE);

    private static final Pattern VBSCRIPT_PATTERN = Pattern.compile(
        "vbscript:", Pattern.CASE_INSENSITIVE);

    private static final Pattern DATA_PATTERN = Pattern.compile(
        "data:", Pattern.CASE_INSENSITIVE);

    /**
     * XSS 패턴 제거
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }

        String result = input;

        // 스크립트 태그 제거
        result = SCRIPT_PATTERN.matcher(result).replaceAll("");

        // src 속성에서 위험한 패턴 제거
        result = SCRIPT_SRC_PATTERN.matcher(result).replaceAll("");
        result = SCRIPT_SRC_DOUBLE_QUOTE_PATTERN.matcher(result).replaceAll("");

        // 이벤트 핸들러 제거
        result = EVENT_HANDLER_PATTERN.matcher(result).replaceAll("");

        // eval 제거
        result = EVAL_PATTERN.matcher(result).replaceAll("");

        // expression 제거
        result = EXPRESSION_PATTERN.matcher(result).replaceAll("");

        // javascript: 제거
        result = JAVASCRIPT_PATTERN.matcher(result).replaceAll("");

        // vbscript: 제거
        result = VBSCRIPT_PATTERN.matcher(result).replaceAll("");

        // data: URL scheme 제거 (base64 인코딩 공격 방지)
        result = DATA_PATTERN.matcher(result).replaceAll("");

        return result;
    }

    /**
     * HTML 엔티티 인코딩
     */
    public static String escapeHtml(String input) {
        if (input == null) {
            return null;
        }

        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;")
            .replace("/", "&#47;");
    }

    /**
     * 문자열에 XSS 패턴이 있는지 검사
     */
    public static boolean containsXss(String input) {
        if (input == null) {
            return false;
        }

        return SCRIPT_PATTERN.matcher(input).find() ||
               EVENT_HANDLER_PATTERN.matcher(input).find() ||
               EVAL_PATTERN.matcher(input).find() ||
               EXPRESSION_PATTERN.matcher(input).find() ||
               JAVASCRIPT_PATTERN.matcher(input).find() ||
               VBSCRIPT_PATTERN.matcher(input).find();
    }

    /**
     * URL 인코딩 (Query String 안전)
     */
    public static String sanitizeUrl(String url) {
        if (url == null) {
            return null;
        }

        // javascript:, data:, vbscript: 스킴 차단
        String lowerUrl = url.toLowerCase().trim();
        if (lowerUrl.startsWith("javascript:") ||
            lowerUrl.startsWith("data:") ||
            lowerUrl.startsWith("vbscript:")) {
            return "";
        }

        return sanitize(url);
    }

    /**
     * 파일 이름 정제 (경로 조작 방지)
     */
    public static String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return null;
        }

        // 경로 구분자와 null 바이트 제거
        return fileName
            .replaceAll("[/\\\\]", "")
            .replace("\0", "")
            .replace("..", "");
    }
}
