package com.travelmate.service;

import com.travelmate.dto.MatchingDto.MatchScoreBreakdown;
import com.travelmate.entity.TravelItinerary;
import com.travelmate.entity.User;
import com.travelmate.entity.User.BudgetPreference;
import com.travelmate.entity.User.TravelStyle;
import com.travelmate.repository.TravelItineraryRepository;
import com.travelmate.util.TravelStyleMatcher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 동행 호환도(궁합) 점수 산정 서비스.
 *
 * <p>5개 항목(여행스타일 30 · 일정겹침 25 · 예산 20 · 언어 15 · 평점 10, 합 100)을 산정하되,
 * 데이터가 없는(absent) 항목은 0점 처리하고 그 가중치를 응답 항목에 <b>비례 재분배</b>하여
 * 희소 데이터 상황에서도 달성률(0~100%)이 왜곡되지 않게 한다.
 *
 * <p>기존에는 결측 항목을 고정 중립점수로 채웠으나, 이는 데이터가 부족한 사용자에게
 * 실제보다 높은 점수를 부여하는 왜곡을 낳는다. 재분배 방식은 "응답한 항목들의 달성률"로
 * 총점을 정규화한다.
 */
@Service
@RequiredArgsConstructor
public class CompatibilityScoreService {

    public static final double MAX_TRAVEL_STYLE = 30.0;
    public static final double MAX_SCHEDULE = 25.0;
    public static final double MAX_BUDGET = 20.0;
    public static final double MAX_LANGUAGE = 15.0;
    public static final double MAX_RATING = 10.0;

    private static final double TOTAL_WEIGHT = 100.0;
    private static final double SCHEDULE_NEUTRAL = 12.5; // 한쪽만 일정 보유 시 중립
    private static final double LANGUAGE_MIN = 3.0;       // 한쪽만 언어 보유 시 최솟값

    private final TravelItineraryRepository travelItineraryRepository;

    /** 항목별 산정 결과. present=false 이면 재분배 대상(absent). */
    public record ItemResult(double rawScore, double maxWeight, boolean present) {
        public static ItemResult present(double rawScore, double maxWeight) {
            return new ItemResult(rawScore, maxWeight, true);
        }
        public static ItemResult absent(double maxWeight) {
            return new ItemResult(0.0, maxWeight, false);
        }
    }

    /**
     * 두 사용자의 호환도 breakdown 을 산정한다. userB 의 일정은 저장소에서 조회한다.
     */
    public MatchScoreBreakdown calculate(User userA, User userB, List<TravelItinerary> userAItineraries) {
        List<TravelItinerary> userBItineraries =
                travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB);

        ItemResult travelStyle = scoreTravelStyle(userA.getTravelStyle(), userB.getTravelStyle());
        ItemResult schedule = scoreSchedule(userAItineraries, userBItineraries);
        ItemResult budget = scoreBudget(userA.getBudgetPreference(), userB.getBudgetPreference());
        ItemResult language = scoreLanguage(userA.getLanguages(), userB.getLanguages());
        ItemResult rating = scoreRating(userB);

        List<ItemResult> r = redistributeNullWeights(List.of(travelStyle, schedule, budget, language, rating));

