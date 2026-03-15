package com.travelmate.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 채팅 MVP - Conversation/Message DTO
 */
public class ConversationDto {

    // ────────────────────────────────────────────────
    // Request DTOs
    // ────────────────────────────────────────────────

    /** POST /api/conversations - 대화 시작 요청 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartConversationRequest {
        @NotNull(message = "상대방 ID는 필수입니다")
        private Long targetUserId;
    }

    /** POST /api/messages - 메시지 전송 요청 */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendMessageRequest {
        @NotNull(message = "대화 ID는 필수입니다")
        private Long conversationId;

        @NotNull(message = "내용은 필수입니다")
        private String content;
    }

    // ────────────────────────────────────────────────
    // Response DTOs
    // ────────────────────────────────────────────────

    /** 대화 목록 아이템 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationSummary {
        private Long id;
        private ParticipantInfo otherUser;
        private LastMessageInfo lastMessage;
        private long unreadCount;
        private LocalDateTime createdAt;
        private LocalDateTime lastMessageAt;
    }

    /** 대화 상세 (생성/조회) */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationResponse {
        private Long id;
        private ParticipantInfo participant1;
        private ParticipantInfo participant2;
        private LocalDateTime createdAt;
        private LocalDateTime lastMessageAt;
    }

    /** 메시지 응답 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageResponse {
        private Long id;
        private Long conversationId;
        private Long senderId;
        private String senderNickname;
        private String senderProfileImageUrl;
        private String content;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }

    /** 메시지 페이지 응답 */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessagePageResponse {
        private java.util.List<MessageResponse> messages;
        private int page;
        private int size;
        private boolean hasNext;
        private long totalElements;
    }

    // ────────────────────────────────────────────────
    // Nested value objects
    // ────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private Long id;
        private String nickname;
        private String profileImageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LastMessageInfo {
        private Long id;
        private Long senderId;
        private String content;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }
}
