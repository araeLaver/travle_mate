package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.ChatDto;
import com.travelmate.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${app.cors.allowed-origins:http://localhost:3000}"})
public class ChatRestController {

    private final ChatService chatService;

    @PostMapping("/rooms")
    public ResponseEntity<ChatDto.ChatRoomResponse> createChatRoom(
            @AuthenticationPrincipal String userId,
            @RequestBody ChatDto.CreateChatRoomRequest request) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        ChatDto.ChatRoomResponse response = chatService.createChatRoom(userIdLong, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatDto.ChatRoomResponse>> getChatRooms(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        List<ChatDto.ChatRoomResponse> rooms = chatService.getChatRooms(userIdLong);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatDto.MessageResponse>> getChatMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        List<ChatDto.MessageResponse> messages = chatService.getChatMessages(roomId, userIdLong, page, size);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ChatDto.MessageResponse> sendMessage(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ChatDto.MessageRequest request) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        ChatDto.MessageResponse message = chatService.sendRestMessage(roomId, userIdLong, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    @PostMapping("/rooms/{roomId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        chatService.markAsRead(roomId, userIdLong);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rooms/{roomId}/unread-count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        Integer count = chatService.getUnreadMessageCount(roomId, userIdLong);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        chatService.deleteMessage(messageId, userIdLong);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> leaveChatRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        ChatDto.LeaveRequest request = new ChatDto.LeaveRequest();
        request.setChatRoomId(roomId);
        request.setUserId(userIdLong);
        chatService.leaveChatRoom(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ChatDto.ChatRoomDetailResponse> getChatRoomDetail(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        ChatDto.ChatRoomDetailResponse response = chatService.getChatRoomDetail(roomId, userIdLong);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/rooms/{roomId}/typing")
    public ResponseEntity<Void> updateTypingStatus(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId,
            @RequestParam boolean isTyping) {
        Long userIdLong = AuthenticatedUserId.parse(userId);
        chatService.updateTypingStatus(roomId, userIdLong, isTyping);
        return ResponseEntity.ok().build();
    }
}
