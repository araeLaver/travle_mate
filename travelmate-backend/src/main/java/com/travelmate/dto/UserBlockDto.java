package com.travelmate.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class UserBlockDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlockRequest {
        @NotNull(message = "차단할 사용자 ID는 필수입니다.")
        private Long userId;

        @Size(max = 500, message = "차단 사유는 500자 이내로 입력해주세요.")
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private UserInfo blockedUser;
        private String reason;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String nickname;
        private String profileImageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private List<Response> blocks;
        private Long totalCount;
        private boolean hasMore;
        private int page;
        private int size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusResponse {
        private Long userId;
        private boolean isBlocked;
        private boolean isBlockedBy; // 상대방이 나를 차단했는지
        private boolean isEitherBlocked; // 둘 중 하나라도 차단 중인지
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchStatusRequest {
        @NotNull
        @Size(min = 1, max = 100, message = "사용자 ID는 1개 이상 100개 이하로 지정해주세요.")
        private List<Long> userIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchStatusResponse {
        private Map<Long, Boolean> blockStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToggleResponse {
        private Long userId;
        private boolean isBlocked;
    }
}
