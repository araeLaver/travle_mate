package com.travelmate.dto;

import com.travelmate.entity.DeviceToken;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Push Notification DTOs
 */
public class PushNotificationDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterTokenRequest {
        @NotBlank(message = "토큰은 필수입니다")
        private String token;

        @NotNull(message = "디바이스 타입은 필수입니다")
        private DeviceToken.DeviceType deviceType;

        private String deviceModel;
        private String osVersion;
        private String appVersion;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnregisterTokenRequest {
        @NotBlank(message = "토큰은 필수입니다")
        private String token;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendNotificationRequest {
        @NotNull(message = "사용자 ID는 필수입니다")
        private Long userId;

        @NotBlank(message = "제목은 필수입니다")
        private String title;

        @NotBlank(message = "내용은 필수입니다")
        private String body;

        private String imageUrl;
        private Map<String, String> data;
        private String clickAction;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendBatchNotificationRequest {
        private java.util.List<Long> userIds;

        @NotBlank(message = "제목은 필수입니다")
        private String title;

        @NotBlank(message = "내용은 필수입니다")
        private String body;

        private String imageUrl;
        private Map<String, String> data;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationPayload {
        private String title;
        private String body;
        private String imageUrl;
        private Map<String, String> data;
        private String clickAction;
        private String icon;
        private String badge;
        private String sound;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendResult {
        private int successCount;
        private int failureCount;
        private java.util.List<String> failedTokens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenResponse {
        private Long id;
        private String token;
        private DeviceToken.DeviceType deviceType;
        private String deviceModel;
        private boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationPreferences {
        private boolean follow;
        private boolean message;
        private boolean nftCollected;
        private boolean mintingComplete;
        private boolean groupInvite;
        private boolean reviewHelpful;
        private boolean email;
        private boolean push;
    }
}
