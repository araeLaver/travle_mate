package com.travelmate.service.nft;

import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.AuctionBidRepository;
import com.travelmate.repository.nft.NftAuctionRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuctionService 테스트")
class AuctionServiceTest {

    @Mock private NftAuctionRepository auctionRepository;
    @Mock private AuctionBidRepository bidRepository;
    @Mock private UserNftCollectionRepository nftCollectionRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private AuctionService auctionService;

    private User seller;
    private User bidder;
    private UserNftCollection nft;

    @BeforeEach
    void setUp() {
        seller = new User();
        setId(seller, 1L);

        bidder = new User();
        setId(bidder, 2L);

        nft = UserNftCollection.builder().user(seller).build();
        setNftId(nft, 10L);
    }

    // --- createAuction ---

    @Nested
    @DisplayName("createAuction")
    class CreateAuction {

        @Test
        @DisplayName("정상 생성")
        void success() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
            when(nftCollectionRepository.findById(10L)).thenReturn(Optional.of(nft));
            when(auctionRepository.existsByNftCollectionIdAndStatus(10L, NftAuction.AuctionStatus.ACTIVE)).thenReturn(false);
            when(auctionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            NftAuction result = auctionService.createAuction(1L, 10L, 1000L, 5000L, 24);

            assertThat(result.getStartingPrice()).isEqualTo(1000L);
            assertThat(result.getCurrentPrice()).isEqualTo(1000L);
            assertThat(result.getBuyNowPrice()).isEqualTo(5000L);
            verify(auctionRepository).save(any());
        }

        @Test
        @DisplayName("본인 소유가 아닌 NFT 경매 등록 시 실패")
        void failNotOwner() {
            User otherUser = new User();
            setId(otherUser, 99L);
            nft = UserNftCollection.builder().user(otherUser).build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
            when(nftCollectionRepository.findById(10L)).thenReturn(Optional.of(nft));

            assertThatThrownBy(() -> auctionService.createAuction(1L, 10L, 1000L, 5000L, 24))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("본인 소유")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }

        @Test
        @DisplayName("이미 경매 중인 NFT 등록 시 실패")
        void failAlreadyActive() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
            when(nftCollectionRepository.findById(10L)).thenReturn(Optional.of(nft));
            when(auctionRepository.existsByNftCollectionIdAndStatus(10L, NftAuction.AuctionStatus.ACTIVE)).thenReturn(true);

