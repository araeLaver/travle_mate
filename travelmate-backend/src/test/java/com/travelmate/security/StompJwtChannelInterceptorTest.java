package com.travelmate.security;

import com.travelmate.service.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

import java.security.Principal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("StompJwtChannelInterceptor 테스트")
class StompJwtChannelInterceptorTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private MessageChannel channel;

    @InjectMocks
    private StompJwtChannelInterceptor interceptor;

    @Test
    @DisplayName("CONNECT - 유효한 Bearer 토큰이면 STOMP principal 설정")
    void preSend_ConnectWithValidToken_SetsPrincipal() {
        // Given
        when(jwtService.validateToken("fresh-token")).thenReturn(true);
        when(jwtService.getUserIdFromToken("fresh-token")).thenReturn(42L);
        when(jwtService.getAuthoritiesFromToken("fresh-token")).thenReturn(List.of("ROLE_USER"));

        Message<byte[]> message = stompMessage(StompCommand.CONNECT, "Bearer fresh-token");

        // When
        Message<?> result = interceptor.preSend(message, channel);

        // Then
        Principal principal = StompHeaderAccessor.wrap(result).getUser();
        assertThat(principal).isNotNull();
        assertThat(principal.getName()).isEqualTo("42");

        verify(jwtService).validateToken("fresh-token");
        verify(jwtService).getUserIdFromToken("fresh-token");
        verify(jwtService).getAuthoritiesFromToken("fresh-token");
    }

    @Test
    @DisplayName("CONNECT - Authorization 헤더가 없으면 차단")
    void preSend_ConnectWithoutAuthorization_ThrowsAccessDenied() {
        // Given
        Message<byte[]> message = stompMessage(StompCommand.CONNECT, null);

        // When & Then
        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Valid STOMP authorization is required");

        verify(jwtService, never()).validateToken(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("CONNECT - 유효하지 않은 토큰이면 차단")
    void preSend_ConnectWithInvalidToken_ThrowsAccessDenied() {
        // Given
        when(jwtService.validateToken("expired-token")).thenReturn(false);
        Message<byte[]> message = stompMessage(StompCommand.CONNECT, "Bearer expired-token");

        // When & Then
        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Valid STOMP authorization is required");

        verify(jwtService).validateToken("expired-token");
        verify(jwtService, never()).getUserIdFromToken("expired-token");
    }

    @Test
    @DisplayName("CONNECT 외 메시지는 JWT 검사 없이 통과")
    void preSend_NonConnect_PassesThrough() {
        // Given
        Message<byte[]> message = stompMessage(StompCommand.SEND, null);

        // When
        Message<?> result = interceptor.preSend(message, channel);

        // Then
        assertThat(result).isSameAs(message);
        verifyNoInteractions(jwtService);
    }

    private Message<byte[]> stompMessage(StompCommand command, String authorizationHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (authorizationHeader != null) {
            accessor.setNativeHeader("Authorization", authorizationHeader);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
