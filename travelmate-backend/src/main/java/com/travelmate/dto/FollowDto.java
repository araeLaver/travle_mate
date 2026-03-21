package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class FollowDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FollowUserResponse {
        private Long id;
        private String nickname;
        private String profileImageUrl;
        private String bio;
        private LocalDateTime followedAt;
        private boolean isMutual;  // 맞팔로우 여부
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FollowStatsResponse {
        private Long userId;
        private long followerCount;     // 나를 팔로우하는 사람 수
        private long followingCount;    // 내가 팔로우하는 사람 수
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FollowResponse {
        private boolean success;
        private String message;
        private boolean isFollowing;
        private boolean isMutual;
        private FollowStatsResponse stats;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FollowStatusResponse {
        private Long userId;
        private boolean isFollowing;      // 내가 이 사람을 팔로우하는지
        private boolean isFollowedBy;     // 이 사람이 나를 팔로우하는지
        private boolean isMutual;         // 맞팔로우 여부
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserWithFollowStatus {
        private Long id;
        private String nickname;
        private String profileImageUrl;
        private String bio;
        private Double rating;
        private Integer totalNftsCollected;
        private boolean isFollowing;
        private boolean isFollowedBy;
        private boolean isMutual;
    }
}
