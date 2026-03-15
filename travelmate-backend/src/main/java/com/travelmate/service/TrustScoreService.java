package com.travelmate.service;

import com.travelmate.entity.User;
import com.travelmate.entity.UserTrustScore;
import com.travelmate.entity.UserTrustScore.TrustBadge;
import com.travelmate.repository.ReportRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.UserTrustScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TrustScoreService {

    private final UserTrustScoreRepository trustScoreRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;

    private static final int BASE_SCORE_DEFAULT = 50;
    private static final double BASE_WEIGHT = 0.3;
    private static final double REVIEW_WEIGHT = 0.5;
    private static final double ACTIVITY_WEIGHT = 0.2;

    /**
     * 사용자 신뢰 점수 조회 (없으면 생성)
     */
    @Transactional(readOnly = true)
    public UserTrustScore getTrustScore(Long userId) {
        return trustScoreRepository.findByUserId(userId)
                .orElseGet(() -> {
                    // 읽기 전용이므로 저장은 안 하고 기본값 반환
                    UserTrustScore score = new UserTrustScore();
                    score.setBaseScore(BASE_SCORE_DEFAULT);
                    score.setTotalScore(BASE_SCORE_DEFAULT);
                    score.setTrustBadge(TrustBadge.NEW);
                    return score;
                });
    }

    /**
     * 신뢰 점수 재계산
     * 공식: total = base(30%) + review(50%) + activity(20%)
     * - base: 50 기본, 신고 받으면 감소
     * - review: 평균 리뷰 점수 × 20 (1~5점 → 20~100)
     * - activity: 활동 기간/리뷰 수 기반
     */
    public UserTrustScore recalculate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.travelmate.exception.BusinessException("사용자를 찾을 수 없습니다."));

        UserTrustScore trustScore = trustScoreRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserTrustScore newScore = new UserTrustScore();
                    newScore.setUser(user);
                    return newScore;
                });

        // Base score: 50 - (유효 신고 수 × 5), 최소 0
        long validReports = reportRepository.countValidReportsByUserId(userId);
        int baseScore = Math.max(0, BASE_SCORE_DEFAULT - (int)(validReports * 5));

        // Review score: 평균 평점 × 20 (0~100)
        Double avgRating = user.getRatingAverage();
        int reviewScore = avgRating != null ? (int)(avgRating * 20) : 0;

        // Activity score: 가입 기간(월) × 5 + 리뷰 수 × 3, 최대 100
        long monthsSinceJoin = java.time.temporal.ChronoUnit.MONTHS.between(
                user.getCreatedAt(), LocalDateTime.now());
        int reviewCount = user.getReviewCount() != null ? user.getReviewCount() : 0;
        int activityScore = Math.min(100, (int)(monthsSinceJoin * 5) + reviewCount * 3);

        // 가중 합산
        int totalScore = (int)(baseScore * BASE_WEIGHT + reviewScore * REVIEW_WEIGHT + activityScore * ACTIVITY_WEIGHT);
        totalScore = Math.min(100, Math.max(0, totalScore));

        trustScore.setBaseScore(baseScore);
        trustScore.setReviewScore(reviewScore);
        trustScore.setActivityScore(activityScore);
        trustScore.setTotalScore(totalScore);
        trustScore.setTrustBadge(UserTrustScore.calculateBadge(totalScore));
        trustScore.setLastCalculatedAt(LocalDateTime.now());

        trustScore = trustScoreRepository.save(trustScore);
        log.info("신뢰 점수 재계산: userId={}, total={}, badge={}", userId, totalScore, trustScore.getTrustBadge());

        return trustScore;
    }
}
