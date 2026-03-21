package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Leaderboard DTOs
 */
public class LeaderboardDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private int rank;
        private Long userId;
        private String nickname;
        private String profileImageUrl;
        private int nftCount;
        private int totalPoints;
        private int legendaryCount;
        private int epicCount;
        private int rareCount;
        private int commonCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardResponse {
        private String type; // WEEKLY, MONTHLY, ALL_TIME
        private List<LeaderboardEntry> entries;
        private int totalParticipants;
        private LeaderboardEntry currentUserRank;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserRankResponse {
        private Long userId;
        private int globalRank;
        private int weeklyRank;
        private int monthlyRank;
        private int nftCount;
        private int totalPoints;
        private int percentile; // Top X%
    }
}
