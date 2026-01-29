package com.travelmate.service;

import com.travelmate.dto.LeaderboardDto;
import com.travelmate.entity.nft.UserPoint;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import com.travelmate.repository.nft.UserPointRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaderboardService 테스트")
class LeaderboardServiceTest {

    @Mock
    private UserNftCollectionRepository userNftCollectionRepository;

    @Mock
    private UserPointRepository userPointRepository;

    @InjectMocks
    private LeaderboardService leaderboardService;

    @Nested
    @DisplayName("getGlobalLeaderboard 테스트")
    class GetGlobalLeaderboardTest {

        @Test
        @DisplayName("성공 - 전체 리더보드 조회")
        void getGlobalLeaderboard_Success() {
            // Given
            List<Object[]> topCollectors = new ArrayList<>();
            topCollectors.add(new Object[]{1L, "user1", "http://profile1.jpg", 100L});
            topCollectors.add(new Object[]{2L, "user2", "http://profile2.jpg", 80L});
            topCollectors.add(new Object[]{3L, "user3", "http://profile3.jpg", 60L});

            UserPoint userPoint1 = new UserPoint();
            userPoint1.setTotalPoints(1000L);

            UserPoint userPoint2 = new UserPoint();
            userPoint2.setTotalPoints(800L);

            UserPoint userPoint3 = new UserPoint();
            userPoint3.setTotalPoints(600L);

            List<Object[]> rarityBreakdown = new ArrayList<>();
            rarityBreakdown.add(new Object[]{"LEGENDARY", 5L});
            rarityBreakdown.add(new Object[]{"EPIC", 10L});
            rarityBreakdown.add(new Object[]{"RARE", 30L});
            rarityBreakdown.add(new Object[]{"COMMON", 55L});

            when(userNftCollectionRepository.findTopCollectorsByNftCount(10)).thenReturn(topCollectors);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(userPoint1));
            when(userPointRepository.findByUserId(2L)).thenReturn(Optional.of(userPoint2));
            when(userPointRepository.findByUserId(3L)).thenReturn(Optional.of(userPoint3));
            when(userNftCollectionRepository.getRarityBreakdownByUserId(anyLong())).thenReturn(rarityBreakdown);
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(100L);

            // When
            LeaderboardDto.LeaderboardResponse result = leaderboardService.getGlobalLeaderboard(10);

            // Then
            assertThat(result.getType()).isEqualTo("ALL_TIME");
            assertThat(result.getEntries()).hasSize(3);
            assertThat(result.getTotalParticipants()).isEqualTo(100);

            // 1등 확인
            LeaderboardDto.LeaderboardEntry firstPlace = result.getEntries().get(0);
            assertThat(firstPlace.getRank()).isEqualTo(1);
            assertThat(firstPlace.getUserId()).isEqualTo(1L);
            assertThat(firstPlace.getNickname()).isEqualTo("user1");
            assertThat(firstPlace.getNftCount()).isEqualTo(100);
            assertThat(firstPlace.getTotalPoints()).isEqualTo(1000);

            // 순위 순서 확인
            assertThat(result.getEntries().get(1).getRank()).isEqualTo(2);
            assertThat(result.getEntries().get(2).getRank()).isEqualTo(3);
        }

        @Test
        @DisplayName("성공 - 빈 리더보드")
        void getGlobalLeaderboard_Empty() {
            // Given
            when(userNftCollectionRepository.findTopCollectorsByNftCount(10)).thenReturn(List.of());
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(0L);

            // When
            LeaderboardDto.LeaderboardResponse result = leaderboardService.getGlobalLeaderboard(10);

            // Then
            assertThat(result.getEntries()).isEmpty();
            assertThat(result.getTotalParticipants()).isEqualTo(0);
        }

