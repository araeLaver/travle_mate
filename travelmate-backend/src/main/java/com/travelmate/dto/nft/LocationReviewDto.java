package com.travelmate.dto.nft;

import com.travelmate.entity.nft.LocationReview.VisitedSeason;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class LocationReviewDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "평점은 필수입니다.")
        @Min(value = 1, message = "평점은 1점 이상이어야 합니다.")
        @Max(value = 5, message = "평점은 5점 이하여야 합니다.")
        private Integer rating;

        @Size(max = 1000, message = "리뷰는 1000자 이내로 작성해주세요.")
        private String comment;

        private VisitedSeason visitedSeason;

        @Size(max = 5, message = "사진은 최대 5장까지 첨부할 수 있습니다.")
        private List<String> photoUrls;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Min(value = 1, message = "평점은 1점 이상이어야 합니다.")
        @Max(value = 5, message = "평점은 5점 이하여야 합니다.")
        private Integer rating;

        @Size(max = 1000, message = "리뷰는 1000자 이내로 작성해주세요.")
        private String comment;

        private VisitedSeason visitedSeason;

        @Size(max = 5, message = "사진은 최대 5장까지 첨부할 수 있습니다.")
        private List<String> photoUrls;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private ReviewerInfo reviewer;
        private Long locationId;
        private String locationName;
        private Integer rating;
        private String comment;
        private String visitedSeason;
        private String visitedSeasonDisplay;
        private List<String> photoUrls;
        private Integer helpfulCount;
        private Boolean isHelpful; // 현재 사용자가 도움됨 표시했는지
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewerInfo {
        private Long id;
        private String nickname;
        private String profileImageUrl;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationReviewStats {
        private Long locationId;
        private Double averageRating;
        private Long reviewCount;
        private RatingDistribution ratingDistribution;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingDistribution {
        private Long fiveStars;
        private Long fourStars;
        private Long threeStars;
        private Long twoStars;
        private Long oneStar;
    }
}
