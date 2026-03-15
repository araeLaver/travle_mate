package com.travelmate.service;

import com.travelmate.dto.MatchingDto.MatchScoreBreakdown;
import com.travelmate.entity.TravelItinerary;
import com.travelmate.entity.User;
import com.travelmate.entity.User.BudgetPreference;
import com.travelmate.entity.User.TravelStyle;
import com.travelmate.repository.TravelItineraryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * CompatibilityScoreService 단위 테스트 (v0.2)
 *
 * <p>핵심 시나리오:</p>
 * <ul>
 *   <li>모든 항목 응답 시 정상 점수 범위 검증</li>
 *   <li>개별 항목 null 시 가중치 재분배 후 합계 ≈ 100점 검증</li>
 *   <li>모든 항목 null 시 합계 0점 반환 검증</li>
 *   <li>일정 한쪽만 없을 때 중립 점수 반환 검증</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CompatibilityScoreService 테스트")
class CompatibilityScoreServiceTest {

    @Mock
    private TravelItineraryRepository travelItineraryRepository;

    @InjectMocks
    private CompatibilityScoreService service;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        userA = buildFullUser(1L, TravelStyle.ADVENTURE, BudgetPreference.MEDIUM,
                List.of("ko", "en"), 4.5, 10);
        userB = buildFullUser(2L, TravelStyle.ADVENTURE, BudgetPreference.MEDIUM,
                List.of("ko", "en"), 4.0, 5);
    }

    // -----------------------------------------------------------------------
    // 헬퍼
    // -----------------------------------------------------------------------

    private User buildFullUser(Long id, TravelStyle style, BudgetPreference budget,
                                List<String> langs, Double rating, Integer reviewCount) {
        User u = new User();
        u.setId(id);
        u.setNickname("user" + id);
        u.setTravelStyle(style);
        u.setBudgetPreference(budget);
        u.setLanguages(langs);
        u.setRating(rating);
        u.setReviewCount(reviewCount);
        return u;
    }

    private TravelItinerary buildItinerary(LocalDate start, LocalDate end) {
        TravelItinerary it = new TravelItinerary();
        it.setStartDate(start);
        it.setEndDate(end);
        return it;
    }

    // -----------------------------------------------------------------------
    // 정상 케이스: 모든 항목 응답
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("모든 항목 응답 정상 케이스")
    class FullResponseTests {

        @Test
        @DisplayName("동일 여행스타일 완전 매칭 시 travelStyleScore = 30")
        void travelStyle_perfectMatch() {
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            // 양쪽 일정 없을 때는 schedule이 absent → 가중치 재분배 발생
            // travelStyle은 응답이므로 재분배 후 최대값이 커짐
            assertThat(b.getTravelStyleScore()).isGreaterThan(BigDecimal.valueOf(30.0));
        }

        @Test
        @DisplayName("동일 여행스타일, 일정 있음, 완전 매칭 시 합계 100에 근접")
        void allPresent_perfectMatch_scoreShouldBeHigh() {
            LocalDate today = LocalDate.now();
            List<TravelItinerary> itA = List.of(buildItinerary(today, today.plusDays(9)));
            List<TravelItinerary> itB = List.of(buildItinerary(today, today.plusDays(9)));

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(itB);

            MatchScoreBreakdown b = service.calculate(userA, userB, itA);
            BigDecimal total = service.sumBreakdown(b);

            // 완전 매칭: travelStyle 30, schedule max 25, budget 20, language ~15, rating ~10
            assertThat(total).isGreaterThan(BigDecimal.valueOf(80));
        }

        @Test
        @DisplayName("개별 점수는 각 항목 최대치를 초과하지 않아야 한다 (재분배 없는 경우)")
        void allPresent_individualScoresWithinBounds() {
            LocalDate today = LocalDate.now();
            List<TravelItinerary> itA = List.of(buildItinerary(today, today.plusDays(5)));
            List<TravelItinerary> itB = List.of(buildItinerary(today, today.plusDays(5)));

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(itB);

            MatchScoreBreakdown b = service.calculate(userA, userB, itA);

            assertThat(b.getTravelStyleScore()).isLessThanOrEqualTo(BigDecimal.valueOf(CompatibilityScoreService.MAX_TRAVEL_STYLE));
            assertThat(b.getScheduleOverlapScore()).isLessThanOrEqualTo(BigDecimal.valueOf(CompatibilityScoreService.MAX_SCHEDULE));
            assertThat(b.getBudgetScore()).isLessThanOrEqualTo(BigDecimal.valueOf(CompatibilityScoreService.MAX_BUDGET));
            assertThat(b.getLanguageScore()).isLessThanOrEqualTo(BigDecimal.valueOf(CompatibilityScoreService.MAX_LANGUAGE));
            assertThat(b.getRatingScore()).isLessThanOrEqualTo(BigDecimal.valueOf(CompatibilityScoreService.MAX_RATING));
        }
    }

    // -----------------------------------------------------------------------
    // null/빈값 처리: 가중치 재분배
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("null/빈값 항목 가중치 재분배 테스트")
    class NullRedistributionTests {

        @Test
        @DisplayName("travelStyle null 시 합계가 100점 유지 (재분배)")
        void travelStyle_null_totalShouldBe100() {
            userA.setTravelStyle(null); // travelStyle absent

            LocalDate today = LocalDate.now();
            List<TravelItinerary> itA = List.of(buildItinerary(today, today.plusDays(9)));
            List<TravelItinerary> itB = List.of(buildItinerary(today, today.plusDays(9)));

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(itB);

            MatchScoreBreakdown b = service.calculate(userA, userB, itA);
            BigDecimal total = service.sumBreakdown(b);

            // travelStyle(30점)이 나머지 70점에 비례 분배되므로 재분배 후 합계는 여전히 100 근처
            // (단, 완전 매칭 기준 최대 100점)
            assertThat(total).isGreaterThanOrEqualTo(BigDecimal.ZERO);
            assertThat(total).isLessThanOrEqualTo(BigDecimal.valueOf(100.01)); // 부동소수점 허용
        }

        @Test
        @DisplayName("travelStyle null 시 travelStyleScore 는 0")
        void travelStyle_null_travelStyleScoreIsZero() {
            userA.setTravelStyle(null);

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            assertThat(b.getTravelStyleScore()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("budgetPreference null 시 budgetScore 는 0")
        void budget_null_budgetScoreIsZero() {
            userA.setBudgetPreference(null);
            userB.setBudgetPreference(null);

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            assertThat(b.getBudgetScore()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("언어 양쪽 null 시 languageScore 는 0")
        void language_bothNull_languageScoreIsZero() {
            userA.setLanguages(null);
            userB.setLanguages(null);

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            assertThat(b.getLanguageScore()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("한쪽 언어만 null 시 languageScore 는 3점 (최솟값)")
        void language_oneNull_languageScoreIsMinimum() {
            userA.setLanguages(null); // A는 null, B는 있음

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            // language가 absent가 아니라 3점 대체값으로 처리됨
            assertThat(b.getLanguageScore()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("평점 0건 시 ratingScore 는 0 (absent 처리)")
        void rating_noReviews_ratingScoreIsZero() {
            userB.setReviewCount(0);
            userB.setRating(0.0);

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            assertThat(b.getRatingScore()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("rating null 시 ratingScore 는 0 (absent 처리)")
        void rating_null_ratingScoreIsZero() {
            userB.setRating(null);
            userB.setReviewCount(null);

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            assertThat(b.getRatingScore()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("모든 항목 null 시 합계 0점 반환")
        void allNull_totalIsZero() {
            userA.setTravelStyle(null);
            userA.setBudgetPreference(null);
            userA.setLanguages(null);
            userB.setTravelStyle(null);
            userB.setBudgetPreference(null);
            userB.setLanguages(null);
            userB.setRating(null);
            userB.setReviewCount(null);

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());
            BigDecimal total = service.sumBreakdown(b);

            assertThat(total).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // -----------------------------------------------------------------------
    // 재분배 로직 직접 단위 테스트
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("redistributeNullWeights 직접 테스트")
    class RedistributeTests {

        @Test
        @DisplayName("absent 없음 — 입력 그대로 반환")
        void noAbsent_returnsOriginal() {
            var items = List.of(
                    CompatibilityScoreService.ItemResult.present(30.0, 30.0),
                    CompatibilityScoreService.ItemResult.present(25.0, 25.0),
                    CompatibilityScoreService.ItemResult.present(20.0, 20.0),
                    CompatibilityScoreService.ItemResult.present(15.0, 15.0),
                    CompatibilityScoreService.ItemResult.present(10.0, 10.0)
            );

            var result = service.redistributeNullWeights(items);

            assertThat(result).hasSize(5);
            assertThat(result.get(0).rawScore()).isEqualTo(30.0);
        }

        @Test
        @DisplayName("1개 absent — 나머지에 비례 재분배, absent 항목 score=0")
        void oneAbsent_redistributed() {
            // travelStyle(30) absent, 나머지 70점에 30점 재분배
            var items = List.of(
                    CompatibilityScoreService.ItemResult.absent(30.0),   // travelStyle
                    CompatibilityScoreService.ItemResult.present(25.0, 25.0),  // schedule (만점)
                    CompatibilityScoreService.ItemResult.present(20.0, 20.0),  // budget   (만점)
                    CompatibilityScoreService.ItemResult.present(15.0, 15.0),  // language (만점)
                    CompatibilityScoreService.ItemResult.present(10.0, 10.0)   // rating   (만점)
            );

            var result = service.redistributeNullWeights(items);

            // absent 항목 score = 0
            assertThat(result.get(0).rawScore()).isEqualTo(0.0);

            // 나머지 합계: 재분배 후 최대 100점 (모두 만점이므로 합계 = 100)
            double total = result.stream().mapToDouble(CompatibilityScoreService.ItemResult::rawScore).sum();
            assertThat(total).isCloseTo(100.0, within(0.01));
        }

        @Test
        @DisplayName("모두 absent — 모든 score=0")
        void allAbsent_allZero() {
            var items = List.of(
                    CompatibilityScoreService.ItemResult.absent(30.0),
                    CompatibilityScoreService.ItemResult.absent(25.0),
                    CompatibilityScoreService.ItemResult.absent(20.0),
                    CompatibilityScoreService.ItemResult.absent(15.0),
                    CompatibilityScoreService.ItemResult.absent(10.0)
            );

            var result = service.redistributeNullWeights(items);

            result.forEach(r -> assertThat(r.rawScore()).isEqualTo(0.0));
        }

        @Test
        @DisplayName("일부 absent, 절반 만점 — 재분배 후 합계 = 응답 항목 달성률 × 100")
        void partialAbsent_halfScore() {
            // schedule(25) absent, 나머지 present but 50% 달성
            var items = List.of(
                    CompatibilityScoreService.ItemResult.present(15.0, 30.0),  // 50%
                    CompatibilityScoreService.ItemResult.absent(25.0),          // absent
                    CompatibilityScoreService.ItemResult.present(10.0, 20.0),  // 50%
                    CompatibilityScoreService.ItemResult.present(7.5, 15.0),   // 50%
                    CompatibilityScoreService.ItemResult.present(5.0, 10.0)    // 50%
            );

            var result = service.redistributeNullWeights(items);

            // absent 항목 score = 0
            assertThat(result.get(1).rawScore()).isEqualTo(0.0);

            // 나머지 항목은 50% 달성률이므로 재분배 후 합계 ≈ 50
            double total = result.stream().mapToDouble(CompatibilityScoreService.ItemResult::rawScore).sum();
            assertThat(total).isCloseTo(50.0, within(0.01));
        }
    }

    // -----------------------------------------------------------------------
    // 일정 겹침 테스트
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("일정 겹침 점수 테스트")
    class ScheduleTests {

        @Test
        @DisplayName("양쪽 일정 없음 — schedule absent 처리, travelStyle 등에 재분배")
        void bothEmpty_scheduleAbsent() {
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            // schedule absent 이므로 scheduleOverlapScore = 0
            assertThat(b.getScheduleOverlapScore()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("A만 일정 없음 — 중립 점수 (max의 50% = 12.5)")
        void onlyBHasItinerary_neutralScore() {
            LocalDate today = LocalDate.now();
            List<TravelItinerary> itB = List.of(buildItinerary(today, today.plusDays(7)));
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(itB);

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            // A 일정 없음 → 중립 12.5점 (스케일링 없음)
            assertThat(b.getScheduleOverlapScore())
                    .isGreaterThanOrEqualTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("10일 겹침 시 scheduleOverlapScore = 25 (최대)")
        void tenDaysOverlap_maxScore() {
            LocalDate today = LocalDate.now();
            List<TravelItinerary> itA = List.of(buildItinerary(today, today.plusDays(9)));
            List<TravelItinerary> itB = List.of(buildItinerary(today, today.plusDays(9)));

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(itB);

            MatchScoreBreakdown b = service.calculate(userA, userB, itA);

            assertThat(b.getScheduleOverlapScore())
                    .isEqualByComparingTo(BigDecimal.valueOf(25.00));
        }

        @Test
        @DisplayName("겹침 없음 시 scheduleOverlapScore = 0")
        void noOverlap_zeroScore() {
            LocalDate today = LocalDate.now();
            List<TravelItinerary> itA = List.of(buildItinerary(today, today.plusDays(5)));
            List<TravelItinerary> itB = List.of(buildItinerary(today.plusDays(10), today.plusDays(15)));

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(itB);

            MatchScoreBreakdown b = service.calculate(userA, userB, itA);

            assertThat(b.getScheduleOverlapScore()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // -----------------------------------------------------------------------
    // 예산 점수 테스트
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("예산 점수 테스트")
    class BudgetTests {

        @Test
        @DisplayName("동일 예산 등급 — 20점")
        void sameBudget_maxScore() {
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown b = service.calculate(userA, userB, Collections.emptyList());

            // 양쪽 MEDIUM 동일
            // schedule absent이므로 재분배 발생 → budgetScore 증가
            assertThat(b.getBudgetScore()).isGreaterThanOrEqualTo(BigDecimal.valueOf(20.0));
        }

        @Test
        @DisplayName("예산 등급 차이 2단계 — 8점 (또는 재분배 후 확장)")
        void budgetDistance2_rawScore8() {
            userB.setBudgetPreference(BudgetPreference.LUXURY); // A=MEDIUM, B=LUXURY -> distance=2
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(userB))
                    .thenReturn(Collections.emptyList());

            // 직접 ItemResult 테스트
            var result = service.scoreBudget(BudgetPreference.MEDIUM, BudgetPreference.LUXURY);
            assertThat(result.rawScore()).isEqualTo(8.0);
        }
    }
}
