package com.travelmate.security.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * SafeUrl 어노테이션 검증기
 */
public class SafeUrlValidator implements ConstraintValidator<SafeUrl, String> {

    private Set<String> allowedSchemes;
    private boolean allowEmpty;

    // 위험한 스킴
    private static final Set<String> DANGEROUS_SCHEMES = Set.of(
        "javascript", "data", "vbscript", "file"
    );

    @Override
    public void initialize(SafeUrl constraintAnnotation) {
        this.allowedSchemes = Arrays.stream(constraintAnnotation.allowedSchemes())
            .map(String::toLowerCase)
            .collect(Collectors.toSet());
        this.allowEmpty = constraintAnnotation.allowEmpty();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // null은 @NotNull로 처리
        }

        if (value.isBlank()) {
            return allowEmpty;
        }

        String trimmedUrl = value.trim().toLowerCase();

        // 위험한 스킴 차단
        for (String dangerous : DANGEROUS_SCHEMES) {
            if (trimmedUrl.startsWith(dangerous + ":")) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    "허용되지 않는 URL 스킴입니다: " + dangerous
                ).addConstraintViolation();
                return false;
            }
        }

        // URL 파싱 검증
        try {
            URL url = new URL(value);
            String scheme = url.getProtocol().toLowerCase();

            if (!allowedSchemes.contains(scheme)) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    "허용되지 않는 URL 스킴입니다. 허용: " + String.join(", ", allowedSchemes)
                ).addConstraintViolation();
                return false;
            }

            return true;
        } catch (MalformedURLException e) {
            // 상대 URL 허용
            if (value.startsWith("/") && !value.startsWith("//")) {
                return true;
            }

            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "올바른 URL 형식이 아닙니다"
            ).addConstraintViolation();
            return false;
        }
    }
}
