package com.travelmate.service;

import com.travelmate.entity.TwoFactorAuth;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.exception.UserException;
import com.travelmate.repository.TwoFactorAuthRepository;
import jakarta.persistence.Column;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TwoFactorAuthService 테스트")
class TwoFactorAuthServiceTest {

    @Mock
    private TwoFactorAuthRepository twoFactorAuthRepository;

    @InjectMocks
    private TwoFactorAuthService twoFactorAuthService;

    private User testUser;
    private TwoFactorAuth testTwoFactorAuth;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("테스터");

        testTwoFactorAuth = TwoFactorAuth.builder()
                .id(100L)
                .user(testUser)
                .secretKey("dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nMTIz") // Base64 encoded
                .method(TwoFactorAuth.TwoFactorMethod.TOTP)
                .backupCodes("12345678,23456789,34567890,45678901,56789012,67890123,78901234,89012345,90123456,01234567")
                .isEnabled(true)
                .verifiedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("initializeTwoFactorAuth 테스트")
    class InitializeTwoFactorAuthTest {

        @Test
        @DisplayName("성공 - TOTP 방식 2FA 초기화")
        void initializeTwoFactorAuth_TOTP_Success() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.empty());
            when(twoFactorAuthRepository.save(any(TwoFactorAuth.class))).thenAnswer(inv -> {
                TwoFactorAuth auth = inv.getArgument(0);
                auth.setId(100L);
                return auth;
            });

