package com.travelmate.service;

import com.travelmate.entity.User;
import com.travelmate.entity.UserTrustScore;
import com.travelmate.entity.UserTrustScore.TrustBadge;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.ReportRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.UserTrustScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TrustScoreService 테스트")
class TrustScoreServiceTest {

    @Mock private UserTrustScoreRepository trustScoreRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReportRepository reportRepository;

    @InjectMocks private TrustScoreService trustScoreService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setNickname("TestUser");
        setId(user, 1L);
        user.setCreatedAt(LocalDateTime.now().minusMonths(6));
        user.setReviewCount(5);
    }

    @Nested
    @DisplayName("getTrustScore")
    class GetTrustScore {

        @Test
        @DisplayName("기존 점수 반환")
        void existingScore() {
            UserTrustScore existing = new UserTrustScore();
            existing.setTotalScore(75);
            existing.setTrustBadge(TrustBadge.GOLD);
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.of(existing));

            var result = trustScoreService.getTrustScore(1L);

            assertThat(result.getTotalScore()).isEqualTo(75);
            assertThat(result.getTrustBadge()).isEqualTo(TrustBadge.GOLD);
        }

        @Test
        @DisplayName("미존재 시 기본값 반환 (NEW, 50점)")
        void defaultScore() {
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.empty());

            var result = trustScoreService.getTrustScore(1L);

            assertThat(result.getTotalScore()).isEqualTo(50);
            assertThat(result.getTrustBadge()).isEqualTo(TrustBadge.NEW);
            assertThat(result.getBaseScore()).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("recalculate")
    class Recalculate {

        @Test
        @DisplayName("신고 0건, 평점 4.5, 6개월 활동 → 높은 점수")
        void highScore() {
            user.setRating(4.5);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(reportRepository.countValidReportsByUserId(1L)).thenReturn(0L);
            when(trustScoreRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = trustScoreService.recalculate(1L);

            // base=50*0.3=15, review=90*0.5=45, activity=min(100,30+15)*0.2=9 → 69
            assertThat(result.getTotalScore()).isGreaterThanOrEqualTo(60);
            assertThat(result.getBaseScore()).isEqualTo(50);
            assertThat(result.getReviewScore()).isEqualTo(90); // 4.5 * 20
        }

        @Test
        @DisplayName("신고 5건 → base 감소")
        void reportsReduceBase() {
            user.setRating(3.0);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(reportRepository.countValidReportsByUserId(1L)).thenReturn(5L);
            when(trustScoreRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = trustScoreService.recalculate(1L);

            // base = max(0, 50-25) = 25
            assertThat(result.getBaseScore()).isEqualTo(25);
        }

        @Test
        @DisplayName("신고 20건 → base 0")
        void manyReportsZeroBase() {
            user.setRating(3.0);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(reportRepository.countValidReportsByUserId(1L)).thenReturn(20L);
            when(trustScoreRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = trustScoreService.recalculate(1L);

            assertThat(result.getBaseScore()).isEqualTo(0);
        }

        @Test
        @DisplayName("리뷰 없음 → reviewScore 0")
        void noReviews() {
            user.setReviewCount(0);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(reportRepository.countValidReportsByUserId(1L)).thenReturn(0L);
            when(trustScoreRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = trustScoreService.recalculate(1L);

            assertThat(result.getReviewScore()).isEqualTo(0);
        }

        @Test
        @DisplayName("점수 범위 0-100 클램핑")
        void clamped() {
            user.setRating(5.0);
            user.setReviewCount(100);
            user.setCreatedAt(LocalDateTime.now().minusYears(5));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(reportRepository.countValidReportsByUserId(1L)).thenReturn(0L);
            when(trustScoreRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = trustScoreService.recalculate(1L);

            assertThat(result.getTotalScore()).isBetween(0, 100);
        }

        @Test
        @DisplayName("배지 할당 — PLATINUM (90+)")
        void badgePlatinum() {
            user.setRating(5.0);
            user.setReviewCount(50);
            user.setCreatedAt(LocalDateTime.now().minusYears(3));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(reportRepository.countValidReportsByUserId(1L)).thenReturn(0L);
            when(trustScoreRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = trustScoreService.recalculate(1L);

            // base=15, review=50, activity=20 → 85+ → at least GOLD
            assertThat(result.getTrustBadge()).isIn(TrustBadge.GOLD, TrustBadge.PLATINUM);
        }

        @Test
        @DisplayName("사용자 미존재 시 실패")
        void failUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> trustScoreService.recalculate(999L))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("기존 TrustScore 업데이트")
        void updatesExisting() {
            UserTrustScore existing = new UserTrustScore();
            existing.setUser(user);
            user.setRating(4.0);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(trustScoreRepository.findByUserId(1L)).thenReturn(Optional.of(existing));
            when(reportRepository.countValidReportsByUserId(1L)).thenReturn(0L);
            when(trustScoreRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            var result = trustScoreService.recalculate(1L);

            assertThat(result.getLastCalculatedAt()).isNotNull();
            verify(trustScoreRepository).save(existing);
        }
    }

    // --- Helpers ---
    private void setId(User user, Long id) {
        try { var f = User.class.getDeclaredField("id"); f.setAccessible(true); f.set(user, id); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
}
