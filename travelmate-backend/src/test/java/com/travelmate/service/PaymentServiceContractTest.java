package com.travelmate.service;

import com.travelmate.dto.PaymentDto.PaymentConfirmRequest;
import com.travelmate.dto.PaymentDto.PaymentRequest;
import com.travelmate.dto.PaymentDto.RefundRequest;
import com.travelmate.entity.Payment;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.PaymentRepository;
import com.travelmate.repository.SubscriptionRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.service.nft.PointService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService 계약 테스트")
class PaymentServiceContractTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PointService pointService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private PaymentService paymentService;

    private User user;
    private Payment payment;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "tossSecretKey", "test_sk_12345");
        ReflectionTestUtils.setField(paymentService, "tossClientKey", "test_ck_12345");
        ReflectionTestUtils.setField(paymentService, "tossApiUrl", "https://api.tosspayments.com/v1");
        ReflectionTestUtils.setField(paymentService, "appBaseUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(paymentService, "activeProfiles", "");

        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setNickname("testuser");

        payment = Payment.builder()
                .id(1L)
                .user(user)
                .orderId("ORDER_123456789_ABCD1234")
                .orderName("1,000 포인트")
                .productType(Payment.ProductType.POINTS)
                .productId("POINTS_1000")
                .amount(new BigDecimal("1000"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("1000"))
                .pgProvider("TOSS")
                .status(Payment.PaymentStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("preparePayment - 지원하지 않는 상품 유형은 BAD_REQUEST")
    void preparePayment_UnsupportedProductType_ReturnsBadRequestContract() {
        PaymentRequest request = PaymentRequest.builder()
                .productType("INVALID")
                .productId("POINTS_1000")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> paymentService.preparePayment(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("지원하지 않는 상품 유형입니다.")
                .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));

        verify(paymentRepository, never()).save(payment);
    }

    @Test
    @DisplayName("confirmPayment - 결제 금액 불일치는 BAD_REQUEST")
    void confirmPayment_AmountMismatch_ReturnsBadRequestContract() {
        PaymentConfirmRequest request = PaymentConfirmRequest.builder()
                .paymentKey("payment_key_123")
                .orderId(payment.getOrderId())
                .amount(new BigDecimal("2000"))
                .build();
        when(paymentRepository.findByOrderId(payment.getOrderId())).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.confirmPayment(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("결제 금액이 일치하지 않습니다.")
                .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
    }

    @Test
    @DisplayName("requestRefund - 환불 불가 상태는 CONFLICT")
    void requestRefund_InvalidPaymentStatus_ReturnsConflictContract() {
        RefundRequest request = RefundRequest.builder()
                .orderId(payment.getOrderId())
                .reason("사용자 요청")
                .build();
        when(paymentRepository.findByOrderId(payment.getOrderId())).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.requestRefund(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("환불할 수 없는 결제입니다.")
                .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