            // When
            TwoFactorAuth result = twoFactorAuthService.initializeTwoFactorAuth(
                    testUser, TwoFactorAuth.TwoFactorMethod.TOTP);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getUser()).isEqualTo(testUser);
            assertThat(result.getMethod()).isEqualTo(TwoFactorAuth.TwoFactorMethod.TOTP);
            assertThat(result.getSecretKey()).isNotNull();
            assertThat(result.getBackupCodes()).isNotNull();
            assertThat(result.getIsEnabled()).isFalse();

            verify(twoFactorAuthRepository).save(any(TwoFactorAuth.class));
        }

        @Test
        @DisplayName("성공 - 기존 설정이 있으면 삭제 후 새로 생성")
        void initializeTwoFactorAuth_DeleteExisting() {
            // Given
            TwoFactorAuth existingAuth = TwoFactorAuth.builder()
                    .id(99L)
                    .user(testUser)
                    .build();

            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(existingAuth));
            when(twoFactorAuthRepository.save(any(TwoFactorAuth.class))).thenAnswer(inv -> {
                TwoFactorAuth auth = inv.getArgument(0);
                auth.setId(100L);
                return auth;
            });

            // When
            TwoFactorAuth result = twoFactorAuthService.initializeTwoFactorAuth(
                    testUser, TwoFactorAuth.TwoFactorMethod.TOTP);

            // Then
            verify(twoFactorAuthRepository).delete(existingAuth);
            verify(twoFactorAuthRepository).save(any(TwoFactorAuth.class));
            assertThat(result.getIsEnabled()).isFalse();
        }

        @Test
        @DisplayName("백업 코드 10개 생성 확인")
        void initializeTwoFactorAuth_GeneratesBackupCodes() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.empty());
            when(twoFactorAuthRepository.save(any(TwoFactorAuth.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            TwoFactorAuth result = twoFactorAuthService.initializeTwoFactorAuth(
                    testUser, TwoFactorAuth.TwoFactorMethod.TOTP);

            // Then
            String[] backupCodes = result.getBackupCodes().split(",");
            assertThat(backupCodes).hasSize(10);
            for (String code : backupCodes) {
                assertThat(code).hasSize(8);
                assertThat(code).containsOnlyDigits();
            }
        }

        @Test
        @DisplayName("생성된 secret key는 DB 컬럼 길이를 초과하지 않는다")
        void initializeTwoFactorAuth_SecretKeyFitsColumnLength() throws Exception {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.empty());
            when(twoFactorAuthRepository.save(any(TwoFactorAuth.class))).thenAnswer(inv -> inv.getArgument(0));

            // When
            TwoFactorAuth result = twoFactorAuthService.initializeTwoFactorAuth(
                    testUser, TwoFactorAuth.TwoFactorMethod.TOTP);

            // Then
            Field secretKeyField = TwoFactorAuth.class.getDeclaredField("secretKey");
            int columnLength = secretKeyField.getAnnotation(Column.class).length();
            assertThat(result.getSecretKey()).hasSizeLessThanOrEqualTo(columnLength);
            assertThat(columnLength).isGreaterThanOrEqualTo(64);
        }
    }

    @Nested
    @DisplayName("enableTwoFactorAuth 테스트")
    class EnableTwoFactorAuthTest {

        @Test
        @DisplayName("실패 - 2FA 설정 없음")
        void enableTwoFactorAuth_NotFound() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> twoFactorAuthService.enableTwoFactorAuth(testUser, "123456"))
                    .isInstanceOf(UserException.InvalidTokenException.class);
        }

        @Test
        @DisplayName("실패 - 이미 활성화됨")
        void enableTwoFactorAuth_AlreadyEnabled() {
            // Given
            testTwoFactorAuth.setIsEnabled(true);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When & Then
            assertThatThrownBy(() -> twoFactorAuthService.enableTwoFactorAuth(testUser, "123456"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 활성화")
                    .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        }

        @Test
        @DisplayName("실패 - 잘못된 인증 코드")
        void enableTwoFactorAuth_InvalidCode() {
            // Given
            testTwoFactorAuth.setIsEnabled(false);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When & Then
            assertThatThrownBy(() -> twoFactorAuthService.enableTwoFactorAuth(testUser, "000000"))
                    .isInstanceOf(UserException.InvalidVerificationCodeException.class);
        }
    }

    @Nested
    @DisplayName("disableTwoFactorAuth 테스트")
    class DisableTwoFactorAuthTest {

        @Test
        @DisplayName("실패 - 2FA 설정 없음")
        void disableTwoFactorAuth_NotFound() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> twoFactorAuthService.disableTwoFactorAuth(testUser, "123456"))
                    .isInstanceOf(UserException.InvalidTokenException.class);
        }

        @Test
        @DisplayName("성공 - 이미 비활성화 상태면 아무것도 안함")
        void disableTwoFactorAuth_AlreadyDisabled() {
            // Given
            testTwoFactorAuth.setIsEnabled(false);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When
            twoFactorAuthService.disableTwoFactorAuth(testUser, "123456");

            // Then
            verify(twoFactorAuthRepository, never()).delete(any());
        }

        @Test
        @DisplayName("실패 - 잘못된 인증 코드")
        void disableTwoFactorAuth_InvalidCode() {
            // Given
            testTwoFactorAuth.setIsEnabled(true);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When & Then
            assertThatThrownBy(() -> twoFactorAuthService.disableTwoFactorAuth(testUser, "000000"))
                    .isInstanceOf(UserException.InvalidVerificationCodeException.class);
        }
    }

    @Nested
    @DisplayName("verifyTwoFactorCode 테스트")
    class VerifyTwoFactorCodeTest {

        @Test
        @DisplayName("성공 - 2FA 미설정시 통과")
        void verifyTwoFactorCode_NoSetup_Pass() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.empty());

            // When
            boolean result = twoFactorAuthService.verifyTwoFactorCode(testUser, "123456");

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("성공 - 2FA 비활성화시 통과")
        void verifyTwoFactorCode_Disabled_Pass() {
            // Given
            testTwoFactorAuth.setIsEnabled(false);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When
            boolean result = twoFactorAuthService.verifyTwoFactorCode(testUser, "123456");

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("성공 - 유효한 백업 코드")
        void verifyTwoFactorCode_ValidBackupCode() {
            // Given
            testTwoFactorAuth.setIsEnabled(true);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));
            when(twoFactorAuthRepository.save(any(TwoFactorAuth.class))).thenReturn(testTwoFactorAuth);

            // When
            boolean result = twoFactorAuthService.verifyTwoFactorCode(testUser, "12345678");

            // Then
            assertThat(result).isTrue();
            verify(twoFactorAuthRepository).save(any(TwoFactorAuth.class));
        }

        @Test
        @DisplayName("실패 - 잘못된 코드")
        void verifyTwoFactorCode_InvalidCode() {
            // Given
            testTwoFactorAuth.setIsEnabled(true);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When
            boolean result = twoFactorAuthService.verifyTwoFactorCode(testUser, "00000000");

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("실패 - null 코드")
        void verifyTwoFactorCode_NullCode() {
            // Given
            testTwoFactorAuth.setIsEnabled(true);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When
            boolean result = twoFactorAuthService.verifyTwoFactorCode(testUser, null);

            // Then
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("generateQrCodeUri 테스트")
    class GenerateQrCodeUriTest {

        @Test
        @DisplayName("성공 - QR 코드 URI 생성")
        void generateQrCodeUri_Success() {
            // Given
            String secretKey = "TESTSECRETKEY123";
            String issuer = "TravelMate";

            // When
            String uri = twoFactorAuthService.generateQrCodeUri(testUser, secretKey, issuer);

            // Then
            assertThat(uri).startsWith("otpauth://totp/");
            assertThat(uri).contains("TravelMate");
            assertThat(uri).contains("test@example.com");
            assertThat(uri).contains("secret=" + secretKey);
            assertThat(uri).contains("digits=6");
            assertThat(uri).contains("period=30");
        }
    }

    @Nested
    @DisplayName("getBackupCodes 테스트")
    class GetBackupCodesTest {

        @Test
        @DisplayName("성공 - 백업 코드 조회")
        void getBackupCodes_Success() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When
            List<String> codes = twoFactorAuthService.getBackupCodes(testUser);

            // Then
            assertThat(codes).hasSize(10);
            assertThat(codes).contains("12345678", "23456789", "34567890");
        }

        @Test
        @DisplayName("실패 - 2FA 미설정")
        void getBackupCodes_NotFound() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> twoFactorAuthService.getBackupCodes(testUser))
                    .isInstanceOf(UserException.InvalidTokenException.class);
        }

        @Test
        @DisplayName("성공 - 백업 코드 없으면 빈 리스트")
        void getBackupCodes_Empty() {
            // Given
            testTwoFactorAuth.setBackupCodes(null);
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));

            // When
            List<String> codes = twoFactorAuthService.getBackupCodes(testUser);

            // Then
            assertThat(codes).isEmpty();
        }
    }

    @Nested
    @DisplayName("regenerateBackupCodes 테스트")
    class RegenerateBackupCodesTest {

        @Test
        @DisplayName("성공 - 새로운 백업 코드 생성")
        void regenerateBackupCodes_Success() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.of(testTwoFactorAuth));
            when(twoFactorAuthRepository.save(any(TwoFactorAuth.class))).thenReturn(testTwoFactorAuth);

            // When
            List<String> newCodes = twoFactorAuthService.regenerateBackupCodes(testUser);

            // Then
            assertThat(newCodes).hasSize(10);
            for (String code : newCodes) {
                assertThat(code).hasSize(8);
                assertThat(code).containsOnlyDigits();
            }

            ArgumentCaptor<TwoFactorAuth> captor = ArgumentCaptor.forClass(TwoFactorAuth.class);
            verify(twoFactorAuthRepository).save(captor.capture());
            assertThat(captor.getValue().getBackupCodes()).isNotEqualTo(
                    "12345678,23456789,34567890,45678901,56789012,67890123,78901234,89012345,90123456,01234567");
        }

        @Test
        @DisplayName("실패 - 2FA 미설정")
        void regenerateBackupCodes_NotFound() {
            // Given
            when(twoFactorAuthRepository.findByUser(testUser)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> twoFactorAuthService.regenerateBackupCodes(testUser))
                    .isInstanceOf(UserException.InvalidTokenException.class);
        }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
