package com.travelmate.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 동행 후 상호평가 DTO 모음
 */
public class TravelReviewDto {

    // -----------------------------------------------------------------------
    // Request
    // -----------------------------------------------------------------------

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateReviewRequest {

        @NotNull(message = "리뷰 대상자 ID는 필수입니다.")
        private Long revieweeId;

        @NotNull(message = "매칭 요청 ID는 필수입니다.")
        private Long matchRequestId;

        @NotNull(message = "시간 약속 점수는 필수입니다.")
        @Min(value = 1, message = "점수는 1점 이상이어야 합니다.")
        @Max(value = 5, message = "점수는 5점 이하여야 합니다.")
        private Integer punctualityScore;

        @NotNull(message = "매너 점수는 필수입니다.")
        @Min(value = 1, message = "점수는 1점 이상이어야 합니다.")
        @Max(value = 5, message = "점수는 5점 이하여야 합니다.")
        private Integer mannersScore;

        @NotNull(message = "소통 점수는 필수입니다.")
        @Min(value = 1, message = "점수는 1점 이상이어야 합니다.")
        @Max(value = 5, message = "점수는 5점 이하여야 합니다.")
        private Integer communicationScore;

        @NotNull(message = "다시 함께 여행 여부는 필수입니다.")
        private Boolean wouldTravelAgain;

        @Size(max = 500, message = "코멘트는 500자 이내로 작성해주세요.")
        private String comment;
    }

    // -----------------------------------------------------------------------
    // Response
    // -----------------------------------------------------------------------

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewResponse {

        private Long id;

        /** 리뷰 작성자 요약 정보 */
        private ReviewerSummary reviewerSummary;

        private Integer punctualityScore;
        private Integer mannersScore;
        private Integer communicationScore;
        private Boolean wouldTravelAgain;
        private String comment;
        private LocalDateTime createdAt;

        /** 세 항목 평균 점수 (소수점 두 자리) */
        private Double averageScore;
    }

    // -----------------------------------------------------------------------
    // Nested: 리뷰어 요약
    // -----------------------------------------------------------------------

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewerSummary {
        private Long id;
        private String nickname;
        private String profileImageUrl;
    }
}
