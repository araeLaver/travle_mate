package com.travelmate.service.nft;

import com.travelmate.dto.NftDto;
import com.travelmate.dto.NftDto.*;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.NftMarketplaceListingRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import com.travelmate.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MarketplaceService 테스트")
class MarketplaceServiceTest {

    @Mock
    private NftMarketplaceListingRepository marketplaceListingRepository;

    @Mock
    private UserNftCollectionRepository userNftCollectionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PointService pointService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private MarketplaceService marketplaceService;

    private User seller;
    private User buyer;
    private CollectibleLocation testLocation;
    private UserNftCollection testNftCollection;
    private NftMarketplaceListing testListing;

    @BeforeEach
    void setUp() {
        seller = new User();
        seller.setId(1L);
        seller.setEmail("seller@example.com");
        seller.setNickname("Seller");
        seller.setProfileImageUrl("https://example.com/seller.jpg");
        seller.setTotalNftsCollected(10);

        buyer = new User();
        buyer.setId(2L);
        buyer.setEmail("buyer@example.com");
        buyer.setNickname("Buyer");
        buyer.setProfileImageUrl("https://example.com/buyer.jpg");
        buyer.setTotalNftsCollected(5);

        testLocation = new CollectibleLocation();
        testLocation.setId(1L);
        testLocation.setName("Seoul Tower");
        testLocation.setDescription("Famous tower in Seoul");
        testLocation.setImageUrl("https://example.com/image.jpg");
        testLocation.setNftImageUrl("https://example.com/nft.jpg");
        testLocation.setRarity(Rarity.RARE);
        testLocation.setCategory(LocationCategory.LANDMARK);
        testLocation.setCity("Seoul");
        testLocation.setCountry("South Korea");

        testNftCollection = UserNftCollection.builder()
                .id(1L)
                .user(seller)
                .location(testLocation)
                .tokenId("TOKEN123")
                .mintStatus(MintStatus.MINTED)
                .collectedAt(LocalDateTime.now().minusDays(10))
                .earnedPoints(100)
                .isVerified(true)
                .build();

        testListing = NftMarketplaceListing.builder()
                .id(1L)
                .seller(seller)
                .nftCollection(testNftCollection)
                .priceInPoints(500L)
                .status(ListingStatus.ACTIVE)
                .listedAt(LocalDateTime.now().minusHours(1))
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
    }

    @Nested
    @DisplayName("리스팅 조회 테스트")
    class GetListingsTest {

        @Test
        @DisplayName("성공 - 활성 리스팅 조회")
        void getActiveListings_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<NftMarketplaceListing> listingPage = new PageImpl<>(List.of(testListing));

            when(marketplaceListingRepository.findActiveListings(pageable)).thenReturn(listingPage);

            // When
            Page<MarketplaceListingResponse> result = marketplaceService.getActiveListings(pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getId()).isEqualTo(1L);
            assertThat(result.getContent().get(0).getPriceInPoints()).isEqualTo(500L);
        }

        @Test
        @DisplayName("성공 - 가격 범위로 리스팅 조회")
        void getListingsByPriceRange_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<NftMarketplaceListing> listingPage = new PageImpl<>(List.of(testListing));

            when(marketplaceListingRepository.findByPriceRange(100L, 1000L, pageable)).thenReturn(listingPage);

