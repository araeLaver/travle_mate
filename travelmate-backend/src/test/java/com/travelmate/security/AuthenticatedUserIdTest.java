package com.travelmate.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.security.Principal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("AuthenticatedUserId 테스트")
class AuthenticatedUserIdTest {

    @Test
    @DisplayName("parse - 숫자 principal을 사용자 ID로 변환")
    void parse_ValidPrincipal() {
        assertThat(AuthenticatedUserId.parse("123")).isEqualTo(123L);
    }

    @Test
    @DisplayName("parse - null/blank principal 거부")
    void parse_MissingPrincipalRejected() {
        assertThatThrownBy(() -> AuthenticatedUserId.parse((String) null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Authenticated user principal is required");
        assertThatThrownBy(() -> AuthenticatedUserId.parse("  "))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Authenticated user principal is required");
    }

    @Test
    @DisplayName("parse - 숫자가 아닌 principal 거부")
    void parse_InvalidPrincipalRejected() {
        assertThatThrownBy(() -> AuthenticatedUserId.parse("abc"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Invalid authenticated user principal");
    }

    @Test
    @DisplayName("parse - principal 객체에서 사용자 ID 추출")
    void parse_ValidPrincipalObject() {
        Principal principal = () -> "456";

        assertThat(AuthenticatedUserId.parse(principal)).isEqualTo(456L);
    }

    @Test
    @DisplayName("parse - principal 객체 누락 시 지정 메시지로 거부")
    void parse_MissingPrincipalObjectRejectedWithCustomMessage() {
        assertThatThrownBy(() -> AuthenticatedUserId.parse((Principal) null, "missing", "invalid"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("missing");
    }
}
