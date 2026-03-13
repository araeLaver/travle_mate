package com.travelmate.service;

import com.travelmate.dto.UserReviewDto;
import com.travelmate.entity.TravelGroup;
import com.travelmate.entity.User;
import com.travelmate.entity.UserReview;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.UserReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserReviewService {

    private final UserReviewRepository userReviewRepository;
    private final UserRepository userRepository;
    private final TravelGroupRepository travelGroupRepository;

    /**
     * 사용자 평가 작성
     * - 본인 평가 불가
     * - 같은 여행 그룹 내 동일 대상 중복 평가 불가
     */
    @Transactional
    public UserReviewDto.Response createReview(Long reviewerId, Long revieweeId, UserReviewDto.CreateRequest request) {
        if (reviewerId.equals(revieweeId)) {
            throw new BusinessException("본인을 평가할 수 없습니다.");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        User reviewee = userRepository.findById(revieweeId)
                .orElseThrow(() -> new BusinessException("평가 대상 사용자를 찾을 수 없습니다."));

        TravelGroup travelGroup = travelGroupRepository.findById(request.getTravelGroupId())
                .orElseThrow(() -> new BusinessException("여행 그룹을 찾을 수 없습니다."));

        if (userReviewRepository.existsByReviewerIdAndRevieweeId(reviewerId, revieweeId)) {
            throw new BusinessException("이미 해당 사용자를 평가했습니다.");
        }

        UserReview review = new UserReview();
        review.setReviewer(reviewer);
        review.setReviewee(reviewee);
        review.setTravelGroup(travelGroup);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setReviewType(request.getReviewType());
        review.setPunctualityScore(request.getPunctualityScore());
        review.setMannerScore(request.getMannerScore());
        review.setCommunicationScore(request.getCommunicationScore());
        review.setCompanionAgainScore(request.getCompanionAgainScore());

        UserReview saved = userReviewRepository.save(review);
        log.info("UserReview created: reviewer={}, reviewee={}, rating={}", reviewerId, revieweeId, request.getRating());

        return toResponse(saved);
    }

    /**
     * 특정 사용자에 대한 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<UserReviewDto.Response> getReviewsForUser(Long revieweeId) {
        userRepository.findById(revieweeId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        return userReviewRepository.findByRevieweeIdWithReviewer(revieweeId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 특정 사용자의 평가 통계 조회 (종합 평점 + 항목별 평균)
     */
    @Transactional(readOnly = true)
    public UserReviewDto.UserReviewStats getReviewStats(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        Double avg = userReviewRepository.getAverageRatingByUserId(userId);
        Integer count = userReviewRepository.getReviewCountByUserId(userId);

        // 항목별 평균 (Java stream으로 계산)
        java.util.List<com.travelmate.entity.UserReview> reviews =
                userReviewRepository.findByRevieweeIdWithReviewer(userId);

        Double avgPunctuality = reviews.stream()
                .filter(r -> r.getPunctualityScore() != null)
                .mapToInt(com.travelmate.entity.UserReview::getPunctualityScore)
                .average().isPresent()
                ? reviews.stream().filter(r -> r.getPunctualityScore() != null)
                    .mapToInt(com.travelmate.entity.UserReview::getPunctualityScore)
                    .average().getAsDouble()
                : null;

        Double avgManner = reviews.stream()
                .filter(r -> r.getMannerScore() != null)
                .mapToInt(com.travelmate.entity.UserReview::getMannerScore)
                .average().isPresent()
                ? reviews.stream().filter(r -> r.getMannerScore() != null)
                    .mapToInt(com.travelmate.entity.UserReview::getMannerScore)
                    .average().getAsDouble()
                : null;

        Double avgCommunication = reviews.stream()
                .filter(r -> r.getCommunicationScore() != null)
                .mapToInt(com.travelmate.entity.UserReview::getCommunicationScore)
                .average().isPresent()
                ? reviews.stream().filter(r -> r.getCommunicationScore() != null)
                    .mapToInt(com.travelmate.entity.UserReview::getCommunicationScore)
                    .average().getAsDouble()
                : null;

        Double avgCompanionAgain = reviews.stream()
                .filter(r -> r.getCompanionAgainScore() != null)
                .mapToInt(com.travelmate.entity.UserReview::getCompanionAgainScore)
                .average().isPresent()
                ? reviews.stream().filter(r -> r.getCompanionAgainScore() != null)
                    .mapToInt(com.travelmate.entity.UserReview::getCompanionAgainScore)
                    .average().getAsDouble()
                : null;

        return UserReviewDto.UserReviewStats.builder()
                .userId(userId)
                .averageRating(avg != null ? avg : 0.0)
                .reviewCount(count != null ? count : 0)
                .avgPunctuality(avgPunctuality)
                .avgManner(avgManner)
                .avgCommunication(avgCommunication)
                .avgCompanionAgain(avgCompanionAgain)
                .build();
    }

    /**
     * 평가 삭제 (작성자 본인만 가능)
     */
    @Transactional
    public void deleteReview(Long reviewerId, Long reviewId) {
        UserReview review = userReviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException("평가를 찾을 수 없습니다."));

        if (!review.getReviewer().getId().equals(reviewerId)) {
            throw new BusinessException("본인이 작성한 평가만 삭제할 수 있습니다.");
        }

        userReviewRepository.delete(review);
        log.info("UserReview deleted: reviewId={}, reviewerId={}", reviewId, reviewerId);
    }

    // ───────────────────────────────────────────────
    // Private helpers
    // ───────────────────────────────────────────────

    private UserReviewDto.Response toResponse(UserReview review) {
        return UserReviewDto.Response.builder()
                .id(review.getId())
                .reviewer(toUserInfo(review.getReviewer()))
                .reviewee(toUserInfo(review.getReviewee()))
                .travelGroupId(review.getTravelGroup() != null ? review.getTravelGroup().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .reviewType(review.getReviewType() != null ? review.getReviewType().name() : null)
                .punctualityScore(review.getPunctualityScore())
                .mannerScore(review.getMannerScore())
                .communicationScore(review.getCommunicationScore())
                .companionAgainScore(review.getCompanionAgainScore())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private UserReviewDto.UserInfo toUserInfo(User user) {
        if (user == null) return null;
        return UserReviewDto.UserInfo.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
