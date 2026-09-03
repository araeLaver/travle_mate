package com.travelmate.service;

import com.travelmate.dto.AuthDto;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.RefreshToken;
import com.travelmate.entity.User;
import com.travelmate.exception.UserException;
import com.travelmate.repository.RefreshTokenRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.UserTrustScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
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

    @Mock
    private UserTrustScoreRepository trustScoreRepository;

    @Mock
    private RestTemplate restTemplate;

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
        ReflectionTestUtils.setField(authService, "googleClientIds", "");
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

        @Test
        @DisplayName("실패 - 리프레시 토큰의 기기 정보가 다름")
        void refreshToken_Fail_DeviceMismatch() {
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

            // When & Then
            assertThatThrownBy(() -> authService.refreshToken(refreshTokenStr, "other-device-id"))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("기기");
            verify(jwtService, never()).generateToken(anyLong(), anyString());
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

    @Nested
    @DisplayName("OAuth 로그인 테스트")
    class OAuthLoginTest {

        @Test
        @DisplayName("성공 - 신규 Google 사용자는 provider와 providerId를 저장한다")
        void oauthLogin_NewGoogleUser_StoresProviderIdentity() {
            mockGoogleOAuth("google-123", "oauth@example.com", "OAuth User");
            when(userRepository.findByProviderAndProviderId(User.AuthProvider.GOOGLE, "google-123"))
                    .thenReturn(Optional.empty());
            when(userRepository.findByEmail("oauth@example.com")).thenReturn(Optional.empty());
            when(userRepository.existsByNickname("OAuthUser")).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encoded-random-password");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User saved = invocation.getArgument(0);
                saved.setId(10L);
                return saved;
            });
            when(jwtService.generateToken(10L, "oauth@example.com")).thenReturn("access-token");

            AuthDto.LoginResponse response = authService.oauthLogin(
                    oauthRequest("google-token"), IP_ADDRESS, USER_AGENT);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getProvider()).isEqualTo(User.AuthProvider.GOOGLE);
            assertThat(savedUser.getProviderId()).isEqualTo("google-123");
            assertThat(savedUser.getIsEmailVerified()).isTrue();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("성공 - provider/providerId가 일치하는 기존 OAuth 사용자를 우선 조회한다")
        void oauthLogin_ExistingProviderIdentity_DoesNotFallbackToEmail() {
            testUser.setProvider(User.AuthProvider.GOOGLE);
            testUser.setProviderId("google-123");
            mockGoogleOAuth("google-123", "oauth@example.com", "OAuth User");
            when(userRepository.findByProviderAndProviderId(User.AuthProvider.GOOGLE, "google-123"))
                    .thenReturn(Optional.of(testUser));
            when(jwtService.generateToken(1L, "test@example.com")).thenReturn("access-token");

            AuthDto.LoginResponse response = authService.oauthLogin(
                    oauthRequest("google-token"), IP_ADDRESS, USER_AGENT);

            assertThat(response.getAccessToken()).isEqualTo("access-token");
            verify(userRepository, never()).findByEmail(anyString());
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("성공 - 기존 로컬 이메일은 검증된 OAuth 식별자를 연결한다")
        void oauthLogin_ExistingLocalEmail_AttachesProviderIdentity() {
            testUser.setProvider(User.AuthProvider.LOCAL);
            testUser.setProviderId(null);
            testUser.setEmail("oauth@example.com");
            mockGoogleOAuth("google-123", "oauth@example.com", "OAuth User");
            when(userRepository.findByProviderAndProviderId(User.AuthProvider.GOOGLE, "google-123"))
                    .thenReturn(Optional.empty());
            when(userRepository.findByEmail("oauth@example.com")).thenReturn(Optional.of(testUser));
            when(userRepository.save(testUser)).thenReturn(testUser);
            when(jwtService.generateToken(1L, "oauth@example.com")).thenReturn("access-token");

            authService.oauthLogin(oauthRequest("google-token"), IP_ADDRESS, USER_AGENT);

            assertThat(testUser.getProvider()).isEqualTo(User.AuthProvider.GOOGLE);
            assertThat(testUser.getProviderId()).isEqualTo("google-123");
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("실패 - 다른 OAuth 제공자로 이미 연결된 이메일은 자동 전환하지 않는다")
        void oauthLogin_DifferentExistingProvider_Throws() {
            testUser.setProvider(User.AuthProvider.KAKAO);
            testUser.setProviderId("kakao-999");
            testUser.setEmail("oauth@example.com");
            mockGoogleOAuth("google-123", "oauth@example.com", "OAuth User");
            when(userRepository.findByProviderAndProviderId(User.AuthProvider.GOOGLE, "google-123"))
                    .thenReturn(Optional.empty());
            when(userRepository.findByEmail("oauth@example.com")).thenReturn(Optional.of(testUser));

            assertThatThrownBy(() -> authService.oauthLogin(oauthRequest("google-token"), IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("다른 OAuth 제공자");
        }

        @Test
        @DisplayName("실패 - 설정된 Google client id와 토큰 audience가 다르면 거부한다")
        void oauthLogin_GoogleAudienceMismatch_Throws() {
            ReflectionTestUtils.setField(authService, "googleClientIds", "expected-client-id");
            when(restTemplate.getForEntity(
                    org.mockito.ArgumentMatchers.contains("https://oauth2.googleapis.com/tokeninfo"),
                    eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of(
                            "expires_in", 3600,
                            "email", "oauth@example.com",
                            "audience", "different-client-id"
                    )));

            assertThatThrownBy(() -> authService.oauthLogin(oauthRequest("google-token"), IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("audience");
        }

        @Test
        @DisplayName("실패 - Google 이메일이 미검증이면 거부한다")
        void oauthLogin_GoogleUnverifiedEmail_Throws() {
            when(restTemplate.getForEntity(
                    org.mockito.ArgumentMatchers.contains("https://oauth2.googleapis.com/tokeninfo"),
                    eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of(
                            "expires_in", 3600,
                            "email", "oauth@example.com",
                            "verified_email", false
                    )));

            assertThatThrownBy(() -> authService.oauthLogin(oauthRequest("google-token"), IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("이메일");
        }

        @Test
        @DisplayName("실패 - Google 사용자 정보의 이메일이 미검증이면 거부한다")
        void oauthLogin_GoogleUserInfoUnverifiedEmail_Throws() {
            when(restTemplate.getForEntity(
                    org.mockito.ArgumentMatchers.contains("https://oauth2.googleapis.com/tokeninfo"),
                    eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of(
                            "expires_in", 3600,
                            "email", "oauth@example.com"
                    )));
            when(restTemplate.exchange(
                    eq("https://www.googleapis.com/oauth2/v2/userinfo"),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of(
                            "id", "google-123",
                            "email", "oauth@example.com",
                            "verified_email", false
                    )));

            assertThatThrownBy(() -> authService.oauthLogin(oauthRequest("google-token"), IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("이메일");
        }

        @Test
        @DisplayName("실패 - Google 토큰 정보와 사용자 정보가 다르면 거부한다")
        void oauthLogin_GoogleTokenAndUserInfoMismatch_Throws() {
            when(restTemplate.getForEntity(
                    org.mockito.ArgumentMatchers.contains("https://oauth2.googleapis.com/tokeninfo"),
                    eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of(
                            "expires_in", 3600,
                            "email", "token@example.com",
                            "user_id", "google-token-user"
                    )));
            when(restTemplate.exchange(
                    eq("https://www.googleapis.com/oauth2/v2/userinfo"),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of(
                            "id", "google-userinfo-user",
                            "email", "userinfo@example.com"
                    )));

            assertThatThrownBy(() -> authService.oauthLogin(oauthRequest("google-token"), IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("일치하지 않습니다");
        }

        private AuthDto.OAuthLoginRequest oauthRequest(String accessToken) {
            AuthDto.OAuthLoginRequest request = new AuthDto.OAuthLoginRequest();
            request.setProvider("google");
            request.setAccessToken(accessToken);
            request.setDeviceId(DEVICE_ID);
            request.setDeviceName(DEVICE_NAME);
            return request;
        }

        private void mockGoogleOAuth(String providerId, String email, String name) {
            when(restTemplate.getForEntity(
                    org.mockito.ArgumentMatchers.contains("https://oauth2.googleapis.com/tokeninfo"),
                    eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of(
                            "expires_in", 3600,
                            "email", email
                    )));
            when(restTemplate.exchange(
                    eq("https://www.googleapis.com/oauth2/v2/userinfo"),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of(
                            "id", providerId,
                            "email", email,
                            "name", name,
                            "picture", "https://example.com/profile.png"
                    )));
        }
    }
}
