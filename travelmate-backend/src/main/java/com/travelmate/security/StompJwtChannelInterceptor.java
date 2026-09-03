package com.travelmate.security;

import com.travelmate.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (StompCommand.CONNECT != accessor.getCommand()) {
            return message;
        }

        String token = extractBearerToken(accessor.getFirstNativeHeader("Authorization"));
        if (!StringUtils.hasText(token) || !jwtService.validateToken(token)) {
            throw new AccessDeniedException("Valid STOMP authorization is required");
        }

        Long userId = jwtService.getUserIdFromToken(token);
        List<String> authorities = jwtService.getAuthoritiesFromToken(token);
        if (authorities == null || authorities.isEmpty()) {
            authorities = Collections.singletonList("ROLE_USER");
        }

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            userId.toString(),
            null,
            authorities.stream().map(SimpleGrantedAuthority::new).toList()
        );
        accessor.setUser(authentication);

        return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    }

    private String extractBearerToken(String authorizationHeader) {
        if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith(BEARER_PREFIX)) {
            return authorizationHeader.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
