package com.travelmate.security.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * XSS 공격 방지를 위한 안전한 텍스트 검증 어노테이션
 */
@Documented
@Constraint(validatedBy = SafeTextValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeText {

    String message() default "잠재적으로 위험한 문자열이 포함되어 있습니다";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    /**
     * HTML 태그 허용 여부
     */
    boolean allowHtml() default false;

    /**
     * 최대 길이
     */
    int maxLength() default 10000;
}
