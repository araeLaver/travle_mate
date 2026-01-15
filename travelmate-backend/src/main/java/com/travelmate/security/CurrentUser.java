package com.travelmate.security;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.lang.annotation.*;

/**
 * 현재 인증된 사용자의 UserPrincipal을 주입받기 위한 어노테이션
 * @AuthenticationPrincipal의 메타 어노테이션으로 사용
 */
@Target({ElementType.PARAMETER, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal
public @interface CurrentUser {
}
