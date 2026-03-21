package com.travelmate.service.nft;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import com.travelmate.service.CacheService;
import com.travelmate.service.NotificationService;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NftCollectionService 테스트")
class NftCollectionServiceTest {

    @Mock
    private CollectibleLocationRepository collectibleLocationRepository;

    @Mock
    private UserNftCollectionRepository userNftCollectionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PointService pointService;

    @Mock
    private GpsVerificationService gpsVerificationService;

    @Mock
    private AchievementService achievementService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CacheService cacheService;

    @InjectMocks
    private NftCollectionService nftCollectionService;

    private User testUser;
    private CollectibleLocation testLocation;
    private UserNftCollection testNftCollection;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("testuser");
        testUser.setTotalNftsCollected(0);
        testUser.setUniqueLocationsVisited(0);

        testLocation = new CollectibleLocation();
        testLocation.setId(1L);
        testLocation.setName("Seoul Tower");
        testLocation.setDescription("Famous landmark");
        testLocation.setLatitude(37.5512);
        testLocation.setLongitude(126.9882);
        testLocation.setCollectRadius(50.0);
        testLocation.setRarity(Rarity.RARE);
        testLocation.setCategory(LocationCategory.LANDMARK);
        testLocation.setCountry("South Korea");
        testLocation.setCity("Seoul");
        testLocation.setRegion("Yongsan");
        testLocation.setPointReward(100);
        testLocation.setIsActive(true);
        testLocation.setIsSeasonalEvent(false);
        testLocation.setImageUrl("https://example.com/image.jpg");

