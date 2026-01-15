package com.travelmate.security.validation;

import com.travelmate.security.XssUtils;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * SafeText 어노테이션 검증기
 */
public class SafeTextValidator implements ConstraintValidator<SafeText, String> {

    private boolean allowHtml;
    private int maxLength;

    @Override
    public void initialize(SafeText constraintAnnotation) {
        this.allowHtml = constraintAnnotation.allowHtml();
        this.maxLength = constraintAnnotation.maxLength();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // null은 @NotNull로 처리
        }

        // 길이 검증
        if (value.length() > maxLength) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "텍스트가 최대 길이(" + maxLength + ")를 초과했습니다"
            ).addConstraintViolation();
            return false;
        }

        // XSS 패턴 검증
        if (!allowHtml && XssUtils.containsXss(value)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "잠재적으로 위험한 스크립트가 포함되어 있습니다"
            ).addConstraintViolation();
            return false;
        }

        // Null 바이트 검증
        if (value.contains("\0")) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "잘못된 문자가 포함되어 있습니다"
            ).addConstraintViolation();
            return false;
        }

        return true;
    }
}