        return MatchScoreBreakdown.builder()
                .travelStyleScore(round(r.get(0).rawScore()))
                .scheduleOverlapScore(round(r.get(1).rawScore()))
                .budgetScore(round(r.get(2).rawScore()))
                .languageScore(round(r.get(3).rawScore()))
                .ratingScore(round(r.get(4).rawScore()))
                .build();
    }

    /** breakdown 5개 항목의 합계. */
    public BigDecimal sumBreakdown(MatchScoreBreakdown b) {
        return b.getTravelStyleScore()
                .add(b.getScheduleOverlapScore())
                .add(b.getBudgetScore())
                .add(b.getLanguageScore())
                .add(b.getRatingScore());
    }

    /**
     * 결측(absent) 항목의 가중치를 응답 항목에 비례 재분배한다.
     * <ul>
     *   <li>absent 없음 → 입력 그대로 반환</li>
     *   <li>일부 absent → absent 항목은 0, 응답 항목은 (응답 가중치 합이 100이 되도록) 스케일업하여 달성률 유지</li>
     *   <li>전부 absent → 모두 0</li>
     * </ul>
     */
    public List<ItemResult> redistributeNullWeights(List<ItemResult> items) {
        boolean anyAbsent = items.stream().anyMatch(i -> !i.present());
        if (!anyAbsent) {
            return new ArrayList<>(items);
        }

        double presentMax = items.stream()
                .filter(ItemResult::present)
                .mapToDouble(ItemResult::maxWeight)
                .sum();

        List<ItemResult> out = new ArrayList<>(items.size());
        if (presentMax <= 0) {
            for (ItemResult i : items) {
                out.add(new ItemResult(0.0, i.maxWeight(), i.present()));
            }
            return out;
        }

        double scale = TOTAL_WEIGHT / presentMax;
        for (ItemResult i : items) {
            if (!i.present()) {
                out.add(new ItemResult(0.0, i.maxWeight(), false));
            } else {
                double achievement = i.maxWeight() > 0 ? i.rawScore() / i.maxWeight() : 0.0;
                double newMax = i.maxWeight() * scale;
                out.add(new ItemResult(achievement * newMax, newMax, true));
            }
        }
        return out;
    }

    // ===== 항목별 산정 =====

    public ItemResult scoreTravelStyle(TravelStyle a, TravelStyle b) {
        if (a == null || b == null) {
            return ItemResult.absent(MAX_TRAVEL_STYLE);
        }
        double score = TravelStyleMatcher.calculateCompatibilityScore(a, b);
        return ItemResult.present(Math.min(MAX_TRAVEL_STYLE, score), MAX_TRAVEL_STYLE);
    }

    public ItemResult scoreSchedule(List<TravelItinerary> aItineraries, List<TravelItinerary> bItineraries) {
        boolean aEmpty = aItineraries == null || aItineraries.isEmpty();
        boolean bEmpty = bItineraries == null || bItineraries.isEmpty();
        if (aEmpty && bEmpty) {
            return ItemResult.absent(MAX_SCHEDULE);
        }
        if (aEmpty || bEmpty) {
            return ItemResult.present(SCHEDULE_NEUTRAL, MAX_SCHEDULE);
        }
        long maxOverlapDays = 0;
        for (TravelItinerary it1 : aItineraries) {
            for (TravelItinerary it2 : bItineraries) {
                maxOverlapDays = Math.max(maxOverlapDays, overlapDays(
                        it1.getStartDate(), it1.getEndDate(), it2.getStartDate(), it2.getEndDate()));
            }
        }
        double score = Math.min(MAX_SCHEDULE, maxOverlapDays * 2.5);
        return ItemResult.present(score, MAX_SCHEDULE);
    }

    public ItemResult scoreBudget(BudgetPreference a, BudgetPreference b) {
        if (a == null || b == null) {
            return ItemResult.absent(MAX_BUDGET);
        }
        int distance = Math.abs(a.ordinal() - b.ordinal());
        double score = switch (distance) {
            case 0 -> 20.0;
            case 1 -> 14.0;
            case 2 -> 8.0;
            default -> 2.0;
        };
        return ItemResult.present(score, MAX_BUDGET);
    }

    public ItemResult scoreLanguage(List<String> a, List<String> b) {
        boolean aEmpty = a == null || a.isEmpty();
        boolean bEmpty = b == null || b.isEmpty();
        if (aEmpty && bEmpty) {
            return ItemResult.absent(MAX_LANGUAGE);
        }
        if (aEmpty || bEmpty) {
            return ItemResult.present(LANGUAGE_MIN, MAX_LANGUAGE);
        }
        Set<String> set1 = new HashSet<>(a);
        Set<String> set2 = new HashSet<>(b);
        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);
        if (intersection.isEmpty()) {
            return ItemResult.present(LANGUAGE_MIN, MAX_LANGUAGE);
        }
        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);
        double jaccard = (double) intersection.size() / union.size();
        double score = Math.min(MAX_LANGUAGE, jaccard * 12.0 + 3.0);
        return ItemResult.present(score, MAX_LANGUAGE);
    }

    public ItemResult scoreRating(User user) {
        Double rating = user.getRating();
        Integer reviewCount = user.getReviewCount();
        if (rating == null || reviewCount == null || reviewCount == 0) {
            return ItemResult.absent(MAX_RATING);
        }
        double ratingPart = (rating / 5.0) * 8.0;
        double reviewPart = Math.min(2.0, reviewCount * 0.2);
        double score = Math.min(MAX_RATING, ratingPart + reviewPart);
        return ItemResult.present(score, MAX_RATING);
    }

    // ===== 유틸 =====

    private long overlapDays(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        LocalDate overlapStart = start1.isAfter(start2) ? start1 : start2;
        LocalDate overlapEnd = end1.isBefore(end2) ? end1 : end2;
        long days = ChronoUnit.DAYS.between(overlapStart, overlapEnd) + 1;
        return Math.max(0, days);
    }

    private BigDecimal round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }
}
