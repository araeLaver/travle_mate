package com.travelmate.security;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 비밀번호 정책 검증 유틸리티
 */
public final class PasswordPolicy {

    private PasswordPolicy() {
        // 유틸리티 클래스
    }

    // 최소 길이
    public static final int MIN_LENGTH = 8;
    // 최대 길이
    public static final int MAX_LENGTH = 128;

    // 패턴
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*(),.?\":{}|<>]");
    private static final Pattern CONSECUTIVE_CHARS_PATTERN = Pattern.compile("(.)\\1{2,}");

    // 흔한 비밀번호 목록 (일부)
    private static final List<String> COMMON_PASSWORDS = List.of(
        "password", "123456", "12345678", "qwerty", "abc123",
        "password123", "admin", "letmein", "welcome", "monkey",
        "1234567890", "password1", "iloveyou", "sunshine", "princess"
    );

    /**
     * 비밀번호 정책 검증 결과
     */
    public static class ValidationResult {
        private final boolean valid;
        private final List<String> violations;

        public ValidationResult(boolean valid, List<String> violations) {
            this.valid = valid;
            this.violations = violations;
        }

        public boolean isValid() {
            return valid;
        }

        public List<String> getViolations() {
            return violations;
        }
    }

    /**
     * 비밀번호 정책 검증
     */
    public static ValidationResult validate(String password) {
        List<String> violations = new ArrayList<>();

        if (password == null) {
            violations.add("비밀번호가 필요합니다");
            return new ValidationResult(false, violations);
        }

        // 길이 검증
        if (password.length() < MIN_LENGTH) {
            violations.add("비밀번호는 최소 " + MIN_LENGTH + "자 이상이어야 합니다");
        }

        if (password.length() > MAX_LENGTH) {
            violations.add("비밀번호는 최대 " + MAX_LENGTH + "자까지 가능합니다");
        }

        // 대문자 포함
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            violations.add("대문자를 1개 이상 포함해야 합니다");
        }

        // 소문자 포함
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            violations.add("소문자를 1개 이상 포함해야 합니다");
        }

        // 숫자 포함
        if (!DIGIT_PATTERN.matcher(password).find()) {
            violations.add("숫자를 1개 이상 포함해야 합니다");
        }

        // 특수문자 포함
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            violations.add("특수문자를 1개 이상 포함해야 합니다 (!@#$%^&*(),.?\":{}|<>)");
        }

        // 연속 문자 검증
        if (CONSECUTIVE_CHARS_PATTERN.matcher(password).find()) {
            violations.add("동일한 문자가 3회 이상 연속될 수 없습니다");
        }

        // 흔한 비밀번호 검증
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            violations.add("너무 흔한 비밀번호입니다. 다른 비밀번호를 사용하세요");
        }

        return new ValidationResult(violations.isEmpty(), violations);
    }

    /**
     * 비밀번호 강도 계산 (0-100)
     */
    public static int calculateStrength(String password) {
        if (password == null || password.isEmpty()) {
            return 0;
        }

        int score = 0;

        // 길이 점수 (최대 30점)
        score += Math.min(password.length() * 2, 30);

        // 대문자 (10점)
        if (UPPERCASE_PATTERN.matcher(password).find()) {
            score += 10;
        }

        // 소문자 (10점)
        if (LOWERCASE_PATTERN.matcher(password).find()) {
            score += 10;
        }

        // 숫자 (10점)
        if (DIGIT_PATTERN.matcher(password).find()) {
            score += 10;
        }

        // 특수문자 (20점)
        if (SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            score += 20;
        }

        // 다양성 보너스 (최대 20점)
        long uniqueChars = password.chars().distinct().count();
        score += (int) Math.min(uniqueChars * 2, 20);

        // 패널티: 연속 문자
        if (CONSECUTIVE_CHARS_PATTERN.matcher(password).find()) {
            score -= 10;
        }

        // 패널티: 흔한 비밀번호
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            score -= 30;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * 강도에 따른 레벨
     */
    public static String getStrengthLevel(int strength) {
        if (strength >= 80) return "매우 강함";
        if (strength >= 60) return "강함";
        if (strength >= 40) return "보통";
        if (strength >= 20) return "약함";
        return "매우 약함";
    }
}
