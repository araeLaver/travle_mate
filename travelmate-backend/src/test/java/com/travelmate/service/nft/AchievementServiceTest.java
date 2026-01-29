package com.travelmate.service.nft;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.NftDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.AchievementRepository;
import com.travelmate.repository.nft.UserAchievementRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AchievementService 테스트")
class AchievementServiceTest {

    @Mock
    private AchievementRepository achievementRepository;

    @Mock
    private UserAchievementRepository userAchievementRepository;

    @Mock
    private UserNftCollectionRepository userNftCollectionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PointService pointService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AchievementService achievementService;

    private User testUser;
    private Achievement testAchievement;
    private UserAchievement testUserAchievement;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("testuser");

        testAchievement = new Achievement();
        testAchievement.setId(1L);
        testAchievement.setCode("FIRST_NFT");
        testAchievement.setName("첫 번째 NFT");
        testAchievement.setDescription("첫 번째 NFT를 수집하세요");
        testAchievement.setType(AchievementType.COLLECTION);
        testAchievement.setRarity(Rarity.COMMON);
        testAchievement.setPointReward(100);
        testAchievement.setConditionJson("{\"type\":\"TOTAL_COLLECT\",\"target\":1}");
        testAchievement.setIsActive(true);
        testAchievement.setDisplayOrder(1);
        testAchievement.setGrantsBadgeNft(false);

        testUserAchievement = UserAchievement.builder()
                .id(1L)
                .user(testUser)
                .achievement(testAchievement)
                .currentProgress(1)
                .targetProgress(1)
                .isCompleted(true)
                .completedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("getAllAchievements 테스트")
    class GetAllAchievementsTest {

