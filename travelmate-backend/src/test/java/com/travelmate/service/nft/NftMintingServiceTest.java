package com.travelmate.service.nft;

import com.travelmate.dto.nft.MintingDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.MintStatus;
import com.travelmate.entity.nft.Rarity;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.nft.UserNftCollectionRepository;
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
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NftMintingService 테스트")
class NftMintingServiceTest {

    @Mock
    private UserNftCollectionRepository userNftCollectionRepository;

    @Mock
    private PolygonBlockchainService blockchainService;

    @InjectMocks
    private NftMintingService nftMintingService;

    private User user;
    private User otherUser;
    private CollectibleLocation location;
    private UserNftCollection collection;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setNickname("테스트유저");
        user.setEmail("test@test.com");
        user.setPassword("password");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setNickname("다른유저");
        otherUser.setEmail("other@test.com");
        otherUser.setPassword("password");

        location = CollectibleLocation.builder()
                .id(1L)
                .name("테스트 장소")
                .description("테스트 장소 설명")
                .rarity(Rarity.COMMON)
                .nftImageUrl("https://example.com/nft.png")
                .nftMetadataUri("ipfs://metadata")
                .build();

        collection = UserNftCollection.builder()
                .id(1L)
                .user(user)
                .location(location)
                .mintStatus(MintStatus.PENDING)
                .walletAddress("0x1234567890abcdef1234567890abcdef12345678")
                .collectedLatitude(37.5665)
                .collectedLongitude(126.9780)
                .collectedAt(LocalDateTime.now())
                .earnedPoints(100)
                .build();
    }

    @Nested
    @DisplayName("민팅 요청 테스트")
    class RequestMintingTest {

        @Test
        @DisplayName("성공 - 민팅 요청")
        void requestMinting_Success() {
            // Given
            String walletAddress = "0xabcdef1234567890abcdef1234567890abcdef12";
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));
            when(userNftCollectionRepository.save(any(UserNftCollection.class))).thenReturn(collection);
            mockSuccessfulMinting();

            // When
            MintingDto.MintingResponse result = nftMintingService.requestMinting(1L, 1L, walletAddress);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getCollectionId()).isEqualTo(1L);
            assertThat(result.getLocationName()).isEqualTo("테스트 장소");
            assertThat(result.getMintStatus()).isEqualTo(MintStatus.MINTING);
            assertThat(result.getMessage()).contains("민팅이 시작되었습니다");
            verify(userNftCollectionRepository).save(any(UserNftCollection.class));
        }

        @Test
        @DisplayName("성공 - 기존 지갑 주소 사용")
        void requestMinting_Success_UseExistingWallet() {
            // Given
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));
            when(userNftCollectionRepository.save(any(UserNftCollection.class))).thenReturn(collection);
            mockSuccessfulMinting();

            // When - 지갑 주소 null로 전달
            MintingDto.MintingResponse result = nftMintingService.requestMinting(1L, 1L, null);

            // Then
            assertThat(result).isNotNull();
            verify(userNftCollectionRepository).save(any(UserNftCollection.class));
        }

        @Test
        @DisplayName("실패 - 컬렉션 없음")
        void requestMinting_Fail_NotFound() {
            // Given
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> nftMintingService.requestMinting(1L, 1L, "0x123"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("NFT 컬렉션을 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }

        @Test
        @DisplayName("실패 - 권한 없음")
        void requestMinting_Fail_NotOwner() {
            // Given
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.requestMinting(2L, 1L, "0x123"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("권한이 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }

        @Test
        @DisplayName("실패 - 이미 민팅됨")
        void requestMinting_Fail_AlreadyMinted() {
            // Given
            collection.setMintStatus(MintStatus.MINTED);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.requestMinting(1L, 1L, "0x123"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 민팅된 NFT입니다")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("실패 - 민팅 진행 중")
        void requestMinting_Fail_AlreadyMinting() {
            // Given
            collection.setMintStatus(MintStatus.MINTING);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.requestMinting(1L, 1L, "0x123"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("민팅이 진행 중입니다")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("실패 - 확인 중")
        void requestMinting_Fail_Confirming() {
            // Given
            collection.setMintStatus(MintStatus.CONFIRMING);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.requestMinting(1L, 1L, "0x123"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("민팅이 진행 중입니다")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("실패 - 지갑 주소 없음")
        void requestMinting_Fail_NoWalletAddress() {
            // Given
            collection.setWalletAddress(null);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.requestMinting(1L, 1L, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("지갑 주소가 필요합니다")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 빈 지갑 주소")
        void requestMinting_Fail_EmptyWalletAddress() {
            // Given
            collection.setWalletAddress("");
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.requestMinting(1L, 1L, ""))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("지갑 주소가 필요합니다")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }
    }

    @Nested
    @DisplayName("비동기 민팅 처리 테스트")
    class MintAsyncTest {

        @Test
        @DisplayName("실패 - 블록체인 서비스가 null future 반환")
        void mintAsync_Fail_NullFuture() {
            // Given
            when(blockchainService.mintNftAsync(eq(1L), anyString(), anyString())).thenReturn(null);

            // When
            nftMintingService.mintAsync(collection);

            // Then
            verify(blockchainService).updateMintStatus(1L, MintStatus.FAILED, null, null);
        }
    }

    @Nested
    @DisplayName("민팅 상태 조회 테스트")
    class GetMintingStatusTest {

        @Test
        @DisplayName("성공 - 상태 조회")
        void getMintingStatus_Success() {
            // Given
            collection.setMintStatus(MintStatus.MINTED);
            collection.setTokenId("12345");
            collection.setTransactionHash("0xabc123");
            collection.setContractAddress("0xcontract");
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When
            MintingDto.MintingStatusResponse result = nftMintingService.getMintingStatus(1L, 1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getCollectionId()).isEqualTo(1L);
            assertThat(result.getLocationName()).isEqualTo("테스트 장소");
            assertThat(result.getMintStatus()).isEqualTo(MintStatus.MINTED);
            assertThat(result.getTokenId()).isEqualTo("12345");
            assertThat(result.getTransactionHash()).isEqualTo("0xabc123");
            assertThat(result.getRarity()).isEqualTo("COMMON");
        }

        @Test
        @DisplayName("실패 - 컬렉션 없음")
        void getMintingStatus_Fail_NotFound() {
            // Given
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> nftMintingService.getMintingStatus(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("NFT 컬렉션을 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }

        @Test
        @DisplayName("실패 - 권한 없음")
        void getMintingStatus_Fail_NotOwner() {
            // Given
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.getMintingStatus(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("권한이 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }
    }

    @Nested
    @DisplayName("민팅 가능 NFT 목록 조회 테스트")
    class GetMintableNftsTest {

        @Test
        @DisplayName("성공 - 목록 조회")
        void getMintableNfts_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            UserNftCollection pendingCollection = UserNftCollection.builder()
                    .id(2L)
                    .user(user)
                    .location(location)
                    .mintStatus(MintStatus.PENDING)
                    .collectedAt(LocalDateTime.now())
                    .earnedPoints(50)
                    .build();

            Page<UserNftCollection> collectionPage = new PageImpl<>(
                    List.of(collection, pendingCollection), pageable, 2);

            when(userNftCollectionRepository.findByUserIdAndMintStatusIn(
                    eq(1L), any(), eq(pageable))).thenReturn(collectionPage);

            // When
            Page<MintingDto.MintableNftResponse> result =
                    nftMintingService.getMintableNfts(1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent().get(0).getLocationName()).isEqualTo("테스트 장소");
        }

        @Test
        @DisplayName("성공 - 빈 목록")
        void getMintableNfts_Empty() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<UserNftCollection> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(userNftCollectionRepository.findByUserIdAndMintStatusIn(
                    eq(1L), any(), eq(pageable))).thenReturn(emptyPage);

            // When
            Page<MintingDto.MintableNftResponse> result =
                    nftMintingService.getMintableNfts(1L, pageable);

            // Then
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }
    }

    @Nested
    @DisplayName("민팅 재시도 테스트")
    class RetryMintingTest {

        @Test
        @DisplayName("성공 - 재시도")
        void retryMinting_Success() {
            // Given
            collection.setMintStatus(MintStatus.FAILED);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));
            when(userNftCollectionRepository.save(any(UserNftCollection.class))).thenReturn(collection);
            mockSuccessfulMinting();

            // When
            MintingDto.MintingResponse result = nftMintingService.retryMinting(1L, 1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getCollectionId()).isEqualTo(1L);
            assertThat(result.getMessage()).contains("재시도");
            verify(userNftCollectionRepository).save(any(UserNftCollection.class));
        }

        @Test
        @DisplayName("실패 - 컬렉션 없음")
        void retryMinting_Fail_NotFound() {
            // Given
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> nftMintingService.retryMinting(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("NFT 컬렉션을 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }

        @Test
        @DisplayName("실패 - 권한 없음")
        void retryMinting_Fail_NotOwner() {
            // Given
            collection.setMintStatus(MintStatus.FAILED);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.retryMinting(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("권한이 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 403, "FORBIDDEN"));
        }

        @Test
        @DisplayName("실패 - FAILED 상태 아님")
        void retryMinting_Fail_NotFailed() {
            // Given
            collection.setMintStatus(MintStatus.PENDING);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.retryMinting(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("실패한 NFT만 재시도할 수 있습니다")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 이미 민팅됨")
        void retryMinting_Fail_AlreadyMinted() {
            // Given
            collection.setMintStatus(MintStatus.MINTED);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.retryMinting(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("실패한 NFT만 재시도할 수 있습니다")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }

        @Test
        @DisplayName("실패 - 지갑 주소 없음")
        void retryMinting_Fail_NoWalletAddress() {
            // Given
            collection.setMintStatus(MintStatus.FAILED);
            collection.setWalletAddress(null);
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(collection));

            // When & Then
            assertThatThrownBy(() -> nftMintingService.retryMinting(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("지갑 주소가 필요합니다")
                    .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
        }
    }

    @Nested
    @DisplayName("민팅 통계 조회 테스트")
    class GetMintingStatsTest {

        @Test
        @DisplayName("성공 - 통계 조회")
        void getMintingStats_Success() {
            // Given
            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(10);
            when(userNftCollectionRepository.countByUserIdAndMintStatus(1L, MintStatus.MINTED)).thenReturn(5L);
            when(userNftCollectionRepository.countByUserIdAndMintStatus(1L, MintStatus.PENDING)).thenReturn(3L);
            when(userNftCollectionRepository.countByUserIdAndMintStatusIn(eq(1L), any())).thenReturn(1L);
            when(userNftCollectionRepository.countByUserIdAndMintStatus(1L, MintStatus.FAILED)).thenReturn(1L);

            // When
            MintingDto.MintingStatsResponse result = nftMintingService.getMintingStats(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTotalCollected()).isEqualTo(10L);
            assertThat(result.getMintedCount()).isEqualTo(5L);
            assertThat(result.getPendingCount()).isEqualTo(3L);
            assertThat(result.getMintingCount()).isEqualTo(1L);
            assertThat(result.getFailedCount()).isEqualTo(1L);
        }

        @Test
        @DisplayName("성공 - 수집 NFT 없음")
        void getMintingStats_NoCollections() {
            // Given
            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(0);
            when(userNftCollectionRepository.countByUserIdAndMintStatus(eq(1L), any())).thenReturn(0L);
            when(userNftCollectionRepository.countByUserIdAndMintStatusIn(eq(1L), any())).thenReturn(0L);

            // When
            MintingDto.MintingStatsResponse result = nftMintingService.getMintingStats(1L);

            // Then
            assertThat(result.getTotalCollected()).isZero();
            assertThat(result.getMintedCount()).isZero();
            assertThat(result.getPendingCount()).isZero();
            assertThat(result.getMintingCount()).isZero();
            assertThat(result.getFailedCount()).isZero();
        }
    }

    private void mockSuccessfulMinting() {
        PolygonBlockchainService.MintResult mintResult =
                new PolygonBlockchainService.MintResult(true, "12345", "0xabc123", "NFT 민팅 성공");
        when(blockchainService.mintNftAsync(eq(1L), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(mintResult));
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
