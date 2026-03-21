package com.travelmate.controller;

import com.travelmate.dto.ConversationDto;
import com.travelmate.service.ConversationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 채팅 MVP REST API
 *
 * POST   /api/conversations                     — 대화 시작 (매칭된 pair만, 중복 방지)
 * GET    /api/conversations                     — 내 대화 목록 (lastMessage + 안읽은수)
 * GET    /api/messages?conversationId=&page=&size= — 메시지 목록 (최신순, 페이지네이션)
 * POST   /api/messages                          — 메시지 전송
 * PUT    /api/messages/{conversationId}/read    — 읽음 처리
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "채팅 MVP", description = "1:1 대화 및 메시지 API")
public class ConversationController {

    private final ConversationService conversationService;

    // ────────────────────────────────────────────────
    // 대화 API
    // ────────────────────────────────────────────────

    @Operation(summary = "대화 시작", description = "매칭된 상대방과 새로운 대화를 시작합니다. 이미 대화가 있으면 기존 대화를 반환합니다.")
    @PostMapping("/conversations")
    public ResponseEntity<ConversationDto.ConversationResponse> startConversation(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ConversationDto.StartConversationRequest request) {

        Long myUserId = Long.parseLong(userId);
        ConversationDto.ConversationResponse response =
                conversationService.startConversation(myUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "내 대화 목록", description = "최신 메시지 순으로 정렬된 대화 목록을 반환합니다. lastMessage와 unreadCount가 포함됩니다.")
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto.ConversationSummary>> getMyConversations(
            @AuthenticationPrincipal String userId) {

        Long myUserId = Long.parseLong(userId);
        List<ConversationDto.ConversationSummary> list =
                conversationService.getMyConversations(myUserId);
        return ResponseEntity.ok(list);
    }

    // ────────────────────────────────────────────────
    // 메시지 API
    // ────────────────────────────────────────────────

    @Operation(summary = "메시지 목록 조회", description = "페이지네이션으로 메시지를 최신순으로 반환합니다.")
    @GetMapping("/messages")
    public ResponseEntity<ConversationDto.MessagePageResponse> getMessages(
            @AuthenticationPrincipal String userId,
            @RequestParam Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Long myUserId = Long.parseLong(userId);
        ConversationDto.MessagePageResponse response =
                conversationService.getMessages(myUserId, conversationId, page, size);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "메시지 전송")
    @PostMapping("/messages")
    public ResponseEntity<ConversationDto.MessageResponse> sendMessage(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ConversationDto.SendMessageRequest request) {

        Long myUserId = Long.parseLong(userId);
        ConversationDto.MessageResponse response =
                conversationService.sendMessage(myUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "읽음 처리", description = "해당 대화에서 상대방이 보낸 모든 미읽음 메시지를 읽음으로 표시합니다.")
    @PutMapping("/messages/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal String userId,
            @PathVariable Long conversationId) {

        Long myUserId = Long.parseLong(userId);
        conversationService.markAsRead(myUserId, conversationId);
        return ResponseEntity.noContent().build();
    }
}
