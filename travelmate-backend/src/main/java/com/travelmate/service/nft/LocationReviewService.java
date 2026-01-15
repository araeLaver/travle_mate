package com.travelmate.service.nft;

import com.travelmate.dto.nft.LocationReviewDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.LocationReview;
import com.travelmate.entity.nft.ReviewHelpful;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.LocationReviewRepository;
import com.travelmate.repository.nft.ReviewHelpfulRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationReviewService {

    private final LocationReviewRepository locationReviewRepository;
    private final ReviewHelpfulRepository reviewHelpfulRepository;
    private final CollectibleLocationRepository locationRepository;
    private final UserNftCollectionRepository userNftCollectionRepository;
    private final UserRepository userRepository;

    /**
     * 리뷰 작성 (해당 장소를 수집한 사용자만 가능)
     */
    @Transactional
    public LocationReviewDto.Response createReview(Long userId, Long locationId, LocationReviewDto.CreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        CollectibleLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new BusinessException("장소를 찾을 수 없습니다."));

        // 해당 장소를 수집했는지 확인
        boolean hasCollected = userNftCollectionRepository.existsByUserIdAndLocationId(userId, locationId);
        if (!hasCollected) {
            throw new BusinessException("해당 장소를 수집한 후에 리뷰를 작성할 수 있습니다.");
        }

        // 이미 리뷰를 작성했는지 확인
        if (locationReviewRepository.existsByReviewerIdAndLocationId(userId, locationId)) {
            throw new BusinessException("이미 리뷰를 작성한 장소입니다.");
        }

        LocationReview review = LocationReview.builder()
                .reviewer(user)
                .location(location)
                .rating(request.getRating())
                .comment(request.getComment())
                .visitedSeason(request.getVisitedSeason())
                .photoUrls(request.getPhotoUrls() != null ? request.getPhotoUrls() : java.util.Collections.emptyList())
                .helpfulCount(0)
                .build();

        LocationReview savedReview = locationReviewRepository.save(review);

        // 장소의 평균 평점 업데이트
        updateLocationRating(locationId);

        return toResponse(savedReview, userId);
    }

    /**
     * 리뷰 수정
     */
    @Transactional
    public LocationReviewDto.Response updateReview(Long userId, Long reviewId, LocationReviewDto.UpdateRequest request) {
        LocationReview review = locationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException("리뷰를 찾을 수 없습니다."));

        // 작성자 확인
        if (!review.getReviewer().getId().equals(userId)) {
            throw new BusinessException("본인이 작성한 리뷰만 수정할 수 있습니다.");
        }

        if (request.getRating() != null) {
            review.setRating(request.getRating());
        }
        if (request.getComment() != null) {
            review.setComment(request.getComment());
        }
        if (request.getVisitedSeason() != null) {
            review.setVisitedSeason(request.getVisitedSeason());
        }
        if (request.getPhotoUrls() != null) {
            review.setPhotoUrls(request.getPhotoUrls());
        }

        LocationReview updatedReview = locationReviewRepository.save(review);

        // 장소의 평균 평점 업데이트
        updateLocationRating(review.getLocation().getId());

        return toResponse(updatedReview, userId);
    }

    /**
     * 리뷰 삭제
     */
    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        LocationReview review = locationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException("리뷰를 찾을 수 없습니다."));

        // 작성자 확인
        if (!review.getReviewer().getId().equals(userId)) {
            throw new BusinessException("본인이 작성한 리뷰만 삭제할 수 있습니다.");
        }

        Long locationId = review.getLocation().getId();
        locationReviewRepository.delete(review);

        // 장소의 평균 평점 업데이트
        updateLocationRating(locationId);
    }

    /**
     * 장소별 리뷰 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<LocationReviewDto.Response> getLocationReviews(Long userId, Long locationId, String sort, Pageable pageable) {
        Page<LocationReview> reviews;

        if ("helpful".equals(sort)) {
            reviews = locationReviewRepository.findByLocationIdOrderByHelpfulCountDesc(locationId, pageable);
        } else {
            reviews = locationReviewRepository.findByLocationIdOrderByCreatedAtDesc(locationId, pageable);
        }

        return reviews.map(review -> toResponse(review, userId));
    }

    /**
     * 사용자의 리뷰 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<LocationReviewDto.Response> getUserReviews(Long userId, Long targetUserId, Pageable pageable) {
        Page<LocationReview> reviews = locationReviewRepository.findByReviewerIdOrderByCreatedAtDesc(targetUserId, pageable);
        return reviews.map(review -> toResponse(review, userId));
    }

    /**
     * 리뷰 상세 조회
     */
    @Transactional(readOnly = true)
    public LocationReviewDto.Response getReview(Long userId, Long reviewId) {
        LocationReview review = locationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException("리뷰를 찾을 수 없습니다."));
        return toResponse(review, userId);
    }

    /**
     * 도움됨 토글
     */
    @Transactional
    public boolean toggleHelpful(Long userId, Long reviewId) {
        LocationReview review = locationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException("리뷰를 찾을 수 없습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        // 본인 리뷰에는 도움됨 표시 불가
        if (review.getReviewer().getId().equals(userId)) {
            throw new BusinessException("본인의 리뷰에는 도움됨을 표시할 수 없습니다.");
        }

        var existing = reviewHelpfulRepository.findByUserIdAndReviewId(userId, reviewId);

        if (existing.isPresent()) {
            // 도움됨 취소
            reviewHelpfulRepository.delete(existing.get());
            review.decrementHelpfulCount();
            locationReviewRepository.save(review);
            return false;
        } else {
            // 도움됨 추가
            ReviewHelpful helpful = ReviewHelpful.builder()
                    .user(user)
                    .review(review)
                    .build();
            reviewHelpfulRepository.save(helpful);
            review.incrementHelpfulCount();
            locationReviewRepository.save(review);
            return true;
        }
    }

    /**
     * 장소 리뷰 통계 조회
     */
    @Transactional(readOnly = true)
    public LocationReviewDto.LocationReviewStats getLocationReviewStats(Long locationId) {
        Double averageRating = locationReviewRepository.getAverageRatingByLocationId(locationId);
        long reviewCount = locationReviewRepository.countByLocationId(locationId);

        return LocationReviewDto.LocationReviewStats.builder()
                .locationId(locationId)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .reviewCount(reviewCount)
                .build();
    }

    /**
     * 장소의 평균 평점 업데이트
     */
    private void updateLocationRating(Long locationId) {
        Double averageRating = locationReviewRepository.getAverageRatingByLocationId(locationId);
        long reviewCount = locationReviewRepository.countByLocationId(locationId);

        CollectibleLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new BusinessException("장소를 찾을 수 없습니다."));

        location.setAverageRating(averageRating != null ? averageRating : 0.0);
        location.setReviewCount((int) reviewCount);
        locationRepository.save(location);
    }

    /**
     * 엔티티를 DTO로 변환
     */
    private LocationReviewDto.Response toResponse(LocationReview review, Long currentUserId) {
        boolean isHelpful = currentUserId != null &&
                reviewHelpfulRepository.existsByUserIdAndReviewId(currentUserId, review.getId());

        return LocationReviewDto.Response.builder()
                .id(review.getId())
                .reviewer(LocationReviewDto.ReviewerInfo.builder()
                        .id(review.getReviewer().getId())
                        .nickname(review.getReviewer().getNickname())
                        .profileImageUrl(review.getReviewer().getProfileImageUrl())
                        .build())
                .locationId(review.getLocation().getId())
                .locationName(review.getLocation().getName())
                .rating(review.getRating())
                .comment(review.getComment())
                .visitedSeason(review.getVisitedSeason() != null ? review.getVisitedSeason().name() : null)
                .visitedSeasonDisplay(review.getVisitedSeason() != null ? review.getVisitedSeason().getDisplayName() : null)
                .photoUrls(review.getPhotoUrls())
                .helpfulCount(review.getHelpfulCount())
                .isHelpful(isHelpful)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