        @Test
        @DisplayName("성공 - 포인트 정보 없는 사용자")
        void getGlobalLeaderboard_NoPoints() {
            // Given
            List<Object[]> topCollectors = new ArrayList<>();
            topCollectors.add(new Object[]{1L, "user1", null, 50L});

            when(userNftCollectionRepository.findTopCollectorsByNftCount(10)).thenReturn(topCollectors);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(userNftCollectionRepository.getRarityBreakdownByUserId(1L)).thenReturn(List.of());
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(1L);

            // When
            LeaderboardDto.LeaderboardResponse result = leaderboardService.getGlobalLeaderboard(10);

            // Then
            assertThat(result.getEntries()).hasSize(1);
            assertThat(result.getEntries().get(0).getTotalPoints()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("getWeeklyLeaderboard 테스트")
    class GetWeeklyLeaderboardTest {

        @Test
        @DisplayName("성공 - 주간 리더보드 조회")
        void getWeeklyLeaderboard_Success() {
            // Given
            List<Object[]> topCollectors = new ArrayList<>();
            topCollectors.add(new Object[]{1L, "weekly_user1", "http://profile.jpg", 20L});

            UserPoint userPoint = new UserPoint();
            userPoint.setTotalPoints(200L);

            when(userNftCollectionRepository.findTopCollectorsByNftCountSince(any(LocalDateTime.class), eq(10)))
                    .thenReturn(topCollectors);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(userPoint));
            List<Object[]> rarityBreakdown = new ArrayList<>();
            rarityBreakdown.add(new Object[]{"RARE", 10L});
            rarityBreakdown.add(new Object[]{"COMMON", 10L});
            when(userNftCollectionRepository.getRarityBreakdownByUserIdSince(eq(1L), any(LocalDateTime.class)))
                    .thenReturn(rarityBreakdown);
            when(userNftCollectionRepository.countDistinctUsersSince(any(LocalDateTime.class))).thenReturn(50L);

            // When
            LeaderboardDto.LeaderboardResponse result = leaderboardService.getWeeklyLeaderboard(10);

            // Then
            assertThat(result.getType()).isEqualTo("WEEKLY");
            assertThat(result.getEntries()).hasSize(1);
            assertThat(result.getTotalParticipants()).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("getMonthlyLeaderboard 테스트")
    class GetMonthlyLeaderboardTest {

        @Test
        @DisplayName("성공 - 월간 리더보드 조회")
        void getMonthlyLeaderboard_Success() {
            // Given
            List<Object[]> topCollectors = new ArrayList<>();
            topCollectors.add(new Object[]{1L, "monthly_user1", "http://profile.jpg", 50L});
            topCollectors.add(new Object[]{2L, "monthly_user2", null, 40L});

            UserPoint userPoint = new UserPoint();
            userPoint.setTotalPoints(500L);

            when(userNftCollectionRepository.findTopCollectorsByNftCountSince(any(LocalDateTime.class), eq(10)))
                    .thenReturn(topCollectors);
            when(userPointRepository.findByUserId(anyLong())).thenReturn(Optional.of(userPoint));
            when(userNftCollectionRepository.getRarityBreakdownByUserIdSince(anyLong(), any(LocalDateTime.class)))
                    .thenReturn(List.of());
            when(userNftCollectionRepository.countDistinctUsersSince(any(LocalDateTime.class))).thenReturn(200L);

            // When
            LeaderboardDto.LeaderboardResponse result = leaderboardService.getMonthlyLeaderboard(10);

            // Then
            assertThat(result.getType()).isEqualTo("MONTHLY");
            assertThat(result.getEntries()).hasSize(2);
            assertThat(result.getTotalParticipants()).isEqualTo(200);
        }
    }

    @Nested
    @DisplayName("getUserRank 테스트")
    class GetUserRankTest {

        @Test
        @DisplayName("성공 - 사용자 랭킹 조회")
        void getUserRank_Success() {
            // Given
            UserPoint userPoint = new UserPoint();
            userPoint.setTotalPoints(500L);

            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(50);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(userPoint));
            when(userNftCollectionRepository.getUserRank(1L)).thenReturn(5L);
            when(userNftCollectionRepository.getUserRankSince(eq(1L), any(LocalDateTime.class)))
                    .thenReturn(3L, 4L);
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(100L);

            // When
            LeaderboardDto.UserRankResponse result = leaderboardService.getUserRank(1L);

            // Then
            assertThat(result.getUserId()).isEqualTo(1L);
            assertThat(result.getGlobalRank()).isEqualTo(5);
            assertThat(result.getWeeklyRank()).isEqualTo(3);
            assertThat(result.getMonthlyRank()).isEqualTo(4);
            assertThat(result.getNftCount()).isEqualTo(50);
            assertThat(result.getTotalPoints()).isEqualTo(500);
            assertThat(result.getPercentile()).isBetween(1, 100);
        }

        @Test
        @DisplayName("성공 - 포인트 없는 사용자")
        void getUserRank_NoPoints() {
            // Given
            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(10);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(userNftCollectionRepository.getUserRank(1L)).thenReturn(50L);
            when(userNftCollectionRepository.getUserRankSince(eq(1L), any(LocalDateTime.class)))
                    .thenReturn(30L, 40L);
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(100L);

            // When
            LeaderboardDto.UserRankResponse result = leaderboardService.getUserRank(1L);

            // Then
            assertThat(result.getTotalPoints()).isEqualTo(0);
        }

        @Test
        @DisplayName("성공 - 랭킹이 null인 경우 0 반환")
        void getUserRank_NullRank() {
            // Given
            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(0);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(userNftCollectionRepository.getUserRank(1L)).thenReturn(null);
            when(userNftCollectionRepository.getUserRankSince(eq(1L), any(LocalDateTime.class)))
                    .thenReturn(null);
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(100L);

            // When
            LeaderboardDto.UserRankResponse result = leaderboardService.getUserRank(1L);

            // Then
            assertThat(result.getGlobalRank()).isEqualTo(0);
            assertThat(result.getWeeklyRank()).isEqualTo(0);
            assertThat(result.getMonthlyRank()).isEqualTo(0);
        }

        @Test
        @DisplayName("성공 - 퍼센타일 경계값 (1등)")
        void getUserRank_TopPercentile() {
            // Given
            UserPoint userPoint = new UserPoint();
            userPoint.setTotalPoints(10000L);

            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(500);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(userPoint));
            when(userNftCollectionRepository.getUserRank(1L)).thenReturn(1L);
            when(userNftCollectionRepository.getUserRankSince(eq(1L), any(LocalDateTime.class)))
                    .thenReturn(1L, 1L);
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(1000L);

            // When
            LeaderboardDto.UserRankResponse result = leaderboardService.getUserRank(1L);

            // Then
            assertThat(result.getPercentile()).isEqualTo(100); // 상위 1등
        }

        @Test
        @DisplayName("성공 - 참가자 0명인 경우")
        void getUserRank_NoParticipants() {
            // Given
            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(0);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(userNftCollectionRepository.getUserRank(1L)).thenReturn(null);
            when(userNftCollectionRepository.getUserRankSince(eq(1L), any(LocalDateTime.class)))
                    .thenReturn(null);
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(0L);

            // When
            LeaderboardDto.UserRankResponse result = leaderboardService.getUserRank(1L);

            // Then
            assertThat(result.getPercentile()).isEqualTo(100); // 기본값
        }
    }

    @Nested
    @DisplayName("희귀도 분류 테스트")
    class RarityBreakdownTest {

        @Test
        @DisplayName("성공 - 희귀도별 NFT 수 확인")
        void rarityBreakdown_Success() {
            // Given
            List<Object[]> topCollectors = new ArrayList<>();
            topCollectors.add(new Object[]{1L, "collector", "http://profile.jpg", 100L});

            UserPoint userPoint = new UserPoint();
            userPoint.setTotalPoints(1000L);

            List<Object[]> rarityBreakdown = new ArrayList<>();
            rarityBreakdown.add(new Object[]{"LEGENDARY", 5L});
            rarityBreakdown.add(new Object[]{"EPIC", 15L});
            rarityBreakdown.add(new Object[]{"RARE", 30L});
            rarityBreakdown.add(new Object[]{"COMMON", 50L});

            when(userNftCollectionRepository.findTopCollectorsByNftCount(10)).thenReturn(topCollectors);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(userPoint));
            when(userNftCollectionRepository.getRarityBreakdownByUserId(1L)).thenReturn(rarityBreakdown);
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(100L);

            // When
            LeaderboardDto.LeaderboardResponse result = leaderboardService.getGlobalLeaderboard(10);

            // Then
            LeaderboardDto.LeaderboardEntry entry = result.getEntries().get(0);
            assertThat(entry.getLegendaryCount()).isEqualTo(5);
            assertThat(entry.getEpicCount()).isEqualTo(15);
            assertThat(entry.getRareCount()).isEqualTo(30);
            assertThat(entry.getCommonCount()).isEqualTo(50);
        }

        @Test
        @DisplayName("성공 - 희귀도 정보 없음")
        void rarityBreakdown_Empty() {
            // Given
            List<Object[]> topCollectors = new ArrayList<>();
            topCollectors.add(new Object[]{1L, "newbie", null, 1L});

            when(userNftCollectionRepository.findTopCollectorsByNftCount(10)).thenReturn(topCollectors);
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(userNftCollectionRepository.getRarityBreakdownByUserId(1L)).thenReturn(List.of());
            when(userNftCollectionRepository.countDistinctUsers()).thenReturn(1L);

            // When
            LeaderboardDto.LeaderboardResponse result = leaderboardService.getGlobalLeaderboard(10);

            // Then
            LeaderboardDto.LeaderboardEntry entry = result.getEntries().get(0);
            assertThat(entry.getLegendaryCount()).isEqualTo(0);
            assertThat(entry.getEpicCount()).isEqualTo(0);
            assertThat(entry.getRareCount()).isEqualTo(0);
            assertThat(entry.getCommonCount()).isEqualTo(0);
        }
    }
}
