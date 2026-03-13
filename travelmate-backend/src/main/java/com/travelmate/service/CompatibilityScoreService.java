package com.travelmate.service;

import com.travelmate.entity.TravelItinerary;
import com.travelmate.entity.User;
import com.travelmate.entity.User.BudgetPreference;
import com.travelmate.entity.User.TravelStyle;
import com.travelmate.repository.TravelItineraryRepository;
import com.travelmate.util.TravelStyleMatcher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 동반자 호환성 점수 계산 서비스
 *
 * 점수 구성 (합계 0~100):
 *   - 여행스타일 일치도  30%  (0~30)
 *   - 일정 겹침도       25%  (0~25)
 *   - 예산 유사도       20%  (0~20)
 *   - 언어 공통성       15%  (0~15)
 *   - 사용자 평점       10%  (0~10)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CompatibilityScoreService {

    // 가중치 상수
    private static final double TRAVEL_STYLE_WEIGHT  = 30.0;
    private static final double SCHEDULE_WEIGHT       = 25.0;
    private static final double BUDGET_WEIGHT         = 20.0;
    private static final double LANGUAGE_WEIGHT       = 15.0;
    private static final double RATING_WEIGHT         = 10.0;

    // 각 항목 중립 기본값 (데이터 없을 때 사용)
    private static final double DEFAULT_TRAVEL_STYLE_RATIO  = 0.5;  // 15.0 / 30.0
    private static final double DEFAULT_SCHEDULE_RATIO      = 0.5;  // 12.5 / 25.0
    private static final double DEFAULT_BUDGET_RATIO        = 0.5;  // 10.0 / 20.0
    private static final double DEFAULT_LANGUAGE_RATIO      = 0.5;  // 7.5  / 15.0
    private static final double DEFAULT_RATING_RATIO        = 0.5;  // 5.0  / 10.0

    private final TravelItineraryRepository travelItineraryRepository;

    /**
     * 두 사용자 간 총 호환성 점수 계산 (0~100)
     *
     * @param user1 기준 사용자
     * @param user2 비교 대상 사용자
     * @return 0~100 범위의 호환성 점수
     */
    public double calculateTotalScore(User user1, User user2) {
        double travelStyleScore  = calculateTravelStyleScore(user1.getTravelStyle(), user2.getTravelStyle());
        double scheduleScore     = calculateScheduleScore(user1, user2);
        double budgetScore       = calculateBudgetScore(user1.getBudgetPreference(), user2.getBudgetPreference());
        double languageScore     = calculateLanguageScore(user1.getLanguages(), user2.getLanguages());
        double ratingScore       = calculateRatingScore(user2);

        double total = travelStyleScore + scheduleScore + budgetScore + languageScore + ratingScore;

        log.debug("호환성 점수 계산 - user1={}, user2={}: 여행스타일={}, 일정={}, 예산={}, 언어={}, 평점={}, 합계={}",
                user1.getId(), user2.getId(),
                travelStyleScore, scheduleScore, budgetScore, languageScore, ratingScore, total);

        return Math.min(100.0, Math.max(0.0, total));
    }

    // ===== 세부 점수 계산 =====

    /**
     * 여행스타일 일치도 (0~30)
     * - TravelStyleMatcher 유틸리티 사용
     * - 필드 없으면 중립값 15.0 반환
     */
    public double calculateTravelStyleScore(TravelStyle style1, TravelStyle style2) {
        if (style1 == null || style2 == null) {
            return TRAVEL_STYLE_WEIGHT * DEFAULT_TRAVEL_STYLE_RATIO; // 15.0
        }
        // TravelStyleMatcher는 0~30 범위 점수를 직접 반환
        return TravelStyleMatcher.calculateCompatibilityScore(style1, style2);
    }

    /**
     * 일정 겹침도 (0~25)
     * - 두 사용자의 TravelItinerary 간 최대 겹치는 날 수로 계산
     * - 겹치는 날 1일당 2.5점, 최대 25점
     * - 일정 없으면 중립값 12.5 반환
     */
    public double calculateScheduleScore(User user1, User user2) {
        List<TravelItinerary> itineraries1 = travelItineraryRepository.findByOwnerOrderByStartDateDesc(user1);
        List<TravelItinerary> itineraries2 = travelItineraryRepository.findByOwnerOrderByStartDateDesc(user2);

        if (itineraries1.isEmpty() || itineraries2.isEmpty()) {
            return SCHEDULE_WEIGHT * DEFAULT_SCHEDULE_RATIO; // 12.5
        }

        long maxOverlapDays = 0;
        for (TravelItinerary it1 : itineraries1) {
            for (TravelItinerary it2 : itineraries2) {
                long overlap = calculateOverlapDays(
                        it1.getStartDate(), it1.getEndDate(),
                        it2.getStartDate(), it2.getEndDate());
                if (overlap > maxOverlapDays) {
                    maxOverlapDays = overlap;
                }
            }
        }

        return Math.min(SCHEDULE_WEIGHT, maxOverlapDays * 2.5);
    }

    /**
     * 예산 유사도 (0~20)
     * - BudgetPreference enum의 ordinal 거리 기반 계산
     * - 1 - |ordinal1 - ordinal2| / 3 비율로 환산 후 가중치 적용
     * - null 시 중립값 10.0 반환
     */
    public double calculateBudgetScore(BudgetPreference bp1, BudgetPreference bp2) {
        if (bp1 == null || bp2 == null) {
            return BUDGET_WEIGHT * DEFAULT_BUDGET_RATIO; // 10.0
        }

        int maxDistance = BudgetPreference.values().length - 1; // 3 (BUDGET~LUXURY)
        int distance = Math.abs(bp1.ordinal() - bp2.ordinal());
        double ratio = 1.0 - (double) distance / maxDistance;

        return BUDGET_WEIGHT * ratio;
    }

    /**
     * 언어 공통성 (0~15)
     * - 공통 언어 수 / max(두 사용자 언어 수) 비율 적용
     * - 빈 목록 시 중립값 7.5 반환
     */
    public double calculateLanguageScore(List<String> languages1, List<String> languages2) {
        if (languages1 == null || languages1.isEmpty()
                || languages2 == null || languages2.isEmpty()) {
            return LANGUAGE_WEIGHT * DEFAULT_LANGUAGE_RATIO; // 7.5
        }

        Set<String> set1 = new HashSet<>(languages1);
        Set<String> set2 = new HashSet<>(languages2);

        Set<String> common = new HashSet<>(set1);
        common.retainAll(set2);

        int maxCount = Math.max(set1.size(), set2.size());
        if (maxCount == 0) {
            return LANGUAGE_WEIGHT * DEFAULT_LANGUAGE_RATIO;
        }

        double ratio = (double) common.size() / maxCount;
        return LANGUAGE_WEIGHT * ratio;
    }

    /**
     * 사용자 평점 (0~10)
     * - avgRating / 5.0 비율로 환산 후 가중치 적용
     * - 리뷰 없거나 평점 null 시 중립값 5.0 반환
     */
    public double calculateRatingScore(User user) {
        Double rating = user.getRating();
        Integer reviewCount = user.getReviewCount();

        if (rating == null || reviewCount == null || reviewCount == 0) {
            return RATING_WEIGHT * DEFAULT_RATING_RATIO; // 5.0
        }

        double ratio = Math.min(1.0, rating / 5.0);
        return RATING_WEIGHT * ratio;
    }

    // ===== 내부 유틸리티 =====

    /**
     * 두 기간의 겹치는 날 수 계산
     */
    private long calculateOverlapDays(LocalDate start1, LocalDate end1,
                                       LocalDate start2, LocalDate end2) {
        LocalDate overlapStart = start1.isAfter(start2) ? start1 : start2;
        LocalDate overlapEnd   = end1.isBefore(end2)   ? end1   : end2;
        long days = ChronoUnit.DAYS.between(overlapStart, overlapEnd) + 1;
        return Math.max(0L, days);
    }
}
