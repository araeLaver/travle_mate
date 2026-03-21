package com.travelmate.dto;

import com.travelmate.entity.UserReview.ReviewType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

public class UserReviewDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "평점은 필수입니다.")
        @Min(value = 1, message = "평점은 1점 이상이어야 합니다.")
        @Max(value = 5, message = "평점은 5점 이하여야 합니다.")
        private Integer rating;

        @Size(max = 500, message = "리뷰는 500자 이내로 작성해주세요.")
        private String comment;

        private ReviewType reviewType;

        @NotNull(message = "여행 그룹 ID는 필수입니다.")
        private Long travelGroupId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Min(value = 1, message = "평점은 1점 이상이어야 합니다.")
        @Max(value = 5, message = "평점은 5점 이하여야 합니다.")
        private Integer rating;

        @Size(max = 500, message = "리뷰는 500자 이내로 작성해주세요.")
        private String comment;

        private ReviewType reviewType;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private UserInfo reviewer;
        private UserInfo reviewee;
        private Long travelGroupId;
        private Integer rating;
        private String comment;
        private String reviewType;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String nickname;
        private String profileImageUrl;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserReviewStats {
        private Long userId;
        private Double averageRating;
        private Integer reviewCount;
    }
}
