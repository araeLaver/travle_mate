package com.travelmate.service;

import com.travelmate.dto.PushNotificationDto;
import com.travelmate.entity.DeviceToken;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.DeviceTokenRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FcmService 테스트")
class FcmServiceTest {

    @Mock
    private DeviceTokenRepository deviceTokenRepository;

    @Mock
    private UserRepository userRepository;

    private FcmService fcmService;
    private User user;

    @BeforeEach
    void setUp() {
        fcmService = new FcmService(null, deviceTokenRepository, userRepository);

        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setNickname("tester");
        user.setEmailNotificationEnabled(true);
        user.setPushNotificationEnabled(false);
    }

    @Test
    @DisplayName("실패 - 토큰 등록 사용자 없음")
    void registerToken_UserNotFound() {
        // Given
        PushNotificationDto.RegisterTokenRequest request = PushNotificationDto.RegisterTokenRequest.builder()
                .token("token-1")
                .deviceType(DeviceToken.DeviceType.IOS)
                .build();
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> fcmService.registerToken(999L, request))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
    }

    @Test
    @DisplayName("성공 - 사용자 전역 알림 설정을 preference 응답으로 매핑")
    void getPreferences_MapsUserGlobalPreferences() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // When
        PushNotificationDto.NotificationPreferences preferences = fcmService.getPreferences(1L);

        // Then
        assertThat(preferences.isEmail()).isTrue();
        assertThat(preferences.isPush()).isFalse();
        assertThat(preferences.isFollow()).isFalse();
        assertThat(preferences.isMessage()).isFalse();
    }

    @Test
    @DisplayName("실패 - 알림 설정 조회 사용자 없음")
    void getPreferences_UserNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> fcmService.getPreferences(999L))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
    }

    @Test
    @DisplayName("성공 - email/push 설정만 저장")
    void updatePreferences_UpdatesPersistedGlobalPreferences() {
        // Given
        PushNotificationDto.UpdateNotificationPreferencesRequest request =
                PushNotificationDto.UpdateNotificationPreferencesRequest.builder()
                        .email(false)
                        .push(true)
                        .message(false)
                        .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        // When
        PushNotificationDto.NotificationPreferences preferences = fcmService.updatePreferences(1L, request);

        // Then
        assertThat(user.getEmailNotificationEnabled()).isFalse();
        assertThat(user.getPushNotificationEnabled()).isTrue();
        assertThat(preferences.isEmail()).isFalse();
        assertThat(preferences.isPush()).isTrue();
        assertThat(preferences.isMessage()).isTrue();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("실패 - 알림 설정 수정 사용자 없음")
    void updatePreferences_UserNotFound() {
        // Given
        PushNotificationDto.UpdateNotificationPreferencesRequest request =
                PushNotificationDto.UpdateNotificationPreferencesRequest.builder()
                        .email(false)
                        .push(true)
                        .build();
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> fcmService.updatePreferences(999L, request))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertBusinessException(ex, 404, "USER_NOT_FOUND"));
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
