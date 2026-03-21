package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * AI 추천 시스템 DTO
 */
public class AIRecommendationDto {

    /**
     * 여행 일정 생성 요청
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItineraryRequest {
        private String destination;
        private LocalDate startDate;
        private LocalDate endDate;
        private String travelStyle;
        private String budgetRange;
        private List<String> interests;
        private List<String> preferences;
        private Integer groupSize;
    }

    /**
     * AI 생성 여행 일정
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItineraryResponse {
        private String destination;
        private LocalDate startDate;
        private LocalDate endDate;
        private List<DayPlan> dayPlans;
        private List<String> tips;
        private BudgetEstimate budgetEstimate;
        private String summary;
    }

    /**
     * 하루 일정
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayPlan {
        private Integer dayNumber;
        private LocalDate date;
        private String theme;
        private List<Activity> activities;
        private String notes;
    }

    /**
     * 활동
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Activity {
        private String name;
        private String description;
        private String location;
        private String time;
        private Integer durationMinutes;
        private String category;
        private Double estimatedCost;
        private Double latitude;
        private Double longitude;
        private String imageUrl;
    }

    /**
     * 예산 추정
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetEstimate {
        private Double totalEstimate;
        private Double accommodationEstimate;
        private Double foodEstimate;
        private Double transportationEstimate;
        private Double activitiesEstimate;
        private String currency;
        private Map<String, Double> breakdown;
    }

    /**
     * 장소 추천 요청
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaceRecommendationRequest {
        private Double latitude;
        private Double longitude;
        private Double radiusKm;
        private List<String> categories;
        private String timeOfDay;
        private String weather;
        private List<String> previouslyVisited;
    }

    /**
     * AI 장소 추천
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaceRecommendation {
        private Long placeId;
        private String name;
        private String description;
        private String category;
        private Double latitude;
        private Double longitude;
        private Double distance;
        private Double rating;
        private Integer reviewCount;
        private String imageUrl;
        private Double aiScore;
        private List<String> reasons;
        private String bestTimeToVisit;
        private String estimatedDuration;
    }

    /**
     * 개인화 추천 요청
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalizedRequest {
        private Long userId;
        private String currentLocation;
        private Double latitude;
        private Double longitude;
        private String mood;
        private Integer availableHours;
        private List<String> companions;
    }

    /**
     * 개인화 추천 응답
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalizedResponse {
        private List<PlaceRecommendation> places;
        private List<ActivitySuggestion> activities;
        private List<String> tips;
        private String aiInsight;
        private Double confidenceScore;
    }

    /**
     * 활동 제안
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivitySuggestion {
        private String title;
        private String description;
        private String category;
        private Integer durationMinutes;
        private String difficulty;
        private Double estimatedCost;
        private List<String> requirements;
        private Double aiScore;
        private String reason;
    }

    /**
     * 여행 팁 생성 요청
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TravelTipsRequest {
        private String destination;
        private LocalDate travelDate;
        private String travelStyle;
        private List<String> specificTopics;
    }

    /**
     * AI 생성 여행 팁
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TravelTip {
        private String category;
        private String title;
        private String content;
        private String importance;
        private List<String> relatedPlaces;
    }

    /**
     * 유사 사용자 분석
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserAnalysis {
        private Long userId;
        private String travelPersona;
        private List<String> topInterests;
        private List<String> preferredDestinations;
        private String predictedNextDestination;
        private Double adventureScore;
        private Double cultureScore;
        private Double relaxationScore;
        private Double socialScore;
    }

    /**
     * AI 채팅 요청
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String message;
        private String conversationId;
        private String context;
    }

    /**
     * AI 채팅 응답
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private String message;
        private String conversationId;
        private List<PlaceRecommendation> relatedPlaces;
        private List<String> suggestedActions;
    }
}
