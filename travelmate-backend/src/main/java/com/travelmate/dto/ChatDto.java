package com.travelmate.dto;

import com.travelmate.entity.ChatMessage;
import com.travelmate.entity.ChatRoom;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class ChatDto {
    
    @Data
    public static class CreateChatRoomRequest {
        private String roomName;
        
        @NotNull
        private ChatRoom.RoomType roomType;
        
        
        private Long travelGroupId;
        private List<Long> participantIds;
    }
    
    @Data
    public static class ChatRoomResponse {
        private Long id;
        private String roomName;
        private ChatRoom.RoomType roomType;
        private Long travelGroupId;
        private List<ParticipantDto> participants;
        private String lastMessage;
        private LocalDateTime lastMessageAt;
        private Integer unreadCount;
        private LocalDateTime createdAt;
    }
    
    @Data
    public static class ParticipantDto {
        private Long userId;
        private String nickname;
        private String profileImageUrl;
        private LocalDateTime lastReadAt;
        private Boolean isActive;
    }
    
    @Data
    public static class MessageRequest {
        @NotNull
        private Long chatRoomId;
        
        @NotNull
        private Long senderId;
        
        @NotBlank
        private String content;
        
        @NotNull
        private ChatMessage.MessageType messageType;
        
        private String imageUrl;
        private Double locationLatitude;
        private Double locationLongitude;
        private String locationName;
    }
    
    @Data
    public static class MessageResponse {
        private Long id;
        private Long chatRoomId;
        private UserDto.Response sender;
        private String content;
        private ChatMessage.MessageType messageType;
        private String imageUrl;
        private Double locationLatitude;
        private Double locationLongitude;
        private String locationName;
        private LocalDateTime sentAt;
        private Boolean isDeleted;
    }
    
    @Data
    public static class JoinRequest {
        @NotNull
        private Long chatRoomId;
        
        @NotNull
        private Long userId;
    }
    
    @Data
    public static class LeaveRequest {
        @NotNull
        private Long chatRoomId;
        
        @NotNull
        private Long userId;
    }
    
    @Data
    public static class TypingRequest {
        @NotNull
        private Long chatRoomId;
        
        @NotNull
        private Long userId;
        
        @NotNull
        private Boolean isTyping;
    }
    
    @Data
    public static class ChatRoomDetailResponse extends ChatRoomResponse {
        private List<MessageResponse> recentMessages;
        private Boolean canSendMessage;
        private List<String> typingUsers;
    }
    
    @Data
    public static class ReadReceiptResponse {
        private Long messageId;
        private List<ReadStatusDto> readStatuses;
    }
    
    @Data
    public static class ReadStatusDto {
        private Long userId;
        private String nickname;
        private LocalDateTime readAt;
    }
    
    @Data
    public static class MessageDeleteRequest {
        @NotNull
        private Long messageId;
        
        @NotNull
        private Long userId;
    }
}