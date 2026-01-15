package com.travelmate.dto;

import com.travelmate.entity.Activity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ActivityDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private ActorInfo actor;
        private String type;
        private String typeDisplayName;
        private TargetInfo target;
        private Map<String, Object> metadata;
        private LocalDateTime createdAt;
        private String relativeTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActorInfo {
        private Long id;
        private String username;
        private String nickname;
        private String profileImageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TargetInfo {
        private String type;
        private Long id;
        private String title;
        private String description;
        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedResponse {
        private List<Response> activities;
        private Long totalCount;
        private boolean hasMore;
        private int page;
        private int size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineResponse {
        private Long userId;
        private List<Response> activities;
        private Long totalCount;
        private boolean hasMore;
        private int page;
        private int size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private Long userId;
        private Long totalActivities;
        private Long recentActivities; // 7일간
        private Map<String, Long> activityByType;
        private LocalDateTime lastActivityAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Activity.ActivityType type;
        private String targetType;
        private Long targetId;
        private Map<String, Object> metadata;
        private Boolean isPublic;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilterRequest {
        private List<Activity.ActivityType> types;
        private Long userId;
        private String targetType;
        private LocalDateTime since;
        private LocalDateTime until;
    }
}
