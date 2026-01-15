package com.travelmate.security.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 안전한 URL 검증 어노테이션
 * javascript:, data:, vbscript: 등 위험한 스킴 차단
 */
@Documented
@Constraint(validatedBy = SafeUrlValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeUrl {

    String message() default "안전하지 않은 URL 형식입니다";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    /**
     * 허용할 스킴 (기본: http, https)
     */
    String[] allowedSchemes() default {"http", "https"};

    /**
     * 빈 문자열 허용 여부
     */
    boolean allowEmpty() default true;
}
