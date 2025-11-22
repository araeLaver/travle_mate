package com.travelmate.controller;

import com.travelmate.dto.ChatDto;
import com.travelmate.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {
    
    private final ChatService chatService;
    
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatDto.MessageRequest message, 
                           SimpMessageHeaderAccessor headerAccessor) {
        chatService.processMessage(message);
    }
    
    @MessageMapping("/chat.join")
    public void joinChatRoom(@Payload ChatDto.JoinRequest request,
                            SimpMessageHeaderAccessor headerAccessor) {
        chatService.joinChatRoom(request);
        headerAccessor.getSessionAttributes().put("userId", request.getUserId());
        headerAccessor.getSessionAttributes().put("chatRoomId", request.getChatRoomId());
    }
    
    @MessageMapping("/chat.leave")
    public void leaveChatRoom(@Payload ChatDto.LeaveRequest request) {
        chatService.leaveChatRoom(request);
    }
}