        @Test
        @DisplayName("성공 - 모든 업적 조회")
        void getAllAchievements_Success() {
            // Given
            when(achievementRepository.findByIsActiveTrueOrderByDisplayOrderAsc())
                    .thenReturn(List.of(testAchievement));
            when(userAchievementRepository.findByUserIdAndAchievementIds(eq(1L), anyList()))
                    .thenReturn(List.of(testUserAchievement));

            // When
            List<NftDto.AchievementResponse> result = achievementService.getAllAchievements(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("첫 번째 NFT");
            assertThat(result.get(0).getIsCompleted()).isTrue();
        }

        @Test
        @DisplayName("성공 - 업적 없음")
        void getAllAchievements_Empty() {
            // Given
            when(achievementRepository.findByIsActiveTrueOrderByDisplayOrderAsc())
                    .thenReturn(List.of());

            // When
            List<NftDto.AchievementResponse> result = achievementService.getAllAchievements(1L);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("성공 - 완료하지 않은 업적 포함")
        void getAllAchievements_IncompleteAchievements() {
            // Given
            when(achievementRepository.findByIsActiveTrueOrderByDisplayOrderAsc())
                    .thenReturn(List.of(testAchievement));
            when(userAchievementRepository.findByUserIdAndAchievementIds(eq(1L), anyList()))
                    .thenReturn(List.of()); // 완료한 업적 없음

            // When
            List<NftDto.AchievementResponse> result = achievementService.getAllAchievements(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getIsCompleted()).isFalse();
            assertThat(result.get(0).getCurrentProgress()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("getAchievementsByType 테스트")
    class GetAchievementsByTypeTest {

        @Test
        @DisplayName("성공 - 타입별 업적 조회")
        void getAchievementsByType_Success() {
            // Given
            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(testAchievement));
            when(userAchievementRepository.findByUserIdAndAchievementIds(eq(1L), anyList()))
                    .thenReturn(List.of());

            // When
            List<NftDto.AchievementResponse> result = achievementService.getAchievementsByType(1L, AchievementType.COLLECTION);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getType()).isEqualTo(AchievementType.COLLECTION);
        }
    }

    @Nested
    @DisplayName("getMyAchievements 테스트")
    class GetMyAchievementsTest {

        @Test
        @DisplayName("성공 - 내 업적 조회")
        void getMyAchievements_Success() {
            // Given
            when(userAchievementRepository.findByUserId(1L)).thenReturn(List.of(testUserAchievement));

            // When
            List<NftDto.AchievementResponse> result = achievementService.getMyAchievements(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getIsCompleted()).isTrue();
        }

        @Test
        @DisplayName("성공 - 업적 없음")
        void getMyAchievements_Empty() {
            // Given
            when(userAchievementRepository.findByUserId(1L)).thenReturn(List.of());

            // When
            List<NftDto.AchievementResponse> result = achievementService.getMyAchievements(1L);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getCompletedAchievements 테스트")
    class GetCompletedAchievementsTest {

        @Test
        @DisplayName("성공 - 완료된 업적만 조회")
        void getCompletedAchievements_Success() {
            // Given
            when(userAchievementRepository.findByUserIdAndIsCompletedTrue(1L))
                    .thenReturn(List.of(testUserAchievement));

            // When
            List<NftDto.AchievementResponse> result = achievementService.getCompletedAchievements(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getIsCompleted()).isTrue();
        }
    }

    @Nested
    @DisplayName("getAchievementStats 테스트")
    class GetAchievementStatsTest {

        @Test
        @DisplayName("성공 - 업적 통계 조회")
        void getAchievementStats_Success() {
            // Given
            when(achievementRepository.count()).thenReturn(10L);
            when(userAchievementRepository.countByUserIdAndIsCompletedTrue(1L)).thenReturn(3);
            when(userAchievementRepository.findByUserIdAndIsCompletedTrue(1L))
                    .thenReturn(List.of(testUserAchievement));

            // When
            NftDto.AchievementStatsResponse result = achievementService.getAchievementStats(1L);

            // Then
            assertThat(result.getTotalAchievements()).isEqualTo(10);
            assertThat(result.getCompletedAchievements()).isEqualTo(3);
            assertThat(result.getTotalPointsFromAchievements()).isEqualTo(100L);
        }

        @Test
        @DisplayName("성공 - 완료된 업적 없음")
        void getAchievementStats_NoCompleted() {
            // Given
            when(achievementRepository.count()).thenReturn(10L);
            when(userAchievementRepository.countByUserIdAndIsCompletedTrue(1L)).thenReturn(0);
            when(userAchievementRepository.findByUserIdAndIsCompletedTrue(1L)).thenReturn(List.of());

            // When
            NftDto.AchievementStatsResponse result = achievementService.getAchievementStats(1L);

            // Then
            assertThat(result.getCompletedAchievements()).isEqualTo(0);
            assertThat(result.getTotalPointsFromAchievements()).isEqualTo(0L);
            assertThat(result.getBadgeNftsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("성공 - 배지 NFT 카운트")
        void getAchievementStats_WithBadgeNft() {
            // Given
            testAchievement.setGrantsBadgeNft(true);
            testUserAchievement.setBadgeTokenId("12345");

            when(achievementRepository.count()).thenReturn(10L);
            when(userAchievementRepository.countByUserIdAndIsCompletedTrue(1L)).thenReturn(1);
            when(userAchievementRepository.findByUserIdAndIsCompletedTrue(1L))
                    .thenReturn(List.of(testUserAchievement));

            // When
            NftDto.AchievementStatsResponse result = achievementService.getAchievementStats(1L);

            // Then
            assertThat(result.getBadgeNftsEarned()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("checkAchievementsOnCollect 테스트")
    class CheckAchievementsOnCollectTest {

        @Test
        @DisplayName("성공 - 새 업적 달성")
        void checkAchievementsOnCollect_NewUnlock() {
            // Given
            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(testAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 1L))
                    .thenReturn(Optional.empty());
            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(1); // 1개 수집

            // When
            List<NftDto.AchievementUnlocked> result = achievementService.checkAchievementsOnCollect(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("첫 번째 NFT");
            assertThat(result.get(0).getPointReward()).isEqualTo(100L);

            verify(pointService).earnPoints(eq(1L), eq(100L), any(), anyString(), any(), anyString());
            verify(userAchievementRepository).save(any(UserAchievement.class));
        }

        @Test
        @DisplayName("성공 - 이미 완료된 업적 무시")
        void checkAchievementsOnCollect_AlreadyCompleted() {
            // Given
            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(testAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 1L))
                    .thenReturn(Optional.of(testUserAchievement)); // 이미 완료

            // When
            List<NftDto.AchievementUnlocked> result = achievementService.checkAchievementsOnCollect(1L);

            // Then
            assertThat(result).isEmpty();
            verify(pointService, never()).earnPoints(anyLong(), anyLong(), any(), anyString(), any(), anyString());
        }

        @Test
        @DisplayName("성공 - 진행 중인 업적 업데이트")
        void checkAchievementsOnCollect_UpdateProgress() {
            // Given
            Achievement multiCollectAchievement = new Achievement();
            multiCollectAchievement.setId(2L);
            multiCollectAchievement.setCode("COLLECT_10");
            multiCollectAchievement.setName("10개 수집");
            multiCollectAchievement.setType(AchievementType.COLLECTION);
            multiCollectAchievement.setRarity(Rarity.RARE);
            multiCollectAchievement.setPointReward(500);
            multiCollectAchievement.setConditionJson("{\"type\":\"TOTAL_COLLECT\",\"target\":10}");

            UserAchievement inProgressAchievement = UserAchievement.builder()
                    .id(2L)
                    .user(testUser)
                    .achievement(multiCollectAchievement)
                    .currentProgress(5)
                    .targetProgress(10)
                    .isCompleted(false)
                    .build();

            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(multiCollectAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 2L))
                    .thenReturn(Optional.of(inProgressAchievement));
            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(6); // 6개 수집 (목표 10개 미달)

            // When
            List<NftDto.AchievementUnlocked> result = achievementService.checkAchievementsOnCollect(1L);

            // Then
            assertThat(result).isEmpty(); // 아직 완료 안됨
            verify(userAchievementRepository).save(argThat(ua ->
                    ua.getCurrentProgress() == 6 && !ua.getIsCompleted()
            ));
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void checkAchievementsOnCollect_UserNotFound() {
            // Given
            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(testAchievement));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> achievementService.checkAchievementsOnCollect(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("updateAchievementProgress 테스트")
    class UpdateAchievementProgressTest {

        @Test
        @DisplayName("성공 - 진행도 업데이트")
        void updateAchievementProgress_Success() {
            // Given
            testAchievement.setConditionJson("{\"type\":\"TOTAL_COLLECT\",\"target\":10}");
            UserAchievement inProgress = UserAchievement.builder()
                    .user(testUser)
                    .achievement(testAchievement)
                    .currentProgress(3)
                    .targetProgress(10)
                    .isCompleted(false)
                    .build();

            when(achievementRepository.findByCode("FIRST_NFT")).thenReturn(Optional.of(testAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 1L))
                    .thenReturn(Optional.of(inProgress));

            // When
            achievementService.updateAchievementProgress(1L, "FIRST_NFT", 5);

            // Then
            verify(userAchievementRepository).save(argThat(ua ->
                    ua.getCurrentProgress() == 5 && !ua.getIsCompleted()
            ));
        }

        @Test
        @DisplayName("성공 - 목표 달성시 완료 처리")
        void updateAchievementProgress_Completed() {
            // Given
            testAchievement.setConditionJson("{\"type\":\"TOTAL_COLLECT\",\"target\":10}");
            UserAchievement inProgress = UserAchievement.builder()
                    .user(testUser)
                    .achievement(testAchievement)
                    .currentProgress(9)
                    .targetProgress(10)
                    .isCompleted(false)
                    .build();

            when(achievementRepository.findByCode("FIRST_NFT")).thenReturn(Optional.of(testAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 1L))
                    .thenReturn(Optional.of(inProgress));

            // When
            achievementService.updateAchievementProgress(1L, "FIRST_NFT", 10);

            // Then
            verify(userAchievementRepository).save(argThat(ua ->
                    ua.getCurrentProgress() == 10 && ua.getIsCompleted()
            ));
            verify(pointService).earnPoints(eq(1L), eq(100L), any(), anyString(), any(), anyString());
        }

        @Test
        @DisplayName("성공 - 이미 완료된 업적 무시")
        void updateAchievementProgress_AlreadyCompleted() {
            // Given
            when(achievementRepository.findByCode("FIRST_NFT")).thenReturn(Optional.of(testAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 1L))
                    .thenReturn(Optional.of(testUserAchievement)); // 이미 완료

            // When
            achievementService.updateAchievementProgress(1L, "FIRST_NFT", 5);

            // Then
            verify(userAchievementRepository, never()).save(any());
            verify(pointService, never()).earnPoints(anyLong(), anyLong(), any(), anyString(), any(), anyString());
        }

        @Test
        @DisplayName("성공 - 새 업적 진행 시작")
        void updateAchievementProgress_NewProgress() {
            // Given
            testAchievement.setConditionJson("{\"type\":\"TOTAL_COLLECT\",\"target\":10}");

            when(achievementRepository.findByCode("FIRST_NFT")).thenReturn(Optional.of(testAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 1L))
                    .thenReturn(Optional.empty()); // 아직 시작 안함

            // When
            achievementService.updateAchievementProgress(1L, "FIRST_NFT", 3);

            // Then
            verify(userAchievementRepository).save(argThat(ua ->
                    ua.getCurrentProgress() == 3 && !ua.getIsCompleted()
            ));
        }

        @Test
        @DisplayName("실패 - 업적 없음")
        void updateAchievementProgress_AchievementNotFound() {
            // Given
            when(achievementRepository.findByCode("INVALID_CODE")).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> achievementService.updateAchievementProgress(1L, "INVALID_CODE", 5))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("업적을 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void updateAchievementProgress_UserNotFound() {
            // Given
            when(achievementRepository.findByCode("FIRST_NFT")).thenReturn(Optional.of(testAchievement));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> achievementService.updateAchievementProgress(999L, "FIRST_NFT", 5))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("조건 파싱 테스트")
    class ConditionParsingTest {

        @Test
        @DisplayName("성공 - RARITY_COLLECT 조건")
        void checkAchievements_RarityCollect() {
            // Given
            Achievement rarityAchievement = new Achievement();
            rarityAchievement.setId(3L);
            rarityAchievement.setCode("LEGENDARY_COLLECT");
            rarityAchievement.setName("레전드리 수집");
            rarityAchievement.setType(AchievementType.COLLECTION);
            rarityAchievement.setRarity(Rarity.LEGENDARY);
            rarityAchievement.setPointReward(1000);
            rarityAchievement.setConditionJson("{\"type\":\"RARITY_COLLECT\",\"target\":5,\"rarity\":\"LEGENDARY\"}");

            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(rarityAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 3L))
                    .thenReturn(Optional.empty());
            when(userNftCollectionRepository.countByUserIdAndRarity(1L, Rarity.LEGENDARY)).thenReturn(5);

            // When
            List<NftDto.AchievementUnlocked> result = achievementService.checkAchievementsOnCollect(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("레전드리 수집");
        }

        @Test
        @DisplayName("성공 - CATEGORY_COLLECT 조건")
        void checkAchievements_CategoryCollect() {
            // Given
            Achievement categoryAchievement = new Achievement();
            categoryAchievement.setId(4L);
            categoryAchievement.setCode("LANDMARK_COLLECT");
            categoryAchievement.setName("랜드마크 수집");
            categoryAchievement.setType(AchievementType.COLLECTION);
            categoryAchievement.setRarity(Rarity.RARE);
            categoryAchievement.setPointReward(300);
            categoryAchievement.setConditionJson("{\"type\":\"CATEGORY_COLLECT\",\"target\":10,\"category\":\"LANDMARK\"}");

            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(categoryAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 4L))
                    .thenReturn(Optional.empty());
            when(userNftCollectionRepository.countByUserIdAndCategory(1L, LocationCategory.LANDMARK)).thenReturn(10);

            // When
            List<NftDto.AchievementUnlocked> result = achievementService.checkAchievementsOnCollect(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("랜드마크 수집");
        }

        @Test
        @DisplayName("성공 - REGION_COLLECT 조건")
        void checkAchievements_RegionCollect() {
            // Given
            Achievement regionAchievement = new Achievement();
            regionAchievement.setId(5L);
            regionAchievement.setCode("SEOUL_MASTER");
            regionAchievement.setName("서울 마스터");
            regionAchievement.setType(AchievementType.COLLECTION);
            regionAchievement.setRarity(Rarity.EPIC);
            regionAchievement.setPointReward(500);
            regionAchievement.setConditionJson("{\"type\":\"REGION_COLLECT\",\"target\":20,\"region\":\"Seoul\"}");

            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(regionAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 5L))
                    .thenReturn(Optional.empty());
            when(userNftCollectionRepository.countByUserIdAndRegion(1L, "Seoul")).thenReturn(20);

            // When
            List<NftDto.AchievementUnlocked> result = achievementService.checkAchievementsOnCollect(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("서울 마스터");
        }

        @Test
        @DisplayName("성공 - 잘못된 조건 JSON 기본값 처리")
        void checkAchievements_InvalidConditionJson() {
            // Given
            Achievement invalidAchievement = new Achievement();
            invalidAchievement.setId(6L);
            invalidAchievement.setCode("INVALID");
            invalidAchievement.setName("잘못된 업적");
            invalidAchievement.setType(AchievementType.COLLECTION);
            invalidAchievement.setRarity(Rarity.COMMON);
            invalidAchievement.setPointReward(10);
            invalidAchievement.setConditionJson("invalid json");

            when(achievementRepository.findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION))
                    .thenReturn(List.of(invalidAchievement));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userAchievementRepository.findByUserIdAndAchievementId(1L, 6L))
                    .thenReturn(Optional.empty());
            when(userNftCollectionRepository.countByUserId(1L)).thenReturn(1); // 기본 TOTAL_COLLECT로 처리

            // When
            List<NftDto.AchievementUnlocked> result = achievementService.checkAchievementsOnCollect(1L);

            // Then - 오류 없이 처리되고 기본값으로 진행
            assertThat(result).hasSize(1);
        }
    }
}
