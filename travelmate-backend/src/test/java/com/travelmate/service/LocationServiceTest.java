package com.travelmate.service;

import com.travelmate.dto.UserDto;
import com.travelmate.entity.User;
import com.travelmate.entity.User.TravelStyle;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
@DisplayName("LocationService 테스트")
class LocationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private LocationService locationService;

    private User testUser;
    private User nearbyUser;

    @BeforeEach
    void setUp() {
        testUser = createUser(1L, "test@example.com", "테스터", TravelStyle.ADVENTURE);
        testUser.setCurrentLatitude(37.5665);
        testUser.setCurrentLongitude(126.9780);
        testUser.setIsMatchingEnabled(true);
        testUser.setIsLocationEnabled(true);

        nearbyUser = createUser(2L, "nearby@example.com", "근처사용자", TravelStyle.NATURE);
        nearbyUser.setCurrentLatitude(37.5700);
        nearbyUser.setCurrentLongitude(126.9800);
        nearbyUser.setIsMatchingEnabled(true);
        nearbyUser.setIsLocationEnabled(true);
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
    @DisplayName("processShakeEvent 테스트")
    class ProcessShakeEventTest {

        @Test
        @DisplayName("강한 흔들기 - 근처 사용자 발견 시 알림 전송")
        void processShakeEvent_StrongShake_FindsNearbyUsers() {
            // Given
            UserDto.ShakeRequest request = new UserDto.ShakeRequest();
            request.setUserId(1L);
            request.setLatitude(37.5665);
            request.setLongitude(126.9780);
            request.setAccelerationX(10.0);
            request.setAccelerationY(10.0);
            request.setAccelerationZ(10.0); // 강도 ≈ 17.3

            when(userRepository.findUsersForShake(anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(List.of(nearbyUser));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            locationService.processShakeEvent(request);

            // Then
            verify(notificationService).sendMatchingNotification(
                    eq(nearbyUser.getId()),
                    eq(testUser.getId()),
                    eq(testUser.getNickname())
            );
            verify(notificationService).sendNotification(eq(1L), contains("1명"));
        }

        @Test
        @DisplayName("약한 흔들기 - 강도 15 미만이면 검색하지 않음")
        void processShakeEvent_WeakShake_NoSearch() {
            // Given
            UserDto.ShakeRequest request = new UserDto.ShakeRequest();
            request.setUserId(1L);
            request.setLatitude(37.5665);
            request.setLongitude(126.9780);
            request.setAccelerationX(5.0);
            request.setAccelerationY(5.0);
            request.setAccelerationZ(5.0); // 강도 ≈ 8.66

            // When
            locationService.processShakeEvent(request);

            // Then
            verify(userRepository, never()).findUsersForShake(anyDouble(), anyDouble(), anyDouble());
            verify(notificationService, never()).sendMatchingNotification(anyLong(), anyLong(), anyString());
        }

        @Test
        @DisplayName("흔들기 강도에 따라 검색 반경이 조정됨")
        void processShakeEvent_RadiusAdjustedByIntensity() {
            // Given - 강도 20 (sqrt(400) = 20)
            UserDto.ShakeRequest request = new UserDto.ShakeRequest();
            request.setUserId(1L);
            request.setLatitude(37.5665);
            request.setLongitude(126.9780);
            request.setAccelerationX(11.5);
            request.setAccelerationY(11.5);
            request.setAccelerationZ(11.5); // 강도 ≈ 20

            when(userRepository.findUsersForShake(anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(List.of());

            // When
            locationService.processShakeEvent(request);

            // Then - 강도 ≈ 19.9 -> 반경 ≈ 0.99km, 최대 10km 제한
            ArgumentCaptor<Double> radiusCaptor = ArgumentCaptor.forClass(Double.class);
            verify(userRepository).findUsersForShake(anyDouble(), anyDouble(), radiusCaptor.capture());
            assertThat(radiusCaptor.getValue()).isBetween(0.9, 10.0);
        }

        @Test
        @DisplayName("근처에 아무도 없으면 알림 전송 안함")
        void processShakeEvent_NoNearbyUsers() {
            // Given
            UserDto.ShakeRequest request = new UserDto.ShakeRequest();
            request.setUserId(1L);
            request.setLatitude(37.5665);
            request.setLongitude(126.9780);
            request.setAccelerationX(10.0);
            request.setAccelerationY(10.0);
            request.setAccelerationZ(10.0);

            when(userRepository.findUsersForShake(anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(List.of());

            // When
            locationService.processShakeEvent(request);

            // Then
            verify(notificationService, never()).sendMatchingNotification(anyLong(), anyLong(), anyString());
            verify(notificationService, never()).sendNotification(anyLong(), anyString());
        }
    }

    @Nested
    @DisplayName("getSmartRecommendations 테스트")
    class GetSmartRecommendationsTest {

        @Test
        @DisplayName("성공 - 호환되는 스타일의 근처 사용자 추천")
        void getSmartRecommendations_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(5.0)))
                    .thenReturn(List.of(nearbyUser));

            // When
            List<UserDto.Response> result = locationService.getSmartRecommendations(
                    1L, 37.5665, 126.9780);

            // Then
            assertThat(result).isNotEmpty();
            // ADVENTURE와 NATURE는 호환됨
            assertThat(result).extracting(UserDto.Response::getId).contains(2L);
        }

        @Test
        @DisplayName("호환되지 않는 스타일 필터링")
        void getSmartRecommendations_FiltersIncompatibleStyles() {
            // Given
            User shoppingUser = createUser(3L, "shopping@example.com", "쇼핑러버", TravelStyle.SHOPPING);
            shoppingUser.setCurrentLatitude(37.5680);
            shoppingUser.setCurrentLongitude(126.9790);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(5.0)))
                    .thenReturn(List.of(nearbyUser, shoppingUser));

            // When
            List<UserDto.Response> result = locationService.getSmartRecommendations(
                    1L, 37.5665, 126.9780);

            // Then
            // ADVENTURE와 SHOPPING은 호환되지 않음
            assertThat(result).extracting(UserDto.Response::getId).contains(2L);
            assertThat(result).extracting(UserDto.Response::getId).doesNotContain(3L);
        }

        @Test
        @DisplayName("최대 20명까지만 추천")
        void getSmartRecommendations_LimitsTo20() {
            // Given
            List<User> manyUsers = new java.util.ArrayList<>();
            for (int i = 2; i <= 30; i++) {
                User user = createUser((long) i, "user" + i + "@example.com", "사용자" + i, TravelStyle.NATURE);
                manyUsers.add(user);
            }

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(5.0)))
                    .thenReturn(manyUsers);

            // When
            List<UserDto.Response> result = locationService.getSmartRecommendations(
                    1L, 37.5665, 126.9780);

            // Then
            assertThat(result).hasSize(20);
        }

        @Test
        @DisplayName("사용자를 찾을 수 없으면 예외 발생")
        void getSmartRecommendations_UserNotFound() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> locationService.getSmartRecommendations(1L, 37.5665, 126.9780))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다")
                    .satisfies(ex -> {
                        BusinessException businessException = (BusinessException) ex;
                        assertThat(businessException.getStatus().value()).isEqualTo(404);
                        assertThat(businessException.getErrorCodeStr()).isEqualTo("USER_NOT_FOUND");
                    });
        }
    }

    @Nested
    @DisplayName("updateLocationWithContext 테스트")
    class UpdateLocationWithContextTest {

        @Test
        @DisplayName("성공 - 위치 업데이트")
        void updateLocationWithContext_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            locationService.updateLocationWithContext(1L, 37.5700, 126.9800, "일반 위치");

            // Then
            assertThat(testUser.getCurrentLatitude()).isEqualTo(37.5700);
            assertThat(testUser.getCurrentLongitude()).isEqualTo(126.9800);
            assertThat(testUser.getIsLocationEnabled()).isTrue();
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("핫스팟 위치 - 공항")
        void updateLocationWithContext_AirportHotspot() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(0.5)))
                    .thenReturn(List.of(nearbyUser));

            // When
            locationService.updateLocationWithContext(1L, 37.5700, 126.9800, "인천공항");

            // Then
            verify(notificationService).sendNotification(eq(1L), contains("인천공항"));
            verify(notificationService).sendLocationShareNotification(
                    eq(1L), eq(37.5700), eq(126.9800), eq("인천공항"));
        }

        @Test
        @DisplayName("핫스팟 위치 - 역")
        void updateLocationWithContext_StationHotspot() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(0.5)))
                    .thenReturn(List.of(nearbyUser));

            // When
            locationService.updateLocationWithContext(1L, 37.5700, 126.9800, "서울역");

            // Then
            verify(notificationService).sendNotification(eq(1L), contains("서울역"));
        }

        @Test
        @DisplayName("핫스팟 위치 - 관광지")
        void updateLocationWithContext_TouristSpotHotspot() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(0.5)))
                    .thenReturn(List.of(nearbyUser));

            // When
            locationService.updateLocationWithContext(1L, 37.5700, 126.9800, "경복궁 관광지");

            // Then
            verify(notificationService).sendNotification(eq(1L), contains("경복궁 관광지"));
        }

        @Test
        @DisplayName("일반 위치 - 핫스팟 매칭 안함")
        void updateLocationWithContext_NonHotspot() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            locationService.updateLocationWithContext(1L, 37.5700, 126.9800, "집");

            // Then
            verify(notificationService, never()).sendNotification(anyLong(), anyString());
            verify(notificationService, never()).sendLocationShareNotification(
                    anyLong(), anyDouble(), anyDouble(), anyString());
        }

        @Test
        @DisplayName("null 컨텍스트 - 핫스팟 매칭 안함")
        void updateLocationWithContext_NullContext() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            locationService.updateLocationWithContext(1L, 37.5700, 126.9800, null);

            // Then
            verify(notificationService, never()).sendNotification(anyLong(), anyString());
        }

        @Test
        @DisplayName("핫스팟이지만 주변에 아무도 없음")
        void updateLocationWithContext_HotspotNoNearbyUsers() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(0.5)))
                    .thenReturn(List.of());

            // When
            locationService.updateLocationWithContext(1L, 37.5700, 126.9800, "인천공항");

            // Then
            verify(notificationService, never()).sendNotification(anyLong(), anyString());
        }

        @Test
        @DisplayName("사용자를 찾을 수 없으면 예외 발생")
        void updateLocationWithContext_UserNotFound() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> locationService.updateLocationWithContext(
                    1L, 37.5700, 126.9800, "서울역"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("핫스팟 키워드 테스트")
    class HotspotKeywordsTest {

        @Test
        @DisplayName("다양한 핫스팟 키워드 인식")
        void variousHotspotKeywords() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), eq(0.5)))
                    .thenReturn(List.of(nearbyUser));

            String[] hotspots = {"공항", "역", "터미널", "관광지", "명소", "박물관", "궁궐", "타워"};

            for (String hotspot : hotspots) {
                // When
                locationService.updateLocationWithContext(1L, 37.5700, 126.9800, "테스트 " + hotspot);

                // Then
                verify(notificationService, atLeastOnce()).sendNotification(eq(1L), contains(hotspot));
            }
        }
    }
}
