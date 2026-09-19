package com.travelmate.service.nft;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.PointTransactionRepository;
import com.travelmate.repository.nft.UserPointRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PointService 테스트")
class PointServiceTest {

    @Mock
    private UserPointRepository userPointRepository;

    @Mock
    private PointTransactionRepository pointTransactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PointService pointService;

    private User testUser;
    private UserPoint testUserPoint;
    private PointTransaction testTransaction;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("testuser");
        testUser.setTotalNftsCollected(10);

        testUserPoint = UserPoint.builder()
                .id(1L)
                .user(testUser)
                .totalPoints(1000L)
                .lifetimeEarned(5000L)
                .lifetimeSpent(4000L)
                .seasonPoints(500L)
                .currentRank(100)
                .build();

        testTransaction = PointTransaction.builder()
                .id(1L)
                .user(testUser)
                .type(PointTransactionType.EARN)
                .amount(100L)
                .balanceAfter(1100L)
                .source(PointSource.NFT_COLLECT)
                .description("NFT 수집 보상")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("getBalance 테스트")
    class GetBalanceTest {

        @Test
        @DisplayName("성공 - 포인트 잔액 조회")
        void getBalance_Success() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));

            // When
            NftDto.PointBalanceResponse result = pointService.getBalance(1L);

            // Then
            assertThat(result.getTotalPoints()).isEqualTo(1000L);
            assertThat(result.getLifetimeEarned()).isEqualTo(5000L);
            assertThat(result.getLifetimeSpent()).isEqualTo(4000L);
            assertThat(result.getSeasonPoints()).isEqualTo(500L);
            assertThat(result.getCurrentRank()).isEqualTo(100);
        }

        @Test
        @DisplayName("성공 - 새 사용자 포인트 생성")
        void getBalance_NewUser() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            UserPoint newUserPoint = UserPoint.builder()
                    .user(testUser)
                    .totalPoints(0L)
                    .lifetimeEarned(0L)
                    .lifetimeSpent(0L)
                    .seasonPoints(0L)
                    .build();
            when(userPointRepository.findOrCreateByUserId(1L, testUser)).thenReturn(newUserPoint);

            // When
            NftDto.PointBalanceResponse result = pointService.getBalance(1L);

            // Then
            assertThat(result.getTotalPoints()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("earnPoints 테스트")
    class EarnPointsTest {

        @Test
        @DisplayName("성공 - 포인트 획득")
        void earnPoints_Success() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(pointTransactionRepository.save(any(PointTransaction.class))).thenReturn(testTransaction);
            when(pointTransactionRepository.existsByUserIdAndReferenceIdAndReferenceType(anyLong(), anyLong(), anyString()))
                    .thenReturn(false);

            // When
            NftDto.PointTransactionResponse result = pointService.earnPoints(
                    1L, 100L, PointSource.NFT_COLLECT, "NFT 수집", 1L, "NFT_COLLECTION");

            // Then
            assertThat(result.getType()).isEqualTo(PointTransactionType.EARN);
            assertThat(result.getAmount()).isEqualTo(100L);

            verify(userPointRepository).save(any(UserPoint.class));
            verify(pointTransactionRepository).save(any(PointTransaction.class));
        }

        @Test
        @DisplayName("실패 - 음수 포인트")
        void earnPoints_NegativeAmount() {
            // When & Then
            assertThatThrownBy(() -> pointService.earnPoints(
                    1L, -100L, PointSource.NFT_COLLECT, "테스트", null, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("양수")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 0 포인트")
        void earnPoints_ZeroAmount() {
            // When & Then
            assertThatThrownBy(() -> pointService.earnPoints(
                    1L, 0L, PointSource.NFT_COLLECT, "테스트", null, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("양수")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 중복 지급")
        void earnPoints_DuplicateReward() {
            // Given
            when(pointTransactionRepository.existsByUserIdAndReferenceIdAndReferenceType(1L, 1L, "NFT_COLLECTION"))
                    .thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> pointService.earnPoints(
                    1L, 100L, PointSource.NFT_COLLECT, "NFT 수집", 1L, "NFT_COLLECTION"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 포인트가 지급")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }
    }

    @Nested
    @DisplayName("spendPoints 테스트")
    class SpendPointsTest {

        @Test
        @DisplayName("성공 - 포인트 사용")
        void spendPoints_Success() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            PointTransaction spendTransaction = PointTransaction.builder()
                    .id(2L)
                    .user(testUser)
                    .type(PointTransactionType.SPEND)
                    .amount(500L)
                    .balanceAfter(500L)
                    .source(PointSource.MARKETPLACE_PURCHASE)
                    .build();
            when(pointTransactionRepository.save(any(PointTransaction.class))).thenReturn(spendTransaction);

            // When
            NftDto.PointTransactionResponse result = pointService.spendPoints(
                    1L, 500L, PointSource.MARKETPLACE_PURCHASE, "아이템 구매", 1L, "MARKETPLACE");

            // Then
            assertThat(result.getType()).isEqualTo(PointTransactionType.SPEND);
            assertThat(result.getAmount()).isEqualTo(500L);

            verify(userPointRepository).save(any(UserPoint.class));
        }

        @Test
        @DisplayName("실패 - 잔액 부족")
        void spendPoints_InsufficientBalance() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));

            // When & Then
            assertThatThrownBy(() -> pointService.spendPoints(
                    1L, 2000L, PointSource.MARKETPLACE_PURCHASE, "아이템 구매", null, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("포인트가 부족")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 음수 포인트")
        void spendPoints_NegativeAmount() {
            // When & Then
            assertThatThrownBy(() -> pointService.spendPoints(
                    1L, -100L, PointSource.MARKETPLACE_PURCHASE, "테스트", null, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("양수")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }
    }

    @Nested
    @DisplayName("transferPoints 테스트")
    class TransferPointsTest {

        @Test
        @DisplayName("성공 - 포인트 전송")
        void transferPoints_Success() {
            // Given
            User receiver = new User();
            receiver.setId(2L);
            receiver.setNickname("receiver");

            UserPoint receiverPoint = UserPoint.builder()
                    .id(2L)
                    .user(receiver)
                    .totalPoints(500L)
                    .build();

            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));
            when(userPointRepository.findByUserId(2L)).thenReturn(Optional.of(receiverPoint));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));

            // When
            pointService.transferPoints(1L, 2L, 500L, "선물");

            // Then
            verify(userPointRepository, times(2)).save(any(UserPoint.class));
            verify(pointTransactionRepository, times(2)).save(any(PointTransaction.class));
        }

        @Test
        @DisplayName("실패 - 자기 자신에게 전송")
        void transferPoints_SameUser() {
            // When & Then
            assertThatThrownBy(() -> pointService.transferPoints(1L, 1L, 100L, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("자신에게")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 음수 포인트 전송")
        void transferPoints_NegativeAmount() {
            // When & Then
            assertThatThrownBy(() -> pointService.transferPoints(1L, 2L, -100L, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("양수")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 잔액 부족")
        void transferPoints_InsufficientBalance() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));

            // When & Then
            assertThatThrownBy(() -> pointService.transferPoints(1L, 2L, 5000L, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("포인트가 부족")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }
    }

    @Nested
    @DisplayName("getTransactions 테스트")
    class GetTransactionsTest {

        @Test
        @DisplayName("성공 - 거래 내역 조회")
        void getTransactions_Success() {
            // Given
            List<PointTransaction> transactions = List.of(testTransaction);
            Page<PointTransaction> transactionPage = new PageImpl<>(transactions, PageRequest.of(0, 10), 1);

            when(pointTransactionRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any()))
                    .thenReturn(transactionPage);

            // When
            Page<NftDto.PointTransactionResponse> result = pointService.getTransactions(1L, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getType()).isEqualTo(PointTransactionType.EARN);
        }

        @Test
        @DisplayName("성공 - 빈 거래 내역")
        void getTransactions_Empty() {
            // Given
            Page<PointTransaction> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);

            when(pointTransactionRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any()))
                    .thenReturn(emptyPage);

            // When
            Page<NftDto.PointTransactionResponse> result = pointService.getTransactions(1L, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getTransactionsByType 테스트")
    class GetTransactionsByTypeTest {

        @Test
        @DisplayName("성공 - 타입별 거래 내역 조회")
        void getTransactionsByType_Success() {
            // Given
            List<PointTransaction> transactions = List.of(testTransaction);
            Page<PointTransaction> transactionPage = new PageImpl<>(transactions, PageRequest.of(0, 10), 1);

            when(pointTransactionRepository.findByUserIdAndTypeOrderByCreatedAtDesc(
                    eq(1L), eq(PointTransactionType.EARN), any()))
                    .thenReturn(transactionPage);

            // When
            Page<NftDto.PointTransactionResponse> result = pointService.getTransactionsByType(
                    1L, PointTransactionType.EARN, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getType()).isEqualTo(PointTransactionType.EARN);
        }
    }

    @Nested
    @DisplayName("getLeaderboard 테스트")
    class GetLeaderboardTest {

        @Test
        @DisplayName("성공 - 리더보드 조회")
        void getLeaderboard_Success() {
            // Given
            List<UserPoint> topUsers = List.of(testUserPoint);
            when(userPointRepository.findTopByTotalPoints(any())).thenReturn(topUsers);
            when(userPointRepository.getUserRank(1L)).thenReturn(1);

            // When
            List<NftDto.LeaderboardEntry> result = pointService.getLeaderboard(10);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getRank()).isEqualTo(1);
            assertThat(result.get(0).getTotalPoints()).isEqualTo(1000L);
            assertThat(result.get(0).getNickname()).isEqualTo("testuser");
        }

        @Test
        @DisplayName("성공 - 빈 리더보드")
        void getLeaderboard_Empty() {
            // Given
            when(userPointRepository.findTopByTotalPoints(any())).thenReturn(List.of());

            // When
            List<NftDto.LeaderboardEntry> result = pointService.getLeaderboard(10);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getSeasonLeaderboard 테스트")
    class GetSeasonLeaderboardTest {

        @Test
        @DisplayName("성공 - 시즌 리더보드 조회")
        void getSeasonLeaderboard_Success() {
            // Given
            List<UserPoint> topUsers = List.of(testUserPoint);
            when(userPointRepository.findTopBySeasonPoints(any())).thenReturn(topUsers);

            // When
            List<NftDto.LeaderboardEntry> result = pointService.getSeasonLeaderboard(10);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getRank()).isEqualTo(1);
            assertThat(result.get(0).getTotalPoints()).isEqualTo(500L); // seasonPoints
        }
    }

    @Nested
    @DisplayName("getUserRank 테스트")
    class GetUserRankTest {

        @Test
        @DisplayName("성공 - 사용자 랭킹 조회")
        void getUserRank_Success() {
            // Given
            when(userPointRepository.getUserRank(1L)).thenReturn(50);

            // When
            int result = pointService.getUserRank(1L);

            // Then
            assertThat(result).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("getPointStats 테스트")
    class GetPointStatsTest {

        @Test
        @DisplayName("성공 - 포인트 통계 조회")
        void getPointStats_Success() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));
            when(userPointRepository.getUserRank(1L)).thenReturn(100);

            // When
            NftDto.PointBalanceResponse result = pointService.getPointStats(1L);

            // Then
            assertThat(result.getTotalPoints()).isEqualTo(1000L);
            assertThat(result.getCurrentRank()).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("hasEnoughPoints 테스트")
    class HasEnoughPointsTest {

        @Test
        @DisplayName("성공 - 충분한 포인트")
        void hasEnoughPoints_True() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));

            // When
            boolean result = pointService.hasEnoughPoints(1L, 500L);

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("실패 - 포인트 부족")
        void hasEnoughPoints_False() {
            // Given
            when(userPointRepository.findByUserId(1L)).thenReturn(Optional.of(testUserPoint));

            // When
            boolean result = pointService.hasEnoughPoints(1L, 2000L);

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("실패 - 포인트 정보 없음")
        void hasEnoughPoints_NoUserPoint() {
            // Given
            when(userPointRepository.findByUserId(999L)).thenReturn(Optional.empty());

            // When
            boolean result = pointService.hasEnoughPoints(999L, 100L);

            // Then
            assertThat(result).isFalse();
        }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
