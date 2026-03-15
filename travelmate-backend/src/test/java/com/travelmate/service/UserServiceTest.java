package com.travelmate.service;

import com.travelmate.dto.UserDto;
import com.travelmate.entity.Report;
import com.travelmate.entity.User;
import com.travelmate.entity.User.TravelStyle;
import com.travelmate.entity.UserReview;
import com.travelmate.exception.UserException;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.UserReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService 테스트")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserReviewRepository userReviewRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private ReportService reportService;

    @Mock
    private BetaInviteService betaInviteService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDto.RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setNickname("테스터");
        testUser.setTravelStyle(TravelStyle.ADVENTURE);
        testUser.setIsActive(true);
        testUser.setCreatedAt(LocalDateTime.now());

        registerRequest = new UserDto.RegisterRequest();
        registerRequest.setEmail("new@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setNickname("새사용자");
        registerRequest.setPhoneNumber("010-1234-5678");
        registerRequest.setTravelStyle(TravelStyle.CULTURE);
    }

    @Nested
    @DisplayName("registerUser 테스트")
    class RegisterUserTest {

        @Test
        @DisplayName("성공 - 새 사용자 등록")
        void registerUser_Success() {
            // Given
            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(userRepository.existsByNickname("새사용자")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User user = inv.getArgument(0);
                user.setId(1L);
                return user;
            });

            // When
            UserDto.Response response = userService.registerUser(registerRequest);

            // Then
            assertThat(response.getEmail()).isEqualTo("new@example.com");
            assertThat(response.getNickname()).isEqualTo("새사용자");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());

            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getPassword()).isEqualTo("encodedPassword");
            assertThat(savedUser.getIsActive()).isTrue();
            assertThat(savedUser.getPasswordChangedAt()).isNotNull();

            verify(emailService).sendVerificationEmail(eq("new@example.com"), any());
        }

        @Test
        @DisplayName("실패 - 이미 존재하는 이메일")
        void registerUser_DuplicateEmail() {
            // Given
            when(userRepository.existsByEmail("new@example.com")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> userService.registerUser(registerRequest))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("이미 존재하는 이메일");
        }

        @Test
        @DisplayName("실패 - 이미 존재하는 닉네임")
        void registerUser_DuplicateNickname() {
            // Given
            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(userRepository.existsByNickname("새사용자")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> userService.registerUser(registerRequest))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("이미 존재하는 닉네임");
        }
    }

    @Nested
    @DisplayName("loginUser 테스트")
    class LoginUserTest {

        @Test
        @DisplayName("성공 - 로그인")
        void loginUser_Success() {
            // Given
            UserDto.LoginRequest loginRequest = new UserDto.LoginRequest();
            loginRequest.setEmail("test@example.com");
            loginRequest.setPassword("password123");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
            when(jwtService.generateToken(1L, "test@example.com")).thenReturn("jwt-token");

            // When
            UserDto.LoginResponse response = userService.loginUser(loginRequest);

            // Then
            assertThat(response.getToken()).isEqualTo("jwt-token");
            assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void loginUser_UserNotFound() {
            // Given
            UserDto.LoginRequest loginRequest = new UserDto.LoginRequest();
            loginRequest.setEmail("notfound@example.com");
            loginRequest.setPassword("password123");

            when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> userService.loginUser(loginRequest))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 비밀번호 불일치")
        void loginUser_WrongPassword() {
            // Given
            UserDto.LoginRequest loginRequest = new UserDto.LoginRequest();
            loginRequest.setEmail("test@example.com");
            loginRequest.setPassword("wrongPassword");

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> userService.loginUser(loginRequest))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("비밀번호가 일치하지 않습니다");
        }
    }

    @Nested
    @DisplayName("getUserProfile 테스트")
    class GetUserProfileTest {

        @Test
        @DisplayName("성공 - 프로필 조회")
        void getUserProfile_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            UserDto.Response response = userService.getUserProfile(1L);

            // Then
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getEmail()).isEqualTo("test@example.com");
            assertThat(response.getNickname()).isEqualTo("테스터");
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void getUserProfile_UserNotFound() {
            // Given
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> userService.getUserProfile(999L))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("updateUserLocation 테스트")
    class UpdateUserLocationTest {

        @Test
        @DisplayName("성공 - 위치 업데이트")
        void updateUserLocation_Success() {
            // Given
            UserDto.LocationUpdateRequest request = new UserDto.LocationUpdateRequest();
            request.setUserId(1L);
            request.setLatitude(37.5665);
            request.setLongitude(126.9780);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            userService.updateUserLocation(request);

            // Then
            assertThat(testUser.getCurrentLatitude()).isEqualTo(37.5665);
            assertThat(testUser.getCurrentLongitude()).isEqualTo(126.9780);
            assertThat(testUser.getIsLocationEnabled()).isTrue();
            verify(userRepository).save(testUser);
        }
    }

    @Nested
    @DisplayName("updateUserProfile 테스트")
    class UpdateUserProfileTest {

        @Test
        @DisplayName("성공 - 프로필 업데이트")
        void updateUserProfile_Success() {
            // Given
            UserDto.UpdateProfileRequest request = new UserDto.UpdateProfileRequest();
            request.setNickname("새닉네임");
            request.setBio("새 자기소개");
            request.setTravelStyle(TravelStyle.FOOD);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.existsByNickname("새닉네임")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            UserDto.Response response = userService.updateUserProfile(1L, request);

            // Then
            assertThat(testUser.getNickname()).isEqualTo("새닉네임");
            assertThat(testUser.getBio()).isEqualTo("새 자기소개");
            assertThat(testUser.getTravelStyle()).isEqualTo(TravelStyle.FOOD);
        }

        @Test
        @DisplayName("실패 - 중복 닉네임")
        void updateUserProfile_DuplicateNickname() {
            // Given
            UserDto.UpdateProfileRequest request = new UserDto.UpdateProfileRequest();
            request.setNickname("중복닉네임");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.existsByNickname("중복닉네임")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> userService.updateUserProfile(1L, request))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("이미 존재하는 닉네임");
        }

        @Test
        @DisplayName("동일한 닉네임은 중복 체크하지 않음")
        void updateUserProfile_SameNickname() {
            // Given
            UserDto.UpdateProfileRequest request = new UserDto.UpdateProfileRequest();
            request.setNickname("테스터"); // 기존 닉네임과 동일

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            userService.updateUserProfile(1L, request);

            // Then
            verify(userRepository, never()).existsByNickname(anyString());
        }
    }

    @Nested
    @DisplayName("verifyEmail 테스트")
    class VerifyEmailTest {

        @Test
        @DisplayName("성공 - 이메일 인증")
        void verifyEmail_Success() {
            // Given
            when(emailService.getEmailByToken("valid-token")).thenReturn("test@example.com");
            when(emailService.verifyEmail("valid-token")).thenReturn(true);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

            // When
            boolean result = userService.verifyEmail("valid-token");

            // Then
            assertThat(result).isTrue();
            assertThat(testUser.getIsEmailVerified()).isTrue();
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("실패 - 잘못된 토큰")
        void verifyEmail_InvalidToken() {
            // Given
            when(emailService.getEmailByToken("invalid-token")).thenReturn(null);

            // When
            boolean result = userService.verifyEmail("invalid-token");

            // Then
            assertThat(result).isFalse();
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("requestPasswordReset 테스트")
    class RequestPasswordResetTest {

        @Test
        @DisplayName("성공 - 비밀번호 재설정 요청")
        void requestPasswordReset_Success() {
            // Given
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

            // When
            userService.requestPasswordReset("test@example.com");

            // Then
            verify(emailService).sendPasswordResetEmail("test@example.com");
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void requestPasswordReset_UserNotFound() {
            // Given
            when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> userService.requestPasswordReset("notfound@example.com"))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("등록된 사용자가 없습니다");
        }
    }

    @Nested
    @DisplayName("resetPassword 테스트")
    class ResetPasswordTest {

        @Test
        @DisplayName("성공 - 비밀번호 재설정")
        void resetPassword_Success() {
            // Given
            when(emailService.getEmailByToken("valid-token")).thenReturn("test@example.com");
            when(emailService.verifyEmail("valid-token")).thenReturn(true);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");

            // When
            userService.resetPassword("valid-token", "newPassword123");

            // Then
            assertThat(testUser.getPassword()).isEqualTo("newEncodedPassword");
            assertThat(testUser.getPasswordChangedAt()).isNotNull();
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("실패 - 잘못된 토큰")
        void resetPassword_InvalidToken() {
            // Given
            when(emailService.getEmailByToken("invalid-token")).thenReturn(null);

            // When & Then
            assertThatThrownBy(() -> userService.resetPassword("invalid-token", "newPassword"))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("유효하지 않은 토큰");
        }

        @Test
        @DisplayName("실패 - 만료된 토큰")
        void resetPassword_ExpiredToken() {
            // Given
            when(emailService.getEmailByToken("expired-token")).thenReturn("test@example.com");
            when(emailService.verifyEmail("expired-token")).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> userService.resetPassword("expired-token", "newPassword"))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("만료되었거나 유효하지 않은 토큰");
        }
    }

    @Nested
    @DisplayName("findUsersOnShake 테스트")
    class FindUsersOnShakeTest {

        @Test
        @DisplayName("성공 - 강한 흔들기로 사용자 검색")
        void findUsersOnShake_StrongShake() {
            // Given
            UserDto.ShakeRequest request = new UserDto.ShakeRequest();
            request.setUserId(1L);
            request.setLatitude(37.5665);
            request.setLongitude(126.9780);
            request.setAccelerationX(10.0);
            request.setAccelerationY(10.0);
            request.setAccelerationZ(10.0); // 강도 ≈ 17.3

            User nearbyUser = new User();
            nearbyUser.setId(2L);
            nearbyUser.setNickname("근처사용자");

            when(userRepository.findUsersForShake(anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(List.of(nearbyUser));

            // When
            List<UserDto.Response> result = userService.findUsersOnShake(request);

            // Then
            assertThat(result).isNotEmpty();
            assertThat(result.get(0).getNickname()).isEqualTo("근처사용자");
        }

        @Test
        @DisplayName("약한 흔들기 - 빈 목록 반환")
        void findUsersOnShake_WeakShake() {
            // Given
            UserDto.ShakeRequest request = new UserDto.ShakeRequest();
            request.setAccelerationX(3.0);
            request.setAccelerationY(3.0);
            request.setAccelerationZ(3.0); // 강도 ≈ 5.2

            // When
            List<UserDto.Response> result = userService.findUsersOnShake(request);

            // Then
            assertThat(result).isEmpty();
            verify(userRepository, never()).findUsersForShake(anyDouble(), anyDouble(), anyDouble());
        }

        @Test
        @DisplayName("최대 10명까지만 반환")
        void findUsersOnShake_MaxTenUsers() {
            // Given
            UserDto.ShakeRequest request = new UserDto.ShakeRequest();
            request.setLatitude(37.5665);
            request.setLongitude(126.9780);
            request.setAccelerationX(10.0);
            request.setAccelerationY(10.0);
            request.setAccelerationZ(10.0);

            List<User> manyUsers = new java.util.ArrayList<>();
            for (int i = 0; i < 20; i++) {
                User user = new User();
                user.setId((long) i);
                user.setNickname("사용자" + i);
                manyUsers.add(user);
            }

            when(userRepository.findUsersForShake(anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(manyUsers);

            // When
            List<UserDto.Response> result = userService.findUsersOnShake(request);

            // Then
            assertThat(result).hasSize(10);
        }
    }

    @Nested
    @DisplayName("deleteUser 테스트")
    class DeleteUserTest {

        @Test
        @DisplayName("성공 - 사용자 비활성화")
        void deleteUser_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            userService.deleteUser(1L);

            // Then
            assertThat(testUser.getIsActive()).isFalse();
            verify(userRepository).save(testUser);
        }
    }

    @Nested
    @DisplayName("reportUser 테스트")
    class ReportUserTest {

        @Test
        @DisplayName("성공 - 사용자 신고")
        void reportUser_Success() {
            // Given
            UserDto.ReportRequest request = new UserDto.ReportRequest();
            request.setReportedUserId(2L);
            request.setReportType("SPAM");
            request.setReason("스팸 메시지 발송");
            request.setDescription("지속적으로 광고 메시지를 보냄");

            Report report = new Report();
            report.setId(100L);
            report.setReportType(Report.ReportType.SPAM);
            report.setReason("스팸 메시지 발송");
            report.setStatus(Report.ReportStatus.PENDING);
            report.setCreatedAt(LocalDateTime.now());

            when(reportService.createReport(eq(1L), eq(2L), eq(Report.ReportType.SPAM), anyString(), anyString()))
                    .thenReturn(report);

            // When
            UserDto.ReportResponse response = userService.reportUser(1L, request);

            // Then
            assertThat(response.getId()).isEqualTo(100L);
            assertThat(response.getReportType()).isEqualTo("SPAM");
            assertThat(response.getStatus()).isEqualTo("PENDING");
        }

        @Test
        @DisplayName("알 수 없는 신고 유형은 OTHER로 처리")
        void reportUser_UnknownType() {
            // Given
            UserDto.ReportRequest request = new UserDto.ReportRequest();
            request.setReportedUserId(2L);
            request.setReportType("UNKNOWN_TYPE");
            request.setReason("기타 이유");

            Report report = new Report();
            report.setId(100L);
            report.setReportType(Report.ReportType.OTHER);
            report.setStatus(Report.ReportStatus.PENDING);
            report.setCreatedAt(LocalDateTime.now());

            when(reportService.createReport(eq(1L), eq(2L), eq(Report.ReportType.OTHER), anyString(), any()))
                    .thenReturn(report);

            // When
            UserDto.ReportResponse response = userService.reportUser(1L, request);

            // Then
            assertThat(response.getReportType()).isEqualTo("OTHER");
        }
    }

    @Nested
    @DisplayName("getUserReviews 테스트")
    class GetUserReviewsTest {

        @Test
        @DisplayName("성공 - 사용자 리뷰 목록 조회")
        void getUserReviews_Success() {
            // Given
            User reviewer = new User();
            reviewer.setId(2L);
            reviewer.setNickname("리뷰어");

            UserReview review = new UserReview();
            review.setId(100L);
            review.setReviewer(reviewer);
            review.setReviewee(testUser);
            review.setRating(4);
            review.setComment("좋은 여행 동반자였습니다");

            when(userReviewRepository.findByRevieweeIdWithReviewer(1L)).thenReturn(List.of(review));

            // When
            List<UserDto.ReviewResponse> result = userService.getUserReviews(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getRating()).isEqualTo(4);
            assertThat(result.get(0).getReviewerNickname()).isEqualTo("리뷰어");
        }
    }

    @Nested
    @DisplayName("writeReview 테스트")
    class WriteReviewTest {

        @Test
        @DisplayName("성공 - 리뷰 작성")
        void writeReview_Success() {
            // Given
            User reviewed = new User();
            reviewed.setId(2L);
            reviewed.setNickname("리뷰대상자");

            UserDto.WriteReviewRequest request = new UserDto.WriteReviewRequest();
            request.setReviewedUserId(2L);
            request.setRating(5);
            request.setComment("최고의 여행 파트너!");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewed));
            when(userReviewRepository.existsByReviewerIdAndRevieweeId(1L, 2L)).thenReturn(false);
            when(userReviewRepository.save(any(UserReview.class))).thenAnswer(inv -> {
                UserReview review = inv.getArgument(0);
                review.setId(100L);
                return review;
            });

            // When
            UserDto.ReviewResponse response = userService.writeReview(1L, request);

            // Then
            assertThat(response.getId()).isEqualTo(100L);
            assertThat(response.getRating()).isEqualTo(5);
        }

        @Test
        @DisplayName("실패 - 중복 리뷰")
        void writeReview_DuplicateReview() {
            // Given
            User reviewed = new User();
            reviewed.setId(2L);

            UserDto.WriteReviewRequest request = new UserDto.WriteReviewRequest();
            request.setReviewedUserId(2L);
            request.setRating(5);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reviewed));
            when(userReviewRepository.existsByReviewerIdAndRevieweeId(1L, 2L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> userService.writeReview(1L, request))
                    .isInstanceOf(UserException.class)
                    .hasMessageContaining("이미 해당 사용자에 대한 리뷰를 작성했습니다");
        }
    }

    @Nested
    @DisplayName("유틸리티 메서드 테스트")
    class UtilityMethodsTest {

        @Test
        @DisplayName("existsByEmail - 이메일 존재 확인")
        void existsByEmail() {
            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
            assertThat(userService.existsByEmail("test@example.com")).isTrue();

            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            assertThat(userService.existsByEmail("new@example.com")).isFalse();
        }

        @Test
        @DisplayName("existsByNickname - 닉네임 존재 확인")
        void existsByNickname() {
            when(userRepository.existsByNickname("테스터")).thenReturn(true);
            assertThat(userService.existsByNickname("테스터")).isTrue();

            when(userRepository.existsByNickname("새닉네임")).thenReturn(false);
            assertThat(userService.existsByNickname("새닉네임")).isFalse();
        }

        @Test
        @DisplayName("findByEmail - 이메일로 사용자 찾기")
        void findByEmail() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

            User found = userService.findByEmail("test@example.com");
            assertThat(found.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("updateFcmToken - FCM 토큰 업데이트")
        void updateFcmToken() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            userService.updateFcmToken(1L, "new-fcm-token");

            assertThat(testUser.getFcmToken()).isEqualTo("new-fcm-token");
            verify(userRepository).save(testUser);
        }
    }
}
