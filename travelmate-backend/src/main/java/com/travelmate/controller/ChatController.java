package com.travelmate.controller;

import com.travelmate.dto.ChatDto;
import com.travelmate.exception.BusinessException;
import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {
    
    private final ChatService chatService;
    
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatDto.MessageRequest message, 
                           Principal principal) {
        chatService.processMessage(requireUserId(principal), message);
    }
    
    @MessageMapping("/chat.join")
    public void joinChatRoom(@Payload ChatDto.JoinRequest request,
                            SimpMessageHeaderAccessor headerAccessor,
                            Principal principal) {
        Long userId = requireUserId(principal);
        chatService.joinChatRoom(userId, request);
        headerAccessor.getSessionAttributes().put("userId", userId);
        headerAccessor.getSessionAttributes().put("chatRoomId", request.getChatRoomId());
    }
    
    @MessageMapping("/chat.leave")
    public void leaveChatRoom(@Payload ChatDto.LeaveRequest request, Principal principal) {
        chatService.leaveChatRoom(requireUserId(principal), request);
    }

    @MessageMapping("/chat.typing")
    public void updateTypingStatus(@Payload ChatDto.TypingRequest request, Principal principal) {
        if (request.getChatRoomId() == null || request.getIsTyping() == null) {
            throw BusinessException.badRequest("chatRoomId and isTyping are required");
        }
        chatService.updateTypingStatus(request.getChatRoomId(), requireUserId(principal), request.getIsTyping());
    }

    private Long requireUserId(Principal principal) {
        return AuthenticatedUserId.parse(
                principal,
                "Authenticated STOMP principal is required",
                "Invalid STOMP principal");
    }
}
