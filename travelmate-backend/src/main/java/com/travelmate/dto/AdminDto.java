package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Admin Dashboard DTOs
 */
public class AdminDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private long totalUsers;
        private long newUsersToday;
        private long newUsersThisWeek;
        private long activeUsersToday;

        private long totalNfts;
        private long mintedNfts;
        private long collectionsToday;

        private long totalGroups;
        private long activeGroups;

        private long totalReviews;
        private double averageRating;

        private List<DailyStats> dailyStats;
        private Map<String, Long> usersByCountry;
        private Map<String, Long> nftsByRarity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStats {
        private LocalDate date;
        private long newUsers;
        private long activeUsers;
        private long nftCollections;
        private long mintings;
        private long newGroups;
        private long messages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserManagement {
        private Long id;
        private String email;
        private String nickname;
        private String profileImageUrl;
        private String role;
        private boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;
        private int nftCount;
        private int followerCount;
        private int groupCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDetailResponse {
        private Long id;
        private String email;
        private String nickname;
        private String profileImageUrl;
        private String bio;
        private String role;
        private boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;

        // Stats
        private int nftCount;
        private int mintedNftCount;
        private int followerCount;
        private int followingCount;
        private int groupCount;
        private int reviewCount;
        private int totalPoints;

        // Recent activity
        private List<ActivityLog> recentActivity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityLog {
        private Long id;
        private String type;
        private String description;
        private LocalDateTime timestamp;
        private Map<String, Object> metadata;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserRequest {
        private String role;
        private Boolean isActive;
        private String nickname;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationManagement {
        private Long id;
        private String name;
        private String description;
        private String region;
        private String country;
        private String category;
        private String rarity;
        private Double latitude;
        private Double longitude;
        private Integer collectRadius;
        private boolean isActive;
        private LocalDateTime createdAt;
        private int totalCollections;
        private int totalReviews;
        private Double averageRating;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateLocationRequest {
        private String name;
        private String description;
        private String region;
        private String country;
        private String category;
        private String rarity;
        private Double latitude;
        private Double longitude;
        private Integer collectRadius;
        private String imageUrl;
        private Integer basePoints;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateLocationRequest {
        private String name;
        private String description;
        private String rarity;
        private Integer collectRadius;
        private Boolean isActive;
        private Integer basePoints;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemHealth {
        private String status;
        private long uptime;
        private double cpuUsage;
        private double memoryUsage;
        private long diskUsage;
        private Map<String, ServiceStatus> services;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceStatus {
        private String name;
        private String status;
        private long responseTime;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportedContent {
        private Long id;
        private String type; // REVIEW, USER, GROUP
        private Long targetId;
        private String reason;
        private String description;
        private Long reporterId;
        private String reporterNickname;
        private String status; // PENDING, RESOLVED, DISMISSED
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
        private Long resolvedBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkActionRequest {
        private List<Long> ids;
        private String action; // ACTIVATE, DEACTIVATE, DELETE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkActionResponse {
        private int successCount;
        private int failureCount;
        private List<Long> failedIds;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditLog {
        private Long id;
        private Long adminId;
        private String adminNickname;
        private String action;
        private String targetType;
        private Long targetId;
        private String description;
        private Map<String, Object> oldValue;
        private Map<String, Object> newValue;
        private LocalDateTime timestamp;
        private String ipAddress;
    }
}
