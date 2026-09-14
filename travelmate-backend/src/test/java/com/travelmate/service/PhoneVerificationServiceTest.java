package com.travelmate.service;

import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PhoneVerificationService 테스트")
class PhoneVerificationServiceTest {

    @Mock
    private UserRepository userRepository;

    private PhoneVerificationService phoneVerificationService;

    @BeforeEach
    void setUp() {
        phoneVerificationService = new PhoneVerificationService(userRepository);
        ReflectionTestUtils.setField(phoneVerificationService, "smsProvider", "mock");
        ReflectionTestUtils.setField(phoneVerificationService, "expirationMinutes", 5);
        ReflectionTestUtils.setField(phoneVerificationService, "maxAttempts", 5);
        ReflectionTestUtils.setField(phoneVerificationService, "activeProfiles", "");
    }

    @Test
    @DisplayName("실패 - prod에서 mock SMS provider 사용")
    void validateProductionConfiguration_MockProviderInProd() {
        // Given
        ReflectionTestUtils.setField(phoneVerificationService, "activeProfiles", "prod");

        // When & Then
        assertThatThrownBy(() -> phoneVerificationService.validateProductionConfiguration())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("sms.provider");
    }

    @Test
    @DisplayName("성공 - prod가 아니면 mock SMS provider 허용")
    void validateProductionConfiguration_MockProviderOutsideProd() {
        // When & Then
        assertThatCode(() -> phoneVerificationService.validateProductionConfiguration())
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("실패 - prod에서 구현되지 않은 SMS provider를 mock 발송으로 처리하지 않음")
    void sendVerificationCode_UnimplementedProviderInProd() {
        // Given
        ReflectionTestUtils.setField(phoneVerificationService, "activeProfiles", "prod");
        ReflectionTestUtils.setField(phoneVerificationService, "smsProvider", "twilio");

        // When & Then
        assertThatThrownBy(() -> phoneVerificationService.sendVerificationCode(1L, "010-1234-5678"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not implemented");
    }

    @Test
    @DisplayName("실패 - 올바르지 않은 전화번호 형식")
    void sendVerificationCode_InvalidPhoneNumber() {
        assertThatThrownBy(() -> phoneVerificationService.sendVerificationCode(1L, "1234"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("휴대폰 번호")
                .satisfies(ex -> assertBusinessException(ex, 400, "INVALID_PHONE_NUMBER"));
    }

    @Test
    @DisplayName("실패 - 1분 내 인증 코드 재발송")
    void sendVerificationCode_RateLimited() {
        phoneVerificationService.sendVerificationCode(1L, "010-1234-5678");

        assertThatThrownBy(() -> phoneVerificationService.sendVerificationCode(1L, "010-1234-5678"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("이미 발송")
                .satisfies(ex -> assertBusinessException(ex, 429, "VERIFICATION_CODE_RATE_LIMITED"));
    }

    @Test
    @DisplayName("실패 - 인증 코드 미요청")
    void verifyCode_NotRequested() {
        assertThatThrownBy(() -> phoneVerificationService.verifyCode(1L, "010-1234-5678", "000000"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("발송되지 않았습니다")
                .satisfies(ex -> assertBusinessException(ex, 400, "VERIFICATION_CODE_NOT_REQUESTED"));
    }

    @Test
    @DisplayName("실패 - 요청한 전화번호와 검증 전화번호 불일치")
    void verifyCode_PhoneNumberMismatch() {
        phoneVerificationService.sendVerificationCode(1L, "010-1234-5678");

        assertThatThrownBy(() -> phoneVerificationService.verifyCode(1L, "010-9999-9999", "000000"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("일치하지 않습니다")
                .satisfies(ex -> assertBusinessException(ex, 400, "PHONE_NUMBER_MISMATCH"));
    }

    @Test
    @DisplayName("실패 - 인증 코드 불일치")
    void verifyCode_InvalidCode() {
        phoneVerificationService.sendVerificationCode(1L, "010-1234-5678");

        assertThatThrownBy(() -> phoneVerificationService.verifyCode(1L, "010-1234-5678", "000000"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("인증 코드가 일치하지 않습니다")
                .satisfies(ex -> assertBusinessException(ex, 400, "INVALID_VERIFICATION_CODE"));
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