        testNftCollection = UserNftCollection.builder()
                .id(1L)
                .user(testUser)
                .location(testLocation)
                .mintStatus(MintStatus.PENDING)
                .collectedAt(LocalDateTime.now())
                .earnedPoints(100)
                .isVerified(true)
                .build();
    }

    @Nested
    @DisplayName("getCollectibleLocations 테스트")
    class GetCollectibleLocationsTest {

        @Test
        @DisplayName("성공 - 수집 가능 장소 목록 조회")
        void getCollectibleLocations_Success() {
            // Given
            List<CollectibleLocation> locations = List.of(testLocation);
            Page<CollectibleLocation> locationPage = new PageImpl<>(locations, PageRequest.of(0, 10), 1);

            when(collectibleLocationRepository.findByIsActiveTrue(any())).thenReturn(locationPage);
            when(userNftCollectionRepository.findCollectedLocationIdsByUserId(1L)).thenReturn(List.of());

            // When
            Page<NftDto.CollectibleLocationResponse> result = nftCollectionService.getCollectibleLocations(1L, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("Seoul Tower");
            assertThat(result.getContent().get(0).getIsCollected()).isFalse();
        }

        @Test
        @DisplayName("성공 - 이미 수집한 장소 표시")
        void getCollectibleLocations_AlreadyCollected() {
            // Given
            List<CollectibleLocation> locations = List.of(testLocation);
            Page<CollectibleLocation> locationPage = new PageImpl<>(locations, PageRequest.of(0, 10), 1);

            when(collectibleLocationRepository.findByIsActiveTrue(any())).thenReturn(locationPage);
            when(userNftCollectionRepository.findCollectedLocationIdsByUserId(1L)).thenReturn(List.of(1L));

            // When
            Page<NftDto.CollectibleLocationResponse> result = nftCollectionService.getCollectibleLocations(1L, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent().get(0).getIsCollected()).isTrue();
        }

        @Test
        @DisplayName("성공 - 비로그인 사용자 조회")
        void getCollectibleLocations_Anonymous() {
            // Given
            List<CollectibleLocation> locations = List.of(testLocation);
            Page<CollectibleLocation> locationPage = new PageImpl<>(locations, PageRequest.of(0, 10), 1);

            when(collectibleLocationRepository.findByIsActiveTrue(any())).thenReturn(locationPage);

            // When
            Page<NftDto.CollectibleLocationResponse> result = nftCollectionService.getCollectibleLocations(null, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getIsCollected()).isFalse();
        }
    }

    @Nested
    @DisplayName("getNearbyLocations 테스트")
    class GetNearbyLocationsTest {

        @Test
        @DisplayName("성공 - 주변 장소 조회")
        void getNearbyLocations_Success() {
            // Given
            when(collectibleLocationRepository.findNearbyActiveLocations(37.55, 126.98, 1.0))
                    .thenReturn(List.of(testLocation));
            when(userNftCollectionRepository.findCollectedLocationIdsByUserId(1L)).thenReturn(List.of());
            when(gpsVerificationService.calculateDistance(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(0.5); // 500m

            // When
            List<NftDto.CollectibleLocationResponse> result = nftCollectionService.getNearbyLocations(1L, 37.55, 126.98, 1.0);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDistance()).isEqualTo(0.5);
        }

        @Test
        @DisplayName("성공 - 주변에 장소 없음")
        void getNearbyLocations_Empty() {
            // Given
            when(collectibleLocationRepository.findNearbyActiveLocations(anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(List.of());

            // When
            List<NftDto.CollectibleLocationResponse> result = nftCollectionService.getNearbyLocations(1L, 37.55, 126.98, 1.0);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getLocationsByCategory 테스트")
    class GetLocationsByCategoryTest {

        @Test
        @DisplayName("성공 - 카테고리별 장소 조회")
        void getLocationsByCategory_Success() {
            // Given
            List<CollectibleLocation> locations = List.of(testLocation);
            Page<CollectibleLocation> locationPage = new PageImpl<>(locations, PageRequest.of(0, 10), 1);

            when(collectibleLocationRepository.findByCategoryAndIsActiveTrue(eq(LocationCategory.LANDMARK), any()))
                    .thenReturn(locationPage);
            when(userNftCollectionRepository.findCollectedLocationIdsByUserId(1L)).thenReturn(List.of());

            // When
            Page<NftDto.CollectibleLocationResponse> result = nftCollectionService.getLocationsByCategory(1L, LocationCategory.LANDMARK, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getCategory()).isEqualTo(LocationCategory.LANDMARK);
        }
    }

    @Nested
    @DisplayName("collectNft 테스트")
    class CollectNftTest {

        @Test
        @DisplayName("성공 - NFT 수집")
        void collectNft_Success() {
            // Given
            NftDto.CollectNftRequest request = new NftDto.CollectNftRequest();
            request.setLocationId(1L);
            request.setLatitude(37.5512);
            request.setLongitude(126.9882);
            request.setGpsAccuracy(10.0f);
            request.setIsMockLocation(false);
            request.setDeviceId("device123");

            GpsVerificationService.GpsVerificationResult verificationResult =
                    new GpsVerificationService.GpsVerificationResult(true, "검증 성공", 0.01, 0);

            when(collectibleLocationRepository.findById(1L)).thenReturn(Optional.of(testLocation));
            when(userNftCollectionRepository.existsByUserIdAndLocationId(1L, 1L)).thenReturn(false);
            when(gpsVerificationService.verify(any())).thenReturn(verificationResult);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userNftCollectionRepository.save(any())).thenReturn(testNftCollection);
            when(achievementService.checkAchievementsOnCollect(1L)).thenReturn(List.of());

            // When
            NftDto.CollectNftResponse result = nftCollectionService.collectNft(1L, request);

            // Then
            assertThat(result.getSuccess()).isTrue();
            assertThat(result.getEarnedPoints()).isEqualTo(100L);
            assertThat(result.getMessage()).contains("성공");

            verify(pointService).earnPoints(eq(1L), eq(100L), any(), anyString(), any(), anyString());
            verify(notificationService).notifyNftCollected(eq(1L), any(), anyString(), anyInt());
        }

        @Test
        @DisplayName("실패 - 장소 없음")
        void collectNft_LocationNotFound() {
            // Given
            NftDto.CollectNftRequest request = new NftDto.CollectNftRequest();
            request.setLocationId(999L);
            request.setLatitude(37.5512);
            request.setLongitude(126.9882);

            when(collectibleLocationRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> nftCollectionService.collectNft(1L, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 비활성화된 장소")
        void collectNft_InactiveLocation() {
            // Given
            testLocation.setIsActive(false);

            NftDto.CollectNftRequest request = new NftDto.CollectNftRequest();
            request.setLocationId(1L);
            request.setLatitude(37.5512);
            request.setLongitude(126.9882);

            when(collectibleLocationRepository.findById(1L)).thenReturn(Optional.of(testLocation));

            // When & Then
            assertThatThrownBy(() -> nftCollectionService.collectNft(1L, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("수집이 불가능");
        }

        @Test
        @DisplayName("실패 - 이미 수집한 장소")
        void collectNft_AlreadyCollected() {
            // Given
            NftDto.CollectNftRequest request = new NftDto.CollectNftRequest();
            request.setLocationId(1L);
            request.setLatitude(37.5512);
            request.setLongitude(126.9882);

            when(collectibleLocationRepository.findById(1L)).thenReturn(Optional.of(testLocation));
            when(userNftCollectionRepository.existsByUserIdAndLocationId(1L, 1L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> nftCollectionService.collectNft(1L, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("이미 수집");
        }

        @Test
        @DisplayName("실패 - GPS 검증 실패")
        void collectNft_GpsVerificationFailed() {
            // Given
            NftDto.CollectNftRequest request = new NftDto.CollectNftRequest();
            request.setLocationId(1L);
            request.setLatitude(37.00);
            request.setLongitude(126.00);
            request.setGpsAccuracy(10.0f);
            request.setIsMockLocation(false);
            request.setDeviceId("device123");

            GpsVerificationService.GpsVerificationResult verificationResult =
                    new GpsVerificationService.GpsVerificationResult(false, "위치가 너무 멉니다", 100.0, 50);

            when(collectibleLocationRepository.findById(1L)).thenReturn(Optional.of(testLocation));
            when(userNftCollectionRepository.existsByUserIdAndLocationId(1L, 1L)).thenReturn(false);
            when(gpsVerificationService.verify(any())).thenReturn(verificationResult);

            // When
            NftDto.CollectNftResponse result = nftCollectionService.collectNft(1L, request);

            // Then
            assertThat(result.getSuccess()).isFalse();
            assertThat(result.getMessage()).contains("위치");
        }

        @Test
        @DisplayName("실패 - 시즌 이벤트 시작 전")
        void collectNft_SeasonalEventNotStarted() {
            // Given
            testLocation.setIsSeasonalEvent(true);
            testLocation.setEventStartAt(LocalDateTime.now().plusDays(7));

            NftDto.CollectNftRequest request = new NftDto.CollectNftRequest();
            request.setLocationId(1L);
            request.setLatitude(37.5512);
            request.setLongitude(126.9882);

            when(collectibleLocationRepository.findById(1L)).thenReturn(Optional.of(testLocation));

            // When & Then
            assertThatThrownBy(() -> nftCollectionService.collectNft(1L, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("시작되지 않았습니다");
        }

        @Test
        @DisplayName("실패 - 시즌 이벤트 종료")
        void collectNft_SeasonalEventEnded() {
            // Given
            testLocation.setIsSeasonalEvent(true);
            testLocation.setEventStartAt(LocalDateTime.now().minusDays(14));
            testLocation.setEventEndAt(LocalDateTime.now().minusDays(7));

            NftDto.CollectNftRequest request = new NftDto.CollectNftRequest();
            request.setLocationId(1L);
            request.setLatitude(37.5512);
            request.setLongitude(126.9882);

            when(collectibleLocationRepository.findById(1L)).thenReturn(Optional.of(testLocation));

            // When & Then
            assertThatThrownBy(() -> nftCollectionService.collectNft(1L, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("종료");
        }
    }

    @Nested
    @DisplayName("getMyCollection 테스트")
    class GetMyCollectionTest {

        @Test
        @DisplayName("성공 - 내 컬렉션 조회")
        void getMyCollection_Success() {
            // Given
            List<UserNftCollection> collections = List.of(testNftCollection);
            Page<UserNftCollection> collectionPage = new PageImpl<>(collections, PageRequest.of(0, 10), 1);

            when(userNftCollectionRepository.findByUserIdWithLocation(eq(1L), any()))
                    .thenReturn(collectionPage);

            // When
            Page<NftDto.UserNftCollectionResponse> result = nftCollectionService.getMyCollection(1L, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getLocation().getName()).isEqualTo("Seoul Tower");
        }

        @Test
        @DisplayName("성공 - 빈 컬렉션")
        void getMyCollection_Empty() {
            // Given
            Page<UserNftCollection> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);

            when(userNftCollectionRepository.findByUserIdWithLocation(eq(1L), any()))
                    .thenReturn(emptyPage);

            // When
            Page<NftDto.UserNftCollectionResponse> result = nftCollectionService.getMyCollection(1L, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getMyCollectionByRarity 테스트")
    class GetMyCollectionByRarityTest {

        @Test
        @DisplayName("성공 - 희귀도별 컬렉션 조회")
        void getMyCollectionByRarity_Success() {
            // Given
            List<UserNftCollection> collections = List.of(testNftCollection);
            Page<UserNftCollection> collectionPage = new PageImpl<>(collections, PageRequest.of(0, 10), 1);

            when(userNftCollectionRepository.findByUserIdAndRarity(eq(1L), eq(Rarity.RARE), any()))
                    .thenReturn(collectionPage);

            // When
            Page<NftDto.UserNftCollectionResponse> result = nftCollectionService.getMyCollectionByRarity(1L, Rarity.RARE, PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getLocation().getRarity()).isEqualTo(Rarity.RARE);
        }
    }

    @Nested
    @DisplayName("getNftDetail 테스트")
    class GetNftDetailTest {

        @Test
        @DisplayName("성공 - NFT 상세 조회")
        void getNftDetail_Success() {
            // Given
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(testNftCollection));

            // When
            NftDto.UserNftCollectionResponse result = nftCollectionService.getNftDetail(1L, 1L);

            // Then
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getLocation().getName()).isEqualTo("Seoul Tower");
        }

        @Test
        @DisplayName("실패 - NFT 없음")
        void getNftDetail_NotFound() {
            // Given
            when(userNftCollectionRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> nftCollectionService.getNftDetail(1L, 999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 접근 권한 없음")
        void getNftDetail_Unauthorized() {
            // Given
            when(userNftCollectionRepository.findById(1L)).thenReturn(Optional.of(testNftCollection));

            // When & Then
            assertThatThrownBy(() -> nftCollectionService.getNftDetail(999L, 1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("접근 권한");
        }
    }

    @Nested
    @DisplayName("getCollectionBook 테스트")
    class GetCollectionBookTest {

        @Test
        @DisplayName("성공 - 도감 조회")
        void getCollectionBook_Success() {
            // Given
            when(collectibleLocationRepository.count()).thenReturn(100L);
            when(userNftCollectionRepository.countDistinctLocationsByUserId(1L)).thenReturn(25);

            List<Object[]> rarityCounts = new ArrayList<>();
            rarityCounts.add(new Object[]{Rarity.COMMON, 15L});
            rarityCounts.add(new Object[]{Rarity.RARE, 7L});
            rarityCounts.add(new Object[]{Rarity.EPIC, 2L});
            rarityCounts.add(new Object[]{Rarity.LEGENDARY, 1L});
            when(userNftCollectionRepository.countByUserIdGroupByRarity(1L)).thenReturn(rarityCounts);

            List<Object[]> regionStats = new ArrayList<>();
            regionStats.add(new Object[]{"Seoul", "South Korea", 50, 20, 40.0});
            when(userNftCollectionRepository.getCollectionProgressByRegion(1L)).thenReturn(regionStats);

            List<Object[]> categoryStats = new ArrayList<>();
            categoryStats.add(new Object[]{"LANDMARK", 30, 10, 33.3});
            when(userNftCollectionRepository.getCollectionProgressByCategory(1L)).thenReturn(categoryStats);

            // When
            NftDto.CollectionBookResponse result = nftCollectionService.getCollectionBook(1L);

            // Then
            assertThat(result.getStats().getTotalLocations()).isEqualTo(100);
            assertThat(result.getStats().getCollectedLocations()).isEqualTo(25);
            assertThat(result.getStats().getCompletionRate()).isEqualTo(25.0);
            assertThat(result.getStats().getCommonCollected()).isEqualTo(15);
            assertThat(result.getStats().getLegendaryCollected()).isEqualTo(1);
            assertThat(result.getRegions()).hasSize(1);
            assertThat(result.getCategories()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getUserNftStats 테스트")
    class GetUserNftStatsTest {

        @Test
        @DisplayName("성공 - 사용자 NFT 통계 조회")
        void getUserNftStats_Success() {
            // Given
            testUser.setTotalNftsCollected(25);
            testUser.setUniqueLocationsVisited(20);
            testUser.setGlobalRank(100);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectibleLocationRepository.count()).thenReturn(100L);
            when(userNftCollectionRepository.countDistinctLocationsByUserId(1L)).thenReturn(25);
            when(userNftCollectionRepository.countByUserIdGroupByRarity(1L)).thenReturn(List.of());
            when(userNftCollectionRepository.getCollectionProgressByRegion(1L)).thenReturn(List.of());
            when(userNftCollectionRepository.getCollectionProgressByCategory(1L)).thenReturn(List.of());
            when(pointService.getBalance(1L)).thenReturn(NftDto.PointBalanceResponse.builder()
                    .totalPoints(1000L)
                    .lifetimeEarned(5000L)
                    .build());

            // When
            NftDto.UserNftStatsResponse result = nftCollectionService.getUserNftStats(1L);

            // Then
            assertThat(result.getTotalNftsCollected()).isEqualTo(25);
            assertThat(result.getUniqueLocationsVisited()).isEqualTo(20);
            assertThat(result.getGlobalRank()).isEqualTo(100);
            assertThat(result.getTotalPointsEarned()).isEqualTo(5000L);
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void getUserNftStats_UserNotFound() {
            // Given
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> nftCollectionService.getUserNftStats(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }
}
