package com.travelmate.controller;

import com.travelmate.dto.ChatDto;
import com.travelmate.entity.ChatMessage;
import com.travelmate.exception.BusinessException;
import com.travelmate.service.ChatService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatController 테스트")
class ChatControllerTest {

    @Mock
    private ChatService chatService;

    @InjectMocks
    private ChatController chatController;

    @Test
    @DisplayName("chat.send - principal 사용자 ID로 메시지 처리")
    void sendMessage_UsesPrincipalUserId() {
        // Given
        ChatDto.MessageRequest request = new ChatDto.MessageRequest();
        request.setChatRoomId(100L);
        request.setSenderId(999L);
        request.setContent("테스트 메시지");
        request.setMessageType(ChatMessage.MessageType.TEXT);

        // When
        chatController.sendMessage(request, principal("1"));

        // Then
        verify(chatService).processMessage(1L, request);
    }

    @Test
    @DisplayName("chat.join - principal 사용자 ID로 참가하고 세션 값 저장")
    void joinChatRoom_UsesPrincipalUserIdAndStoresSessionAttributes() {
        // Given
        ChatDto.JoinRequest request = new ChatDto.JoinRequest();
        request.setChatRoomId(100L);
        request.setUserId(999L);

        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create();
        Map<String, Object> sessionAttributes = new HashMap<>();
        headerAccessor.setSessionAttributes(sessionAttributes);

        // When
        chatController.joinChatRoom(request, headerAccessor, principal("1"));

        // Then
        verify(chatService).joinChatRoom(1L, request);
        assertThat(sessionAttributes).containsEntry("userId", 1L);
        assertThat(sessionAttributes).containsEntry("chatRoomId", 100L);
    }

    @Test
    @DisplayName("chat.leave - principal 사용자 ID로 퇴장")
    void leaveChatRoom_UsesPrincipalUserId() {
        // Given
        ChatDto.LeaveRequest request = new ChatDto.LeaveRequest();
        request.setChatRoomId(100L);
        request.setUserId(999L);

        // When
        chatController.leaveChatRoom(request, principal("1"));

        // Then
        verify(chatService).leaveChatRoom(1L, request);
    }

    @Test
    @DisplayName("chat.typing - principal 사용자 ID로 타이핑 상태 처리")
    void updateTypingStatus_UsesPrincipalUserId() {
        // Given
        ChatDto.TypingRequest request = new ChatDto.TypingRequest();
        request.setChatRoomId(100L);
        request.setUserId(999L);
        request.setIsTyping(true);

        // When
        chatController.updateTypingStatus(request, principal("1"));

        // Then
        verify(chatService).updateTypingStatus(100L, 1L, true);
    }

    @Test
    @DisplayName("chat.typing - 필수 값 누락 시 요청 오류")
    void updateTypingStatus_MissingRequiredFields_ThrowsBusinessException() {
        // Given
        ChatDto.TypingRequest request = new ChatDto.TypingRequest();
        request.setIsTyping(true);

        // When & Then
        assertThatThrownBy(() -> chatController.updateTypingStatus(request, principal("1")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("chatRoomId and isTyping are required")
                .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        verifyNoInteractions(chatService);
    }

    @Test
    @DisplayName("인증 principal이 없으면 메시지 처리를 거부")
    void sendMessage_MissingPrincipal_ThrowsAccessDenied() {
        // Given
        ChatDto.MessageRequest request = new ChatDto.MessageRequest();

        // When & Then
        assertThatThrownBy(() -> chatController.sendMessage(request, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authenticated STOMP principal is required");
        verifyNoInteractions(chatService);
    }

    @Test
    @DisplayName("숫자가 아닌 principal이면 메시지 처리를 거부")
    void sendMessage_InvalidPrincipal_ThrowsAccessDenied() {
        // Given
        ChatDto.MessageRequest request = new ChatDto.MessageRequest();

        // When & Then
        assertThatThrownBy(() -> chatController.sendMessage(request, principal("user-1")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Invalid STOMP principal");
        verifyNoInteractions(chatService);
    }

    private Principal principal(String name) {
        return () -> name;
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