            // When
            Page<MarketplaceListingResponse> result = marketplaceService.getListingsByPriceRange(100L, 1000L, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("성공 - 희귀도별 리스팅 조회")
        void getListingsByRarity_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<NftMarketplaceListing> listingPage = new PageImpl<>(List.of(testListing));

            when(marketplaceListingRepository.findByRarity(Rarity.RARE, pageable)).thenReturn(listingPage);

            // When
            Page<MarketplaceListingResponse> result = marketplaceService.getListingsByRarity(Rarity.RARE, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getNftCollection().getLocation().getRarity()).isEqualTo(Rarity.RARE);
        }
    }

    @Nested
    @DisplayName("판매 등록 테스트")
    class CreateListingTest {

        @Test
        @DisplayName("성공 - NFT 판매 등록")
        void createListing_Success() {
            // Given
            CreateListingRequest request = new CreateListingRequest();
            request.setNftCollectionId(1L);
            request.setPriceInPoints(500L);
            request.setDurationDays(7);

            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(testNftCollection));
            when(marketplaceListingRepository.isNftListed(1L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
            when(marketplaceListingRepository.save(any(NftMarketplaceListing.class))).thenAnswer(invocation -> {
                NftMarketplaceListing saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });

            // When
            MarketplaceListingResponse result = marketplaceService.createListing(1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getPriceInPoints()).isEqualTo(500L);
            assertThat(result.getStatus()).isEqualTo(ListingStatus.ACTIVE);
            verify(marketplaceListingRepository).save(any(NftMarketplaceListing.class));
        }

        @Test
        @DisplayName("성공 - 기간 null일 때 기본값 사용")
        void createListing_DefaultDuration() {
            // Given
            CreateListingRequest request = new CreateListingRequest();
            request.setNftCollectionId(1L);
            request.setPriceInPoints(500L);
            request.setDurationDays(null);

            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(testNftCollection));
            when(marketplaceListingRepository.isNftListed(1L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
            when(marketplaceListingRepository.save(any(NftMarketplaceListing.class))).thenAnswer(invocation -> {
                NftMarketplaceListing saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });

            // When
            MarketplaceListingResponse result = marketplaceService.createListing(1L, request);

            // Then
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("성공 - 최대 기간 제한")
        void createListing_MaxDurationLimit() {
            // Given
            CreateListingRequest request = new CreateListingRequest();
            request.setNftCollectionId(1L);
            request.setPriceInPoints(500L);
            request.setDurationDays(60); // 최대 30일 초과

            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(testNftCollection));
            when(marketplaceListingRepository.isNftListed(1L)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
            when(marketplaceListingRepository.save(any(NftMarketplaceListing.class))).thenAnswer(invocation -> {
                NftMarketplaceListing saved = invocation.getArgument(0);
                saved.setId(1L);
                // 30일 제한이 적용되어야 함
                assertThat(saved.getExpiresAt()).isBeforeOrEqualTo(LocalDateTime.now().plusDays(31));
                return saved;
            });

            // When
            MarketplaceListingResponse result = marketplaceService.createListing(1L, request);

            // Then
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("실패 - NFT 없음")
        void createListing_NftNotFound() {
            // Given
            CreateListingRequest request = new CreateListingRequest();
            request.setNftCollectionId(999L);
            request.setPriceInPoints(500L);

            when(userNftCollectionRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> marketplaceService.createListing(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("요청한 리소스를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 소유자가 아님")
        void createListing_NotOwner() {
            // Given
            CreateListingRequest request = new CreateListingRequest();
            request.setNftCollectionId(1L);
            request.setPriceInPoints(500L);

            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(testNftCollection));

            // When & Then
            assertThatThrownBy(() -> marketplaceService.createListing(999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("해당 NFT의 소유자가 아닙니다");
        }

        @Test
        @DisplayName("실패 - 이미 판매 중")
        void createListing_AlreadyListed() {
            // Given
            CreateListingRequest request = new CreateListingRequest();
            request.setNftCollectionId(1L);
            request.setPriceInPoints(500L);

            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(testNftCollection));
            when(marketplaceListingRepository.isNftListed(1L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> marketplaceService.createListing(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("이미 판매 중인 NFT입니다")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }
    }

    @Nested
    @DisplayName("NFT 구매 테스트")
    class BuyNftTest {

        @Test
        @DisplayName("성공 - NFT 구매")
        void buyNft_Success() {
            // Given
            PointBalanceResponse balanceResponse = PointBalanceResponse.builder()
                    .totalPoints(1000L)
                    .build();

            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
            when(userRepository.findById(2L)).thenReturn(Optional.of(buyer));
            when(pointService.hasEnoughPoints(2L, 500L)).thenReturn(true);
            when(userNftCollectionRepository.save(any(UserNftCollection.class))).thenReturn(testNftCollection);
            when(marketplaceListingRepository.save(any(NftMarketplaceListing.class))).thenReturn(testListing);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(pointService.getBalance(2L)).thenReturn(balanceResponse);

            // When
            BuyNftResponse result = marketplaceService.buyNft(2L, 1L);

            // Then
            assertThat(result.getSuccess()).isTrue();
            assertThat(result.getPointsSpent()).isEqualTo(500L);
            verify(pointService).spendPoints(eq(2L), eq(500L), eq(PointSource.MARKETPLACE_PURCHASE), anyString(), anyLong(), anyString());
            verify(pointService).earnPoints(eq(1L), eq(500L), eq(PointSource.MARKETPLACE_SALE), anyString(), anyLong(), anyString());
            verify(notificationService).notifyMarketplaceSold(eq(1L), eq(1L), eq("Seoul Tower"), eq(500));
            verify(notificationService).notifyMarketplacePurchased(eq(2L), eq(1L), eq("Seoul Tower"), eq(500));
        }

        @Test
        @DisplayName("실패 - 리스팅 없음")
        void buyNft_ListingNotFound() {
            // Given
            when(marketplaceListingRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> marketplaceService.buyNft(2L, 999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("판매 리스팅을 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "C1002"));
        }

        @Test
        @DisplayName("실패 - 판매 중이 아님")
        void buyNft_NotActive() {
            // Given
            testListing.setStatus(ListingStatus.SOLD);
            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));

            // When & Then
            assertThatThrownBy(() -> marketplaceService.buyNft(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("판매 중인 NFT가 아닙니다")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("실패 - 판매 기간 만료")
        void buyNft_Expired() {
            // Given
            testListing.setExpiresAt(LocalDateTime.now().minusDays(1));
            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
            when(marketplaceListingRepository.save(any(NftMarketplaceListing.class))).thenReturn(testListing);

            // When & Then
            assertThatThrownBy(() -> marketplaceService.buyNft(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("판매 기간이 만료되었습니다")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));

            // 상태가 EXPIRED로 변경되어야 함
            verify(marketplaceListingRepository).save(argThat(listing ->
                    listing.getStatus() == ListingStatus.EXPIRED));
        }

        @Test
        @DisplayName("실패 - 본인 NFT 구매 시도")
        void buyNft_SelfPurchase() {
            // Given
            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));

            // When & Then
            assertThatThrownBy(() -> marketplaceService.buyNft(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("본인의 NFT는 구매할 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }

        @Test
        @DisplayName("실패 - 포인트 부족")
        void buyNft_InsufficientPoints() {
            // Given
            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
            when(userRepository.findById(2L)).thenReturn(Optional.of(buyer));
            when(pointService.hasEnoughPoints(2L, 500L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> marketplaceService.buyNft(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("포인트가 부족합니다")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("성공 - expiresAt이 null인 경우")
        void buyNft_NullExpiresAt() {
            // Given
            testListing.setExpiresAt(null);

            PointBalanceResponse balanceResponse = PointBalanceResponse.builder()
                    .totalPoints(500L)
                    .build();

            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
            when(userRepository.findById(2L)).thenReturn(Optional.of(buyer));
            when(pointService.hasEnoughPoints(2L, 500L)).thenReturn(true);
            when(userNftCollectionRepository.save(any(UserNftCollection.class))).thenReturn(testNftCollection);
            when(marketplaceListingRepository.save(any(NftMarketplaceListing.class))).thenReturn(testListing);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(pointService.getBalance(2L)).thenReturn(balanceResponse);

            // When
            BuyNftResponse result = marketplaceService.buyNft(2L, 1L);

            // Then
            assertThat(result.getSuccess()).isTrue();
        }
    }

    @Nested
    @DisplayName("판매 취소 테스트")
    class CancelListingTest {

        @Test
        @DisplayName("성공 - 판매 취소")
        void cancelListing_Success() {
            // Given
            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
            when(marketplaceListingRepository.save(any(NftMarketplaceListing.class))).thenReturn(testListing);

            // When
            marketplaceService.cancelListing(1L, 1L);

            // Then
            verify(marketplaceListingRepository).save(argThat(listing ->
                    listing.getStatus() == ListingStatus.CANCELLED));
        }

        @Test
        @DisplayName("실패 - 리스팅 없음")
        void cancelListing_NotFound() {
            // Given
            when(marketplaceListingRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> marketplaceService.cancelListing(1L, 999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("판매 리스팅을 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "C1002"));
        }

        @Test
        @DisplayName("실패 - 판매자가 아님")
        void cancelListing_NotSeller() {
            // Given
            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));

            // When & Then
            assertThatThrownBy(() -> marketplaceService.cancelListing(999L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("해당 리스팅의 판매자가 아닙니다")
                    .satisfies(ex -> assertBusinessException(ex, 403, "N5007"));
        }

        @Test
        @DisplayName("실패 - 취소할 수 없는 상태")
        void cancelListing_InvalidStatus() {
            // Given
            testListing.setStatus(ListingStatus.SOLD);
            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));

            // When & Then
            assertThatThrownBy(() -> marketplaceService.cancelListing(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage("취소할 수 없는 상태입니다")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }
    }

    @Nested
    @DisplayName("내 리스팅/구매 내역 조회 테스트")
    class MyListingsTest {

        @Test
        @DisplayName("성공 - 내 판매 리스팅 조회")
        void getMyListings_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<NftMarketplaceListing> listingPage = new PageImpl<>(List.of(testListing));

            when(marketplaceListingRepository.findBySellerIdOrderByListedAtDesc(1L, pageable)).thenReturn(listingPage);

            // When
            Page<MarketplaceListingResponse> result = marketplaceService.getMyListings(1L, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getSeller().getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("성공 - 내 구매 내역 조회")
        void getMyPurchases_Success() {
            // Given
            testListing.setStatus(ListingStatus.SOLD);
            testListing.setBuyer(buyer);
            testListing.setSoldAt(LocalDateTime.now());

            Pageable pageable = PageRequest.of(0, 10);
            Page<NftMarketplaceListing> listingPage = new PageImpl<>(List.of(testListing));

            when(marketplaceListingRepository.findByBuyerIdAndStatusOrderBySoldAtDesc(2L, ListingStatus.SOLD, pageable))
                    .thenReturn(listingPage);

            // When
            Page<MarketplaceListingResponse> result = marketplaceService.getMyPurchases(2L, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("만료 리스팅 처리 테스트")
    class ProcessExpiredListingsTest {

        @Test
        @DisplayName("성공 - 만료된 리스팅 처리")
        void processExpiredListings_Success() {
            // Given
            when(marketplaceListingRepository.updateExpiredListings()).thenReturn(5);

            // When
            int result = marketplaceService.processExpiredListings();

            // Then
            assertThat(result).isEqualTo(5);
            verify(marketplaceListingRepository).updateExpiredListings();
        }

        @Test
        @DisplayName("성공 - 만료된 리스팅 없음")
        void processExpiredListings_NoExpired() {
            // Given
            when(marketplaceListingRepository.updateExpiredListings()).thenReturn(0);

            // When
            int result = marketplaceService.processExpiredListings();

            // Then
            assertThat(result).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Response 변환 테스트")
    class ResponseConversionTest {

        @Test
        @DisplayName("성공 - earnedPoints가 null인 경우 0 반환")
        void toListingResponse_NullEarnedPoints() {
            // Given
            testNftCollection.setEarnedPoints(null);
            Pageable pageable = PageRequest.of(0, 10);
            Page<NftMarketplaceListing> listingPage = new PageImpl<>(List.of(testListing));

            when(marketplaceListingRepository.findActiveListings(pageable)).thenReturn(listingPage);

            // When
            Page<MarketplaceListingResponse> result = marketplaceService.getActiveListings(pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getNftCollection().getEarnedPoints()).isEqualTo(0L);
        }

        @Test
        @DisplayName("성공 - 전체 NFT 정보 포함")
        void toListingResponse_FullNftInfo() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<NftMarketplaceListing> listingPage = new PageImpl<>(List.of(testListing));

            when(marketplaceListingRepository.findActiveListings(pageable)).thenReturn(listingPage);

            // When
            Page<MarketplaceListingResponse> result = marketplaceService.getActiveListings(pageable);

            // Then
            MarketplaceListingResponse response = result.getContent().get(0);
            assertThat(response.getNftCollection().getLocation().getName()).isEqualTo("Seoul Tower");
            assertThat(response.getNftCollection().getLocation().getRarity()).isEqualTo(Rarity.RARE);
            assertThat(response.getNftCollection().getLocation().getCategory()).isEqualTo(LocationCategory.LANDMARK);
            assertThat(response.getNftCollection().getTokenId()).isEqualTo("TOKEN123");
            assertThat(response.getSeller().getNickname()).isEqualTo("Seller");
        }
    }

    @Nested
    @DisplayName("사용자 통계 업데이트 테스트")
    class UserStatsUpdateTest {

        @Test
        @DisplayName("성공 - 구매 시 사용자 NFT 수 업데이트")
        void buyNft_UpdatesUserStats() {
            // Given
            PointBalanceResponse balanceResponse = PointBalanceResponse.builder()
                    .totalPoints(1000L)
                    .build();

            when(marketplaceListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
            when(userRepository.findById(2L)).thenReturn(Optional.of(buyer));
            when(pointService.hasEnoughPoints(2L, 500L)).thenReturn(true);
            when(userNftCollectionRepository.save(any(UserNftCollection.class))).thenReturn(testNftCollection);
            when(marketplaceListingRepository.save(any(NftMarketplaceListing.class))).thenReturn(testListing);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(pointService.getBalance(2L)).thenReturn(balanceResponse);

            // When
            marketplaceService.buyNft(2L, 1L);

            // Then
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository, times(2)).save(userCaptor.capture());

            List<User> savedUsers = userCaptor.getAllValues();
            // 구매자: 5 + 1 = 6
            assertThat(savedUsers.get(0).getTotalNftsCollected()).isEqualTo(6);
            // 판매자: 10 - 1 = 9
            assertThat(savedUsers.get(1).getTotalNftsCollected()).isEqualTo(9);
        }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
