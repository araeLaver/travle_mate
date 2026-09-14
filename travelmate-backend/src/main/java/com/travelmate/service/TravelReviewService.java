package com.travelmate.service;

import com.travelmate.dto.TravelReviewDto;
import com.travelmate.entity.MatchRequest;
import com.travelmate.entity.MatchRequest.MatchStatus;
import com.travelmate.entity.TravelReview;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.MatchRequestRepository;
import com.travelmate.repository.TravelReviewRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TravelReviewService {

    private final TravelReviewRepository travelReviewRepository;
    private final UserRepository userRepository;
    private final MatchRequestRepository matchRequestRepository;

    // -----------------------------------------------------------------------
    // 리뷰 작성
    // -----------------------------------------------------------------------

    /**
     * 동행 후 상호평가를 작성합니다.
     *
     * <ul>
     *   <li>매칭 상태가 COMPLETED여야 합니다. 레거시 MATCHED 상태도 허용합니다.</li>
     *   <li>리뷰어가 해당 매칭의 참여자(requester 또는 receiver)여야 합니다.</li>
     *   <li>리뷰어와 리뷰이가 다른 사람이어야 합니다.</li>
     *   <li>동일 reviewer + matchRequest 조합의 중복 평가를 허용하지 않습니다.</li>
     * </ul>
     */
    @Transactional
    public TravelReviewDto.ReviewResponse createReview(
            Long reviewerId,
            TravelReviewDto.CreateReviewRequest request) {

        // 1. 리뷰어 본인 평가 방지
        if (reviewerId.equals(request.getRevieweeId())) {
            throw BusinessException.cannotReviewSelf();
        }

        // 2. 엔티티 조회
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> BusinessException.userNotFound(reviewerId));

        User reviewee = userRepository.findById(request.getRevieweeId())
                .orElseThrow(() -> BusinessException.userNotFound(request.getRevieweeId()));

        MatchRequest matchRequest = matchRequestRepository.findById(request.getMatchRequestId())
                .orElseThrow(() -> BusinessException.notFound("매칭 요청을 찾을 수 없습니다."));

        // 3. 매칭 상태 검증 (완료된 동행만 허용)
        if (matchRequest.getStatus() != MatchStatus.COMPLETED
                && matchRequest.getStatus() != MatchStatus.MATCHED) {
            throw BusinessException.badRequest("완료된 매칭(COMPLETED)에 대해서만 평가를 작성할 수 있습니다.");
        }

        // 4. 리뷰어가 해당 매칭 참여자인지 확인
        boolean isParticipant =
                matchRequest.getRequester().getId().equals(reviewerId) ||
                matchRequest.getReceiver().getId().equals(reviewerId);
        if (!isParticipant) {
            throw BusinessException.forbidden("해당 매칭의 참여자만 평가를 작성할 수 있습니다.");
        }

        // 5. 리뷰이가 해당 매칭의 상대방인지 확인
        boolean isOpponent =
                matchRequest.getRequester().getId().equals(request.getRevieweeId()) ||
                matchRequest.getReceiver().getId().equals(request.getRevieweeId());
        if (!isOpponent) {
            throw BusinessException.badRequest("매칭 상대방에 대한 평가만 작성할 수 있습니다.");
        }

        // 6. 중복 평가 방지
        if (travelReviewRepository.existsByReviewerIdAndMatchRequestId(
                reviewerId, request.getMatchRequestId())) {
            throw BusinessException.reviewAlreadyExists();
        }

        // 7. 리뷰 저장
        TravelReview review = TravelReview.builder()
                .reviewer(reviewer)
                .reviewee(reviewee)
                .matchRequest(matchRequest)
                .punctualityScore(request.getPunctualityScore())
                .mannersScore(request.getMannersScore())
                .communicationScore(request.getCommunicationScore())
                .wouldTravelAgain(request.getWouldTravelAgain())
                .comment(request.getComment())
                .build();

        TravelReview saved = travelReviewRepository.save(review);
        log.info("TravelReview created: reviewer={}, reviewee={}, matchRequest={}, avg={}",
                reviewerId, request.getRevieweeId(), request.getMatchRequestId(),
                saved.getAverageScore());

        // 8. reviewee의 rating 업데이트
        updateUserRating(reviewee);

        return toResponse(saved);
    }

    // -----------------------------------------------------------------------
    // 조회
    // -----------------------------------------------------------------------

    /**
     * 특정 사용자가 받은 모든 리뷰 목록을 반환합니다.
     */
    @Transactional(readOnly = true)
    public List<TravelReviewDto.ReviewResponse> getReviewsForUser(Long revieweeId) {
        userRepository.findById(revieweeId)
                .orElseThrow(() -> BusinessException.userNotFound(revieweeId));

        return travelReviewRepository.findByRevieweeIdWithReviewer(revieweeId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 특정 매칭에 대한 리뷰 목록을 반환합니다 (양쪽 평가 포함).
     */
    @Transactional(readOnly = true)
    public List<TravelReviewDto.ReviewResponse> getReviewsForMatch(Long matchRequestId) {
        matchRequestRepository.findById(matchRequestId)
                .orElseThrow(() -> BusinessException.notFound("매칭 요청을 찾을 수 없습니다."));

        return travelReviewRepository.findByMatchRequestIdWithUsers(matchRequestId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * reviewee가 받은 모든 TravelReview의 평균 점수를 User.rating 에 반영합니다.
     */
    private void updateUserRating(User reviewee) {
        Double avg = travelReviewRepository.getAverageScoreByRevieweeId(reviewee.getId());
        Integer count = travelReviewRepository.getReviewCountByRevieweeId(reviewee.getId());

        reviewee.setRating(avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0);
        reviewee.setReviewCount(count != null ? count : 0);
        userRepository.save(reviewee);

        log.debug("User rating updated: userId={}, newRating={}, reviewCount={}",
                reviewee.getId(), reviewee.getRating(), reviewee.getReviewCount());
    }

    private TravelReviewDto.ReviewResponse toResponse(TravelReview review) {
        double avg = review.getAverageScore();
        double rounded = Math.round(avg * 100.0) / 100.0;

        return TravelReviewDto.ReviewResponse.builder()
                .id(review.getId())
                .reviewerSummary(toReviewerSummary(review.getReviewer()))
                .punctualityScore(review.getPunctualityScore())
                .mannersScore(review.getMannersScore())
                .communicationScore(review.getCommunicationScore())
                .wouldTravelAgain(review.getWouldTravelAgain())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .averageScore(rounded)
                .build();
    }

    private TravelReviewDto.ReviewerSummary toReviewerSummary(User user) {
        if (user == null) return null;
        return TravelReviewDto.ReviewerSummary.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
