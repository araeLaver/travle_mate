package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 추천 결과 DTO - 정적 내부 클래스만 포함
 */
public class RecommendationDto {

    /**
     * 그룹 추천
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupRecommendation {
        private Long groupId;
        private String groupName;
        private String destination;
        private String description;
        private Integer currentMembers;
        private Integer maxMembers;
        private String travelStyle;
        private List<String> tags;

        // 추천 점수 (0-100)
        private Double recommendationScore;

        // 추천 이유
        private List<String> reasons;

        // 유사도 점수 세부 정보
        private ScoreBreakdown scoreBreakdown;
    }

    /**
     * 사용자 추천
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserRecommendation {
        private Long userId;
        private String nickname;
        private String profileImage;
        private List<String> travelStyles;
        private List<String> interests;
        private String ageGroup;

        // 추천 점수 (0-100)
        private Double recommendationScore;

        // 추천 이유
        private List<String> reasons;

        // 공통 관심사
        private List<String> commonInterests;

        // 유사도 점수
        private Double similarityScore;
    }

    /**
     * 점수 상세 정보
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreBreakdown {
        private Double travelStyleScore;      // 여행 스타일 유사도
        private Double interestScore;          // 관심사 유사도
        private Double regionScore;            // 지역 선호도 유사도
        private Double groupSizeScore;         // 선호 그룹 크기 유사도
        private Double budgetScore;            // 예산 범위 유사도
        private Double popularityScore;        // 인기도 점수
        private Double recentActivityScore;    // 최근 활동 점수
        private Double collaborativeScore;     // 협업 필터링 점수
    }
}
