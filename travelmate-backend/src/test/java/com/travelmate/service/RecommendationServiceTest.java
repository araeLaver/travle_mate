package com.travelmate.service;

import com.travelmate.dto.RecommendationDto;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.TravelGroup;
import com.travelmate.entity.User;
import com.travelmate.entity.User.TravelStyle;
import com.travelmate.entity.UserGroupMembership;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserGroupMembershipRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecommendationService 테스트")
class RecommendationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TravelGroupRepository travelGroupRepository;

    @Mock
    private UserGroupMembershipRepository membershipRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    private User testUser;
    private User nearbyUser;

    @BeforeEach
    void setUp() {
        testUser = createUser(1L, "test@example.com", "테스터", TravelStyle.ADVENTURE);
        testUser.setCurrentLatitude(37.5665);
        testUser.setCurrentLongitude(126.9780);
        testUser.setIsMatchingEnabled(true);
        testUser.setIsLocationEnabled(true);
        testUser.setIsActive(true);

        nearbyUser = createUser(2L, "nearby@example.com", "근처사용자", TravelStyle.NATURE);
        nearbyUser.setCurrentLatitude(37.5700);
        nearbyUser.setCurrentLongitude(126.9800);
        nearbyUser.setIsMatchingEnabled(true);
        nearbyUser.setIsLocationEnabled(true);
        nearbyUser.setIsActive(true);
    }

    private User createUser(Long id, String email, String nickname, TravelStyle style) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setNickname(nickname);
        user.setTravelStyle(style);
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    @Nested
    @DisplayName("getRecommendedUsers 테스트")
    class GetRecommendedUsersTest {

        @Test
        @DisplayName("성공 - 근처 사용자 추천")
        void getRecommendedUsers_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(10.0)))
                    .thenReturn(List.of(nearbyUser));

            // When
            List<UserDto.Response> result = recommendationService.getRecommendedUsers(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo(2L);
            assertThat(result.get(0).getNickname()).isEqualTo("근처사용자");

            // N+1 방지: findNearbyUsers가 한 번만 호출되었는지 확인
            verify(userRepository, times(1)).findNearbyUsers(anyLong(), anyDouble(), anyDouble(), anyDouble());
            verify(userRepository, never()).findAll();
        }

        @Test
        @DisplayName("위치 정보가 없으면 빈 목록 반환")
        void getRecommendedUsers_NoLocation() {
            // Given
            testUser.setCurrentLatitude(null);
            testUser.setCurrentLongitude(null);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            List<UserDto.Response> result = recommendationService.getRecommendedUsers(1L);

            // Then
            assertThat(result).isEmpty();
            verify(userRepository, never()).findNearbyUsers(anyLong(), anyDouble(), anyDouble(), anyDouble());
        }

        @Test
        @DisplayName("사용자를 찾을 수 없으면 예외 발생")
        void getRecommendedUsers_UserNotFound() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> recommendationService.getRecommendedUsers(1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("findNearbyTravelers 테스트")
    class FindNearbyTravelersTest {

        @Test
        @DisplayName("성공 - 지정된 반경 내 사용자 조회")
        void findNearbyTravelers_WithRadius() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(5.0)))
                    .thenReturn(List.of(nearbyUser));

            // When
            List<UserDto.Response> result = recommendationService.findNearbyTravelers(1L, 5);

            // Then
            assertThat(result).hasSize(1);
            verify(userRepository).findNearbyUsers(1L, 37.5665, 126.9780, 5.0);
        }

        @Test
        @DisplayName("기본 반경 10km 적용")
        void findNearbyTravelers_DefaultRadius() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(10.0)))
                    .thenReturn(List.of(nearbyUser));

            // When
            List<UserDto.Response> result = recommendationService.findNearbyTravelers(1L, null);

            // Then
            assertThat(result).hasSize(1);
            verify(userRepository).findNearbyUsers(1L, 37.5665, 126.9780, 10.0);
        }
    }

    @Nested
    @DisplayName("recommendGroups 테스트")
    class RecommendGroupsTest {

        private TravelGroup testGroup;
        private UserGroupMembership membership;

        @BeforeEach
        void setUp() {
            testGroup = new TravelGroup();
            testGroup.setId(100L);
            testGroup.setTitle("제주도 여행");
            testGroup.setDestination("제주도");
            testGroup.setDescription("자연을 즐기는 여행 그룹");
            testGroup.setTravelStyle(TravelStyle.NATURE);
            testGroup.setCurrentMembers(3);
            testGroup.setMaxMembers(10);
            testGroup.setCreatedAt(LocalDateTime.now().minusDays(5));

            membership = new UserGroupMembership();
            membership.setId(1L);
            membership.setUser(nearbyUser);
            membership.setTravelGroup(testGroup);
        }

        @Test
        @DisplayName("성공 - 그룹 추천 (N+1 최적화 확인)")
        void recommendGroups_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(travelGroupRepository.findAvailableGroupsForRecommendation())
                    .thenReturn(List.of(testGroup));
            when(membershipRepository.findJoinedGroupIdsByUserId(1L))
                    .thenReturn(Set.of()); // 가입한 그룹 없음
            when(membershipRepository.findByTravelGroupIdInWithUser(anySet()))
                    .thenReturn(List.of(membership));

            // When
            List<RecommendationDto.GroupRecommendation> result =
                    recommendationService.recommendGroups(1L, 10);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getGroupId()).isEqualTo(100L);
            assertThat(result.get(0).getGroupName()).isEqualTo("제주도 여행");
            assertThat(result.get(0).getRecommendationScore()).isGreaterThan(0);

            // N+1 방지: 배치 쿼리가 사용되었는지 확인
            verify(travelGroupRepository).findAvailableGroupsForRecommendation();
            verify(membershipRepository).findJoinedGroupIdsByUserId(1L);
            verify(membershipRepository).findByTravelGroupIdInWithUser(anySet());
            verify(travelGroupRepository, never()).findAll();
        }

        @Test
        @DisplayName("이미 가입한 그룹은 추천에서 제외")
        void recommendGroups_ExcludesJoinedGroups() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(travelGroupRepository.findAvailableGroupsForRecommendation())
                    .thenReturn(List.of(testGroup));
            when(membershipRepository.findJoinedGroupIdsByUserId(1L))
                    .thenReturn(Set.of(100L)); // 이미 가입

            // When
            List<RecommendationDto.GroupRecommendation> result =
                    recommendationService.recommendGroups(1L, 10);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("점수순으로 정렬")
        void recommendGroups_SortedByScore() {
            // Given
            TravelGroup group2 = new TravelGroup();
            group2.setId(101L);
            group2.setTitle("서울 관광");
            group2.setDestination("서울");
            group2.setTravelStyle(TravelStyle.ADVENTURE); // testUser와 동일 스타일
            group2.setCurrentMembers(5);
            group2.setMaxMembers(10);
            group2.setCreatedAt(LocalDateTime.now().minusDays(1));

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(travelGroupRepository.findAvailableGroupsForRecommendation())
                    .thenReturn(List.of(testGroup, group2));
            when(membershipRepository.findJoinedGroupIdsByUserId(1L))
                    .thenReturn(Set.of());
            when(membershipRepository.findByTravelGroupIdInWithUser(anySet()))
                    .thenReturn(List.of());

            // When
            List<RecommendationDto.GroupRecommendation> result =
                    recommendationService.recommendGroups(1L, 10);

            // Then
            assertThat(result).hasSize(2);
            // 점수가 높은 순으로 정렬되어야 함
            assertThat(result.get(0).getRecommendationScore())
                    .isGreaterThanOrEqualTo(result.get(1).getRecommendationScore());
        }
    }

    @Nested
    @DisplayName("recommendTravelMates 테스트")
    class RecommendTravelMatesTest {

        @Test
        @DisplayName("성공 - 위치 기반 동행자 추천")
        void recommendTravelMates_WithLocation() {
            // Given
            nearbyUser.setAge(30);
            nearbyUser.setInterests(List.of("HIKING", "PHOTOGRAPHY"));

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(50.0)))
                    .thenReturn(List.of(nearbyUser));

            // When
            List<RecommendationDto.UserRecommendation> result =
                    recommendationService.recommendTravelMates(1L, 10);

            // Then
            assertThat(result).isNotEmpty();
            verify(userRepository).findNearbyUsers(1L, 37.5665, 126.9780, 50.0);
            verify(userRepository, never()).findAll();
        }

        @Test
        @DisplayName("최소 점수(30점) 이하 제외")
        void recommendTravelMates_FiltersLowScores() {
            // Given
            User incompatibleUser = createUser(3L, "low@example.com", "비호환", TravelStyle.SHOPPING);
            incompatibleUser.setAge(70);
            incompatibleUser.setInterests(List.of());
            incompatibleUser.setCurrentLatitude(37.6);
            incompatibleUser.setCurrentLongitude(127.0);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(50.0)))
                    .thenReturn(List.of(nearbyUser, incompatibleUser));

            // When
            List<RecommendationDto.UserRecommendation> result =
                    recommendationService.recommendTravelMates(1L, 10);

            // Then
            // 점수가 30점 이상인 사용자만 포함
            for (RecommendationDto.UserRecommendation rec : result) {
                assertThat(rec.getRecommendationScore()).isGreaterThan(30);
            }
        }
    }

    @Nested
    @DisplayName("getTravelTips 테스트")
    class GetTravelTipsTest {

        @Test
        @DisplayName("목적지와 스타일에 따른 팁 제공")
        void getTravelTips_WithDestinationAndStyle() {
            // When
            List<Map<String, Object>> tips = recommendationService.getTravelTips("제주도", "ADVENTURE");

            // Then
            assertThat(tips).isNotEmpty();
            // 목적지 관련 팁 확인
            boolean hasDestinationTip = tips.stream()
                    .anyMatch(tip -> tip.get("content").toString().contains("제주도"));
            assertThat(hasDestinationTip).isTrue();
        }

        @Test
        @DisplayName("목적지만 제공된 경우")
        void getTravelTips_OnlyDestination() {
            // When
            List<Map<String, Object>> tips = recommendationService.getTravelTips("서울", null);

            // Then
            assertThat(tips).isNotEmpty();
            assertThat(tips).hasSizeGreaterThanOrEqualTo(3); // 교통, 날씨, 음식 팁
        }

        @Test
        @DisplayName("정보 없이 기본 팁 제공")
        void getTravelTips_DefaultTips() {
            // When
            List<Map<String, Object>> tips = recommendationService.getTravelTips(null, null);

            // Then
            assertThat(tips).isNotEmpty();
            assertThat(tips.get(0)).containsKey("category");
            assertThat(tips.get(0)).containsKey("content");
        }
    }
}
