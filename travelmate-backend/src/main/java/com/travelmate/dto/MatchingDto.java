package com.travelmate.dto;

import com.travelmate.entity.MatchRequest.MatchStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class MatchingDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchScoreBreakdown {
        private BigDecimal travelStyleScore;   // 0-30
        private BigDecimal scheduleOverlapScore; // 0-25
        private BigDecimal budgetScore;         // 0-20
        private BigDecimal languageScore;       // 0-15
        private BigDecimal ratingScore;         // 0-10
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchUserSummary {
        private Long id;
        private String nickname;
        private String profileImageUrl;
        private String travelStyle;
        private String bio;
        private Integer age;
        private String gender;
        private List<String> languages;
        private List<String> interests;
        private Double rating;
        private Integer reviewCount;
        private String budgetPreference;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchRecommendation {
        private MatchUserSummary user;
        private BigDecimal totalScore;
        private MatchScoreBreakdown scoreBreakdown;
        private List<String> matchReasons;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchRequestResponse {
        private Long id;
        private MatchUserSummary requester;
        private MatchUserSummary receiver;
        private MatchStatus status;
        private BigDecimal totalScore;
        private MatchScoreBreakdown scoreBreakdown;
        private String message;
        private LocalDateTime expiresAt;
        private LocalDateTime respondedAt;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchHistoryResponse {
        private Long matchRequestId;
        private MatchUserSummary partner;
        private MatchStatus status;
        private BigDecimal totalScore;
        private MatchScoreBreakdown scoreBreakdown;
        private LocalDateTime matchedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendMatchRequest {
        @NotNull(message = "수신자 ID는 필수입니다.")
        private Long receiverId;

        @Size(max = 500, message = "메시지는 최대 500자까지 가능합니다.")
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RespondMatchRequest {
        @NotNull(message = "수락 여부는 필수입니다.")
        private Boolean accept;
    }
}
