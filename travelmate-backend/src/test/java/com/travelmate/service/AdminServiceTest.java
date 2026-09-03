package com.travelmate.service;

import com.travelmate.dto.AdminDto;
import com.travelmate.entity.RecommendationFeedback;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.LocationCategory;
import com.travelmate.entity.nft.Rarity;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.RecommendationFeedbackRepository;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.LocationReviewRepository;
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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService 테스트")
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CollectibleLocationRepository locationRepository;

    @Mock
    private UserNftCollectionRepository collectionRepository;

    @Mock
    private TravelGroupRepository groupRepository;

    @Mock
    private LocationReviewRepository reviewRepository;

    @Mock
    private RecommendationFeedbackRepository recommendationFeedbackRepository;

    @InjectMocks
    private AdminService adminService;

    private User testUser;
    private CollectibleLocation testLocation;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("테스터");
        testUser.setRole(User.Role.USER);
        testUser.setIsActive(true);
        testUser.setCreatedAt(LocalDateTime.now());

        testLocation = CollectibleLocation.builder()
                .id(100L)
                .name("테스트 장소")
                .description("설명")
                .region("서울")
                .country("대한민국")
                .category(LocationCategory.LANDMARK)
                .rarity(Rarity.RARE)
                .latitude(37.5665)
                .longitude(126.9780)
                .collectRadius(50.0)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("getDashboardStats 테스트")
    class GetDashboardStatsTest {

        @Test
        @DisplayName("성공 - 대시보드 통계 조회")
        void getDashboardStats_Success() {
            // Given
            when(userRepository.count()).thenReturn(1000L);
            when(userRepository.countByCreatedAtAfter(any())).thenReturn(10L, 50L);
            when(userRepository.countActiveUsersSince(any())).thenReturn(100L);
            when(collectionRepository.count()).thenReturn(5000L);
            when(collectionRepository.countByMintStatusMinted()).thenReturn(3000L);
            when(collectionRepository.countByCollectedAtAfter(any())).thenReturn(20L);
            when(groupRepository.count()).thenReturn(200L);
            when(groupRepository.countActiveGroups()).thenReturn(150L);
            when(reviewRepository.count()).thenReturn(2000L);
            when(reviewRepository.getAverageRating()).thenReturn(4.5);
            when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(5L);
            when(collectionRepository.countByCollectedAtBetween(any(), any())).thenReturn(10L);
            when(collectionRepository.countByLocationRarity(any())).thenReturn(100L);

            // When
            AdminDto.DashboardStats result = adminService.getDashboardStats();

            // Then
            assertThat(result.getTotalUsers()).isEqualTo(1000L);
            assertThat(result.getTotalNfts()).isEqualTo(5000L);
            assertThat(result.getMintedNfts()).isEqualTo(3000L);
            assertThat(result.getTotalGroups()).isEqualTo(200L);
            assertThat(result.getActiveGroups()).isEqualTo(150L);
            assertThat(result.getTotalReviews()).isEqualTo(2000L);
            assertThat(result.getAverageRating()).isEqualTo(4.5);
            assertThat(result.getDailyStats()).hasSize(30);
            assertThat(result.getNftsByRarity()).isNotEmpty();
        }

        @Test
        @DisplayName("성공 - 평균 평점이 null이면 0.0 반환")
        void getDashboardStats_NullAverageRating() {
            // Given
            when(userRepository.count()).thenReturn(100L);
            when(userRepository.countByCreatedAtAfter(any())).thenReturn(1L);
            when(userRepository.countActiveUsersSince(any())).thenReturn(10L);
            when(collectionRepository.count()).thenReturn(50L);
            when(collectionRepository.countByMintStatusMinted()).thenReturn(30L);
            when(collectionRepository.countByCollectedAtAfter(any())).thenReturn(2L);
            when(groupRepository.count()).thenReturn(20L);
            when(groupRepository.countActiveGroups()).thenReturn(15L);
            when(reviewRepository.count()).thenReturn(0L);
            when(reviewRepository.getAverageRating()).thenReturn(null);
            when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
            when(collectionRepository.countByCollectedAtBetween(any(), any())).thenReturn(0L);
            when(collectionRepository.countByLocationRarity(any())).thenReturn(0L);

            // When
            AdminDto.DashboardStats result = adminService.getDashboardStats();

            // Then
            assertThat(result.getAverageRating()).isEqualTo(0.0);
        }
    }

    @Nested
    @DisplayName("getUsers 테스트")
    class GetUsersTest {

        @Test
        @DisplayName("성공 - 사용자 목록 조회")
        void getUsers_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser));

            when(userRepository.findUsersForAdmin(any(), any(), any(), any())).thenReturn(userPage);
            when(collectionRepository.countByUserId(1L)).thenReturn(5);

            // When
            Page<AdminDto.UserManagement> result = adminService.getUsers(null, null, null, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getEmail()).isEqualTo("test@example.com");
            assertThat(result.getContent().get(0).getNftCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("성공 - 검색 필터 적용")
        void getUsers_WithFilters() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser));

            when(userRepository.findUsersForAdmin(eq("test"), eq("USER"), eq(true), any()))
                    .thenReturn(userPage);
            when(collectionRepository.countByUserId(anyLong())).thenReturn(0);

            // When
            Page<AdminDto.UserManagement> result = adminService.getUsers("test", "USER", true, pageable);

            // Then
            verify(userRepository).findUsersForAdmin("test", "USER", true, pageable);
        }
    }

    @Nested
    @DisplayName("getUserDetail 테스트")
    class GetUserDetailTest {

        @Test
        @DisplayName("성공 - 사용자 상세 조회")
        void getUserDetail_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.countByUserId(1L)).thenReturn(10);
            when(collectionRepository.countMintedByUserId(1L)).thenReturn(5);

            // When
            AdminDto.UserDetailResponse result = adminService.getUserDetail(1L);

            // Then
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getEmail()).isEqualTo("test@example.com");
            assertThat(result.getNftCount()).isEqualTo(10);
            assertThat(result.getMintedNftCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void getUserDetail_NotFound() {
            // Given
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminService.getUserDetail(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("updateUser 테스트")
    class UpdateUserTest {

        @Test
        @DisplayName("성공 - 역할 변경")
        void updateUser_ChangeRole() {
            // Given
            AdminDto.UpdateUserRequest request = AdminDto.UpdateUserRequest.builder()
                    .role("ADMIN")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(collectionRepository.countByUserId(anyLong())).thenReturn(0);

            // When
            AdminDto.UserManagement result = adminService.updateUser(1L, request);

            // Then
            assertThat(testUser.getRole()).isEqualTo(User.Role.ADMIN);
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("성공 - 활성화 상태 변경")
        void updateUser_ChangeActiveStatus() {
            // Given
            AdminDto.UpdateUserRequest request = AdminDto.UpdateUserRequest.builder()
                    .isActive(false)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(collectionRepository.countByUserId(anyLong())).thenReturn(0);

            // When
            adminService.updateUser(1L, request);

            // Then
            assertThat(testUser.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("성공 - 닉네임 변경")
        void updateUser_ChangeNickname() {
            // Given
            AdminDto.UpdateUserRequest request = AdminDto.UpdateUserRequest.builder()
                    .nickname("새닉네임")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(collectionRepository.countByUserId(anyLong())).thenReturn(0);

            // When
            adminService.updateUser(1L, request);

            // Then
            assertThat(testUser.getNickname()).isEqualTo("새닉네임");
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void updateUser_NotFound() {
            // Given
            AdminDto.UpdateUserRequest request = AdminDto.UpdateUserRequest.builder().build();
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminService.updateUser(999L, request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("getLocations 테스트")
    class GetLocationsTest {

        @Test
        @DisplayName("성공 - 장소 목록 조회")
        void getLocations_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<CollectibleLocation> locationPage = new PageImpl<>(List.of(testLocation));

            when(locationRepository.findLocationsForAdmin(any(), any(), any(), any(), any()))
                    .thenReturn(locationPage);
            when(collectionRepository.countByLocationId(anyLong())).thenReturn(50L);
            when(reviewRepository.countByLocationId(anyLong())).thenReturn(10L);
            when(reviewRepository.getAverageRatingByLocationId(anyLong())).thenReturn(4.2);

            // When
            Page<AdminDto.LocationManagement> result = adminService.getLocations(
                    null, null, null, null, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("테스트 장소");
            assertThat(result.getContent().get(0).getTotalCollections()).isEqualTo(50);
            assertThat(result.getContent().get(0).getTotalReviews()).isEqualTo(10);
            assertThat(result.getContent().get(0).getAverageRating()).isEqualTo(4.2);
        }
    }

    @Nested
    @DisplayName("getRecommendationFeedback 테스트")
    class GetRecommendationFeedbackTest {

        @Test
        @DisplayName("성공 - 추천 피드백 목록 필터링 및 응답 변환")
        void getRecommendationFeedback_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            RecommendationFeedback feedback = RecommendationFeedback.builder()
                    .id(500L)
                    .user(testUser)
                    .rating(2)
                    .comment("관련도가 낮습니다")
                    .feedbackType("MATCH")
                    .targetType("GROUP")
                    .targetId(100L)
                    .metadata("{\"modelVersion\":\"v1\"}")
                    .createdAt(LocalDateTime.now())
                    .build();
            Page<RecommendationFeedback> feedbackPage = new PageImpl<>(List.of(feedback));

            when(recommendationFeedbackRepository.findForAdmin(
                    eq(1L), eq(2), eq("MATCH"), eq("GROUP"), eq(pageable)))
                    .thenReturn(feedbackPage);

            // When
            Page<AdminDto.RecommendationFeedbackResponse> result = adminService.getRecommendationFeedback(
                    1L, 2, " MATCH ", " GROUP ", pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            AdminDto.RecommendationFeedbackResponse response = result.getContent().get(0);
            assertThat(response.getId()).isEqualTo(500L);
            assertThat(response.getUserId()).isEqualTo(1L);
            assertThat(response.getUserNickname()).isEqualTo("테스터");
            assertThat(response.getRating()).isEqualTo(2);
            assertThat(response.getFeedbackType()).isEqualTo("MATCH");
            assertThat(response.getTargetType()).isEqualTo("GROUP");
            assertThat(response.getMetadata()).contains("modelVersion");
        }

        @Test
        @DisplayName("실패 - rating 필터 범위 검증")
        void getRecommendationFeedback_InvalidRating() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);

            // When & Then
            assertThatThrownBy(() -> adminService.getRecommendationFeedback(null, 6, null, null, pageable))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("rating은 1부터 5 사이여야 합니다.");
            verifyNoInteractions(recommendationFeedbackRepository);
        }
    }

    @Nested
    @DisplayName("getRecommendationFeedbackStats 테스트")
    class GetRecommendationFeedbackStatsTest {

        @Test
        @DisplayName("성공 - 추천 피드백 통계 조회")
        void getRecommendationFeedbackStats_Success() {
            // Given
            when(recommendationFeedbackRepository.count()).thenReturn(10L);
            when(recommendationFeedbackRepository.getAverageRating()).thenReturn(3.4);
            when(recommendationFeedbackRepository.countByRating(1)).thenReturn(1L);
            when(recommendationFeedbackRepository.countByRating(2)).thenReturn(2L);
            when(recommendationFeedbackRepository.countByRating(3)).thenReturn(3L);
            when(recommendationFeedbackRepository.countByRating(4)).thenReturn(2L);
            when(recommendationFeedbackRepository.countByRating(5)).thenReturn(2L);
            when(recommendationFeedbackRepository.countByRatingLessThanEqual(2)).thenReturn(3L);
            when(recommendationFeedbackRepository.countByCreatedAtAfter(any())).thenReturn(4L);
            when(recommendationFeedbackRepository.countByFeedbackType())
                    .thenReturn(List.of(new Object[]{"MATCH", 6L}, new Object[]{"TRAVEL_TIP", 4L}));
            when(recommendationFeedbackRepository.countByTargetType())
                    .thenReturn(List.of(new Object[]{"GROUP", 7L}, new Object[]{"USER", 3L}));

            // When
            AdminDto.RecommendationFeedbackStats result = adminService.getRecommendationFeedbackStats();

            // Then
            assertThat(result.getTotalFeedback()).isEqualTo(10L);
            assertThat(result.getAverageRating()).isEqualTo(3.4);
            assertThat(result.getLowRatingCount()).isEqualTo(3L);
            assertThat(result.getFeedbackLast7Days()).isEqualTo(4L);
            assertThat(result.getRatingDistribution()).containsEntry(1, 1L).containsEntry(5, 2L);
            assertThat(result.getFeedbackTypeDistribution()).containsEntry("MATCH", 6L);
            assertThat(result.getTargetTypeDistribution()).containsEntry("GROUP", 7L);
        }

        @Test
        @DisplayName("성공 - 평균 평점이 null이면 0.0 반환")
        void getRecommendationFeedbackStats_NullAverageRating() {
            // Given
            when(recommendationFeedbackRepository.count()).thenReturn(0L);
            when(recommendationFeedbackRepository.getAverageRating()).thenReturn(null);
            when(recommendationFeedbackRepository.countByRating(anyInt())).thenReturn(0L);
            when(recommendationFeedbackRepository.countByRatingLessThanEqual(2)).thenReturn(0L);
            when(recommendationFeedbackRepository.countByCreatedAtAfter(any())).thenReturn(0L);
            when(recommendationFeedbackRepository.countByFeedbackType()).thenReturn(List.of());
            when(recommendationFeedbackRepository.countByTargetType()).thenReturn(List.of());

            // When
            AdminDto.RecommendationFeedbackStats result = adminService.getRecommendationFeedbackStats();

            // Then
            assertThat(result.getAverageRating()).isEqualTo(0.0);
            assertThat(result.getRatingDistribution()).containsOnlyKeys(1, 2, 3, 4, 5);
        }
    }

    @Nested
    @DisplayName("createLocation 테스트")
    class CreateLocationTest {

        @Test
        @DisplayName("성공 - 새 장소 생성")
        void createLocation_Success() {
            // Given
            AdminDto.CreateLocationRequest request = AdminDto.CreateLocationRequest.builder()
                    .name("새 장소")
                    .description("설명")
                    .region("부산")
                    .country("대한민국")
                    .category("LANDMARK")
                    .rarity("EPIC")
                    .latitude(35.1796)
                    .longitude(129.0756)
                    .collectRadius(100)
                    .basePoints(200)
                    .build();

            when(locationRepository.save(any(CollectibleLocation.class))).thenAnswer(inv -> {
                CollectibleLocation loc = inv.getArgument(0);
                loc.setId(200L);
                loc.setCreatedAt(LocalDateTime.now());
                return loc;
            });
            when(collectionRepository.countByLocationId(anyLong())).thenReturn(0L);
            when(reviewRepository.countByLocationId(anyLong())).thenReturn(0L);
            when(reviewRepository.getAverageRatingByLocationId(anyLong())).thenReturn(null);

            // When
            AdminDto.LocationManagement result = adminService.createLocation(request);

            // Then
            assertThat(result.getName()).isEqualTo("새 장소");
            assertThat(result.getRarity()).isEqualTo("EPIC");
            verify(locationRepository).save(any(CollectibleLocation.class));
        }

        @Test
        @DisplayName("성공 - 기본값 적용")
        void createLocation_DefaultValues() {
            // Given
            AdminDto.CreateLocationRequest request = AdminDto.CreateLocationRequest.builder()
                    .name("기본값 테스트")
                    .region("서울")
                    .country("대한민국")
                    .category("LANDMARK")
                    .rarity("COMMON")
                    .latitude(37.5)
                    .longitude(127.0)
                    .build();

            when(locationRepository.save(any(CollectibleLocation.class))).thenAnswer(inv -> {
                CollectibleLocation loc = inv.getArgument(0);
                loc.setId(201L);
                loc.setCreatedAt(LocalDateTime.now());
                return loc;
            });
            when(collectionRepository.countByLocationId(anyLong())).thenReturn(0L);
            when(reviewRepository.countByLocationId(anyLong())).thenReturn(0L);
            when(reviewRepository.getAverageRatingByLocationId(anyLong())).thenReturn(null);

            // When
            AdminDto.LocationManagement result = adminService.createLocation(request);

            // Then
            assertThat(result.getCollectRadius()).isEqualTo(50); // 기본값 50
        }
    }

    @Nested
    @DisplayName("updateLocation 테스트")
    class UpdateLocationTest {

        @Test
        @DisplayName("성공 - 장소 정보 수정")
        void updateLocation_Success() {
            // Given
            AdminDto.UpdateLocationRequest request = AdminDto.UpdateLocationRequest.builder()
                    .name("수정된 이름")
                    .rarity("LEGENDARY")
                    .isActive(false)
                    .build();

            when(locationRepository.findById(100L)).thenReturn(Optional.of(testLocation));
            when(locationRepository.save(any(CollectibleLocation.class))).thenReturn(testLocation);
            when(collectionRepository.countByLocationId(anyLong())).thenReturn(0L);
            when(reviewRepository.countByLocationId(anyLong())).thenReturn(0L);
            when(reviewRepository.getAverageRatingByLocationId(anyLong())).thenReturn(null);

            // When
            AdminDto.LocationManagement result = adminService.updateLocation(100L, request);

            // Then
            assertThat(testLocation.getName()).isEqualTo("수정된 이름");
            assertThat(testLocation.getRarity()).isEqualTo(Rarity.LEGENDARY);
            assertThat(testLocation.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("실패 - 장소 없음")
        void updateLocation_NotFound() {
            // Given
            AdminDto.UpdateLocationRequest request = AdminDto.UpdateLocationRequest.builder().build();
            when(locationRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminService.updateLocation(999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("장소를 찾을 수 없습니다")
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("deleteLocation 테스트")
    class DeleteLocationTest {

        @Test
        @DisplayName("성공 - 장소 소프트 삭제")
        void deleteLocation_Success() {
            // Given
            when(locationRepository.findById(100L)).thenReturn(Optional.of(testLocation));
            when(locationRepository.save(any(CollectibleLocation.class))).thenReturn(testLocation);

            // When
            adminService.deleteLocation(100L);

            // Then
            assertThat(testLocation.getIsActive()).isFalse();
            verify(locationRepository).save(testLocation);
        }

        @Test
        @DisplayName("실패 - 장소 없음")
        void deleteLocation_NotFound() {
            // Given
            when(locationRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminService.deleteLocation(999L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("bulkUserAction 테스트")
    class BulkUserActionTest {

        @Test
        @DisplayName("성공 - 일괄 활성화")
        void bulkUserAction_Activate() {
            // Given
            User user1 = new User();
            user1.setId(1L);
            user1.setIsActive(false);

            User user2 = new User();
            user2.setId(2L);
            user2.setIsActive(false);

            AdminDto.BulkActionRequest request = AdminDto.BulkActionRequest.builder()
                    .ids(Arrays.asList(1L, 2L))
                    .action("ACTIVATE")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
            when(userRepository.findById(2L)).thenReturn(Optional.of(user2));

            // When
            AdminDto.BulkActionResponse result = adminService.bulkUserAction(request);

            // Then
            assertThat(result.getSuccessCount()).isEqualTo(2);
            assertThat(result.getFailureCount()).isEqualTo(0);
            assertThat(user1.getIsActive()).isTrue();
            assertThat(user2.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("성공 - 일괄 비활성화")
        void bulkUserAction_Deactivate() {
            // Given
            User user1 = new User();
            user1.setId(1L);
            user1.setIsActive(true);

            AdminDto.BulkActionRequest request = AdminDto.BulkActionRequest.builder()
                    .ids(List.of(1L))
                    .action("DEACTIVATE")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

            // When
            AdminDto.BulkActionResponse result = adminService.bulkUserAction(request);

            // Then
            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(user1.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("부분 성공 - 일부 사용자 없음")
        void bulkUserAction_PartialSuccess() {
            // Given
            User user1 = new User();
            user1.setId(1L);
            user1.setIsActive(false);

            AdminDto.BulkActionRequest request = AdminDto.BulkActionRequest.builder()
                    .ids(Arrays.asList(1L, 999L))
                    .action("ACTIVATE")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When
            AdminDto.BulkActionResponse result = adminService.bulkUserAction(request);

            // Then
            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getFailedIds()).contains(999L);
        }

        @Test
        @DisplayName("실패 - 알 수 없는 액션")
        void bulkUserAction_UnknownAction() {
            // Given
            User user1 = new User();
            user1.setId(1L);

            AdminDto.BulkActionRequest request = AdminDto.BulkActionRequest.builder()
                    .ids(List.of(1L))
                    .action("UNKNOWN")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(user1));

            // When
            AdminDto.BulkActionResponse result = adminService.bulkUserAction(request);

            // Then
            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getFailedIds()).contains(1L);
        }
    }

    @Nested
    @DisplayName("getSystemHealth 테스트")
    class GetSystemHealthTest {

        @Test
        @DisplayName("성공 - 시스템 상태 조회")
        void getSystemHealth_Success() {
            // Given
            when(userRepository.count()).thenReturn(100L);

            // When
            AdminDto.SystemHealth result = adminService.getSystemHealth();

            // Then
            assertThat(result.getStatus()).isEqualTo("UP");
            assertThat(result.getUptime()).isGreaterThan(0);
            assertThat(result.getMemoryUsage()).isBetween(0.0, 100.0);
            assertThat(result.getServices()).containsKey("database");
            assertThat(result.getServices().get("database").getStatus()).isEqualTo("UP");
        }

        @Test
        @DisplayName("성공 - 데이터베이스 연결 실패 시")
        void getSystemHealth_DatabaseDown() {
            // Given
            when(userRepository.count()).thenThrow(new RuntimeException("DB connection failed"));

            // When
            AdminDto.SystemHealth result = adminService.getSystemHealth();

            // Then
            assertThat(result.getStatus()).isEqualTo("UP"); // 시스템 자체는 UP
            assertThat(result.getServices().get("database").getStatus()).isEqualTo("DOWN");
            assertThat(result.getServices().get("database").getMessage()).contains("DB connection failed");
        }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