            assertThatThrownBy(() -> auctionService.createAuction(1L, 10L, 1000L, 5000L, 24))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 경매 중")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("존재하지 않는 사용자 실패")
        void failUserNotFound() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> auctionService.createAuction(1L, 10L, 1000L, 5000L, 24))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }

        @Test
        @DisplayName("존재하지 않는 NFT 실패")
        void failNftNotFound() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
            when(nftCollectionRepository.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> auctionService.createAuction(1L, 10L, 1000L, 5000L, 24))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }
    }

    // --- placeBid ---

    @Nested
    @DisplayName("placeBid")
    class PlaceBid {

        private NftAuction activeAuction;

        @BeforeEach
        void setUp() {
            activeAuction = NftAuction.builder()
                    .seller(seller)
                    .nftCollection(nft)
                    .startingPrice(1000L)
                    .currentPrice(1000L)
                    .buyNowPrice(5000L)
                    .startAt(LocalDateTime.now().minusHours(1))
                    .endAt(LocalDateTime.now().plusHours(23))
                    .build();
            setAuctionId(activeAuction, 100L);
        }

        @Test
        @DisplayName("정상 입찰")
        void success() {
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(activeAuction));
            when(userRepository.findById(2L)).thenReturn(Optional.of(bidder));
            when(bidRepository.findTopByAuctionIdOrderByBidAmountDesc(100L)).thenReturn(Optional.empty());
            when(bidRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(auctionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            AuctionBid result = auctionService.placeBid(100L, 2L, 1200L);

            assertThat(result.getBidAmount()).isEqualTo(1200L);
            assertThat(result.getIsWinning()).isTrue();
            assertThat(activeAuction.getCurrentPrice()).isEqualTo(1200L);
            assertThat(activeAuction.getBidCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("본인 경매 입찰 실패")
        void failSelfBid() {
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(activeAuction));

            assertThatThrownBy(() -> auctionService.placeBid(100L, 1L, 1200L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("본인 경매")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }

        @Test
        @DisplayName("현재가 이하 입찰 실패")
        void failLowBid() {
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(activeAuction));

            assertThatThrownBy(() -> auctionService.placeBid(100L, 2L, 900L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("현재가")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("최소 입찰 단위 미달 실패")
        void failMinIncrement() {
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(activeAuction));

            assertThatThrownBy(() -> auctionService.placeBid(100L, 2L, 1050L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("최소 입찰 단위")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("종료된 경매 입찰 실패")
        void failEndedAuction() {
            activeAuction = NftAuction.builder()
                    .seller(seller)
                    .startAt(LocalDateTime.now().minusHours(25))
                    .endAt(LocalDateTime.now().minusHours(1))
                    .currentPrice(1000L)
                    .build();
            setAuctionId(activeAuction, 100L);
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(activeAuction));

            assertThatThrownBy(() -> auctionService.placeBid(100L, 2L, 1200L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("종료된")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("이전 최고 입찰자 비활성화")
        void deactivatesPreviousBid() {
            AuctionBid prevBid = AuctionBid.builder().isWinning(true).build();
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(activeAuction));
            when(userRepository.findById(2L)).thenReturn(Optional.of(bidder));
            when(bidRepository.findTopByAuctionIdOrderByBidAmountDesc(100L)).thenReturn(Optional.of(prevBid));
            when(bidRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(auctionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            auctionService.placeBid(100L, 2L, 1200L);

            assertThat(prevBid.getIsWinning()).isFalse();
            verify(bidRepository, times(2)).save(any());
        }
    }

    // --- cancelAuction ---

    @Nested
    @DisplayName("cancelAuction")
    class CancelAuction {

        @Test
        @DisplayName("입찰 없는 경매 취소 성공")
        void success() {
            NftAuction auction = NftAuction.builder().seller(seller).build();
            setAuctionId(auction, 100L);
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(auction));
            when(auctionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            auctionService.cancelAuction(100L, 1L);

            assertThat(auction.getStatus()).isEqualTo(NftAuction.AuctionStatus.CANCELLED);
        }

        @Test
        @DisplayName("타인 경매 취소 실패")
        void failNotOwner() {
            NftAuction auction = NftAuction.builder().seller(seller).build();
            setAuctionId(auction, 100L);
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(auction));

            assertThatThrownBy(() -> auctionService.cancelAuction(100L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("본인 경매만")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }

        @Test
        @DisplayName("입찰 있는 경매 취소 실패")
        void failHasBids() {
            NftAuction auction = NftAuction.builder().seller(seller).build();
            auction.setBidCount(3);
            setAuctionId(auction, 100L);
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(auction));

            assertThatThrownBy(() -> auctionService.cancelAuction(100L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("입찰이 있는")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }
    }

    // --- settleAuction ---

    @Nested
    @DisplayName("settleAuction")
    class SettleAuction {

        @Test
        @DisplayName("낙찰 성공 — NFT 소유권 이전")
        void successSold() {
            NftAuction auction = NftAuction.builder()
                    .seller(seller)
                    .nftCollection(nft)
                    .currentPrice(3000L)
                    .build();
            auction.setHighestBidder(bidder);
            setAuctionId(auction, 100L);
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(auction));
            when(nftCollectionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(auctionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            auctionService.settleAuction(100L);

            assertThat(auction.getStatus()).isEqualTo(NftAuction.AuctionStatus.SOLD);
            assertThat(nft.getUser()).isEqualTo(bidder);
        }

        @Test
        @DisplayName("입찰자 없으면 유찰")
        void noBids() {
            NftAuction auction = NftAuction.builder().seller(seller).nftCollection(nft).build();
            setAuctionId(auction, 100L);
            when(auctionRepository.findById(100L)).thenReturn(Optional.of(auction));
            when(auctionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            auctionService.settleAuction(100L);

            assertThat(auction.getStatus()).isEqualTo(NftAuction.AuctionStatus.NO_BIDS);
        }
    }

    // --- settleExpiredAuctions ---

    @Test
    @DisplayName("만료 경매 일괄 정산")
    void settleExpiredAuctions() {
        NftAuction a1 = NftAuction.builder().seller(seller).nftCollection(nft).build();
        setAuctionId(a1, 1L);
        when(auctionRepository.findExpiredAuctions(any())).thenReturn(List.of(a1));
        when(auctionRepository.findById(1L)).thenReturn(Optional.of(a1));
        when(auctionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        auctionService.settleExpiredAuctions();

        verify(auctionRepository).save(a1);
    }

    // --- Reflection helpers for ID fields ---
    private void setId(User user, Long id) {
        try {
            var f = User.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(user, id);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    private void setNftId(UserNftCollection nft, Long id) {
        try {
            var f = UserNftCollection.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(nft, id);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    private void setAuctionId(NftAuction auction, Long id) {
        try {
            var f = NftAuction.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(auction, id);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
