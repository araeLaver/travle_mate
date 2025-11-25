package com.travelmate.service;

import com.travelmate.dto.AuthDto;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private AuthDto.RegisterRequest registerRequest;
    private AuthDto.LoginRequest loginRequest;

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

        registerRequest = new AuthDto.RegisterRequest();
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("Password1!");
        registerRequest.setNickname("newuser");
        registerRequest.setFullName("새 사용자");

        loginRequest = new AuthDto.LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");
    }

    @Nested
    @DisplayName("회원가입 테스트")
    class RegisterTest {

        @Test
        @DisplayName("성공 - 정상적인 회원가입")
        void register_Success() {
            // Given
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.existsByNickname(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(1L);
                return user;
            });
            when(jwtService.generateToken(anyLong(), anyString())).thenReturn("accessToken");
            when(jwtService.generateRefreshToken(anyLong(), anyString())).thenReturn("refreshToken");
            when(emailService.sendVerificationEmail(anyString(), anyString())).thenReturn("token");

            // When
            AuthDto.AuthResponse response = authService.register(registerRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("accessToken");
            assertThat(response.getUser().getEmail()).isEqualTo(registerRequest.getEmail());
            verify(userRepository).save(any(User.class));
            verify(emailService).sendVerificationEmail(anyString(), anyString());
        }

        @Test
        @DisplayName("실패 - 이미 존재하는 이메일")
        void register_Fail_DuplicateEmail() {
            // Given
            when(userRepository.existsByEmail(anyString())).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> authService.register(registerRequest))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("이메일");
        }

        @Test
        @DisplayName("실패 - 이미 존재하는 닉네임")
        void register_Fail_DuplicateNickname() {
            // Given
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.existsByNickname(anyString())).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> authService.register(registerRequest))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("닉네임");
        }
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
            when(jwtService.generateRefreshToken(anyLong(), anyString())).thenReturn("refreshToken");

            // When
            AuthDto.AuthResponse response = authService.login(loginRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("accessToken");
            assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
            assertThat(response.getUser().getId()).isEqualTo(testUser.getId());
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 사용자")
        void login_Fail_UserNotFound() {
            // Given
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(UserException.class);
        }

        @Test
        @DisplayName("실패 - 잘못된 비밀번호")
        void login_Fail_WrongPassword() {
            // Given
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("비밀번호");
        }

        @Test
        @DisplayName("실패 - 비활성화된 계정")
        void login_Fail_InactiveAccount() {
            // Given
            testUser.setIsActive(false);
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("비활성화");
        }
    }

    @Nested
    @DisplayName("토큰 갱신 테스트")
    class RefreshTokenTest {

        @Test
        @DisplayName("성공 - 토큰 갱신")
        void refreshToken_Success() {
            // Given
            String refreshToken = "validRefreshToken";
            RefreshToken storedToken = new RefreshToken();
            storedToken.setToken(refreshToken);
            storedToken.setUser(testUser);

            when(jwtService.validateToken(refreshToken)).thenReturn(true);
            when(jwtService.extractUserId(refreshToken)).thenReturn(1L);
            when(refreshTokenRepository.findByToken(refreshToken)).thenReturn(Optional.of(storedToken));
            when(jwtService.generateToken(anyLong(), anyString())).thenReturn("newAccessToken");

            // When
            AuthDto.TokenResponse response = authService.refreshToken(refreshToken);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("newAccessToken");
        }

        @Test
        @DisplayName("실패 - 유효하지 않은 리프레시 토큰")
        void refreshToken_Fail_InvalidToken() {
            // Given
            String refreshToken = "invalidToken";
            when(jwtService.validateToken(refreshToken)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> authService.refreshToken(refreshToken))
                    .isInstanceOf(UserException.class);
        }
    }

    @Nested
    @DisplayName("이메일 중복 확인 테스트")
    class CheckEmailTest {

        @Test
        @DisplayName("이메일 사용 가능")
        void checkEmail_Available() {
            // Given
            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);

            // When
            boolean exists = authService.checkEmailDuplicate("new@example.com");

            // Then
            assertThat(exists).isFalse();
        }

        @Test
        @DisplayName("이메일 이미 존재")
        void checkEmail_Duplicate() {
            // Given
            when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

            // When
            boolean exists = authService.checkEmailDuplicate("existing@example.com");

            // Then
            assertThat(exists).isTrue();
        }
    }
}
