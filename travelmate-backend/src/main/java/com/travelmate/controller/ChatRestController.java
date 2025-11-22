package com.travelmate.controller;

import com.travelmate.dto.ChatDto;
import com.travelmate.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import java.util.List;

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
        Long userIdLong = Long.parseLong(userId);
        ChatDto.ChatRoomResponse response = chatService.createChatRoom(userIdLong, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatDto.ChatRoomResponse>> getChatRooms(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        List<ChatDto.ChatRoomResponse> rooms = chatService.getChatRooms(userIdLong);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatDto.MessageResponse>> getChatMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        List<ChatDto.MessageResponse> messages = chatService.getChatMessages(roomId, page, size);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/rooms/{roomId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        chatService.markAsRead(roomId, userIdLong);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> leaveChatRoom(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
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
        Long userIdLong = Long.parseLong(userId);
        ChatDto.ChatRoomDetailResponse response = chatService.getChatRoomDetail(roomId, userIdLong);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/rooms/{roomId}/typing")
    public ResponseEntity<Void> updateTypingStatus(
            @PathVariable Long roomId,
            @AuthenticationPrincipal String userId,
            @RequestParam boolean isTyping) {
        Long userIdLong = Long.parseLong(userId);
        chatService.updateTypingStatus(roomId, userIdLong, isTyping);
        return ResponseEntity.ok().build();
    }
}