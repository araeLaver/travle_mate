package com.travelmate.service;

import com.travelmate.dto.AuthDto;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.RefreshToken;
import com.travelmate.entity.User;
import com.travelmate.exception.UserException;
import com.travelmate.repository.RefreshTokenRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 테스트")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private UserDto.LoginRequest loginRequest;

    // 테스트용 상수
    private static final String DEVICE_ID = "test-device-id";
    private static final String DEVICE_NAME = "Test Device";
    private static final String IP_ADDRESS = "127.0.0.1";
    private static final String USER_AGENT = "Test-Agent/1.0";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setNickname("testuser");
        testUser.setFullName("테스트 사용자");
        testUser.setIsActive(true);
        testUser.setIsEmailVerified(true);

        loginRequest = new UserDto.LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        // JWT 만료 시간 설정
        ReflectionTestUtils.setField(authService, "jwtExpiration", 3600000L);
        ReflectionTestUtils.setField(authService, "refreshExpiration", 604800000L);
    }

    @Nested
    @DisplayName("로그인 테스트")
    class LoginTest {

        @Test
        @DisplayName("성공 - 정상적인 로그인")
        void login_Success() {
            // Given
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
            when(jwtService.generateToken(anyLong(), anyString())).thenReturn("accessToken");

            // When
            AuthDto.LoginResponse response = authService.login(loginRequest, DEVICE_ID, DEVICE_NAME, IP_ADDRESS, USER_AGENT);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("accessToken");
            assertThat(response.getRefreshToken()).isNotNull();
            assertThat(response.getUser().getId()).isEqualTo(testUser.getId());
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 사용자")
        void login_Fail_UserNotFound() {
            // Given
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest, DEVICE_ID, DEVICE_NAME, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 잘못된 비밀번호")
        void login_Fail_WrongPassword() {
            // Given
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest, DEVICE_ID, DEVICE_NAME, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("비밀번호");
        }
    }

    @Nested
    @DisplayName("토큰 갱신 테스트")
    class RefreshTokenTest {

        @Test
        @DisplayName("성공 - 토큰 갱신")
        void refreshToken_Success() {
            // Given
            String refreshTokenStr = "validRefreshToken";
            RefreshToken storedToken = RefreshToken.builder()
                    .token(refreshTokenStr)
                    .user(testUser)
                    .deviceId(DEVICE_ID)
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .isRevoked(false)
                    .build();

            when(refreshTokenRepository.findByToken(refreshTokenStr)).thenReturn(Optional.of(storedToken));
            when(jwtService.generateToken(anyLong(), anyString())).thenReturn("newAccessToken");

            // When
            AuthDto.TokenResponse response = authService.refreshToken(refreshTokenStr, DEVICE_ID);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("newAccessToken");
            assertThat(response.getRefreshToken()).isEqualTo(refreshTokenStr);
            verify(refreshTokenRepository).save(storedToken);
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 리프레시 토큰")
        void refreshToken_Fail_TokenNotFound() {
            // Given
            String refreshToken = "invalidToken";
            when(refreshTokenRepository.findByToken(refreshToken)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> authService.refreshToken(refreshToken, DEVICE_ID))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("유효하지 않은");
        }

        @Test
        @DisplayName("실패 - 만료된 리프레시 토큰")
        void refreshToken_Fail_ExpiredToken() {
            // Given
            String refreshTokenStr = "expiredToken";
            RefreshToken expiredToken = RefreshToken.builder()
                    .token(refreshTokenStr)
                    .user(testUser)
                    .deviceId(DEVICE_ID)
                    .expiresAt(LocalDateTime.now().minusDays(1))  // 만료됨
                    .isRevoked(false)
                    .build();

            when(refreshTokenRepository.findByToken(refreshTokenStr)).thenReturn(Optional.of(expiredToken));

            // When & Then
            assertThatThrownBy(() -> authService.refreshToken(refreshTokenStr, DEVICE_ID))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("만료");
        }

        @Test
        @DisplayName("실패 - 취소된 리프레시 토큰")
        void refreshToken_Fail_RevokedToken() {
            // Given
            String refreshTokenStr = "revokedToken";
            RefreshToken revokedToken = RefreshToken.builder()
                    .token(refreshTokenStr)
                    .user(testUser)
                    .deviceId(DEVICE_ID)
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .isRevoked(true)  // 취소됨
                    .build();

            when(refreshTokenRepository.findByToken(refreshTokenStr)).thenReturn(Optional.of(revokedToken));

            // When & Then
            assertThatThrownBy(() -> authService.refreshToken(refreshTokenStr, DEVICE_ID))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("취소");
        }
    }

    @Nested
    @DisplayName("로그아웃 테스트")
    class LogoutTest {

        @Test
        @DisplayName("성공 - 특정 기기 로그아웃")
        void logout_Success_SingleDevice() {
            // Given
            String refreshTokenStr = "validRefreshToken";
            RefreshToken storedToken = RefreshToken.builder()
                    .token(refreshTokenStr)
                    .user(testUser)
                    .deviceId(DEVICE_ID)
                    .isRevoked(false)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(refreshTokenRepository.findByToken(refreshTokenStr)).thenReturn(Optional.of(storedToken));

            // When
            authService.logout(1L, refreshTokenStr, false);

            // Then
            verify(refreshTokenRepository).save(storedToken);
            assertThat(storedToken.getIsRevoked()).isTrue();
        }

        @Test
        @DisplayName("성공 - 모든 기기 로그아웃")
        void logout_Success_AllDevices() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            authService.logout(1L, null, true);

            // Then
            verify(refreshTokenRepository).revokeAllByUser(testUser);
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 사용자")
        void logout_Fail_UserNotFound() {
            // Given
            when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> authService.logout(999L, "token", false))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("찾을 수 없습니다");
        }
    }
}
