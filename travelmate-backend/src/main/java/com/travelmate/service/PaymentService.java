package com.travelmate.service;

import com.travelmate.dto.PaymentDto;
import com.travelmate.dto.PaymentDto.*;
import com.travelmate.entity.Payment;
import com.travelmate.entity.Payment.*;
import com.travelmate.entity.Subscription;
import com.travelmate.entity.Subscription.*;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.PointSource;
import com.travelmate.repository.PaymentRepository;
import com.travelmate.repository.SubscriptionRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.service.nft.PointService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 결제 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PointService pointService;
    private final RestTemplate restTemplate;

    @Value("${payment.toss.secret-key:test_sk_}")
    private String tossSecretKey;

    @Value("${payment.toss.client-key:test_ck_}")
    private String tossClientKey;

    @Value("${payment.toss.api-url:https://api.tosspayments.com/v1}")
    private String tossApiUrl;

    @Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    // 포인트 상품 목록
    private static final List<PointProduct> POINT_PRODUCTS = Arrays.asList(
        PointProduct.builder()
            .productId("POINTS_1000")
            .name("1,000 포인트")
            .points(1000)
            .price(new BigDecimal("1000"))
            .originalPrice(new BigDecimal("1000"))
            .discountPercent(0)
            .isBestValue(false)
            .build(),
        PointProduct.builder()
            .productId("POINTS_5000")
            .name("5,000 포인트")
            .points(5500)
            .price(new BigDecimal("5000"))
            .originalPrice(new BigDecimal("5500"))
            .discountPercent(10)
            .isBestValue(false)
            .badge("+500 보너스")
            .build(),
        PointProduct.builder()
            .productId("POINTS_10000")
            .name("10,000 포인트")
            .points(12000)
            .price(new BigDecimal("10000"))
            .originalPrice(new BigDecimal("12000"))
            .discountPercent(17)
            .isBestValue(true)
            .badge("+2,000 보너스")
            .build(),
        PointProduct.builder()
            .productId("POINTS_50000")
            .name("50,000 포인트")
            .points(65000)
            .price(new BigDecimal("50000"))
            .originalPrice(new BigDecimal("65000"))
            .discountPercent(23)
            .isBestValue(false)
            .badge("+15,000 보너스")
            .build()
    );

    // 구독 상품 목록
    private static final List<SubscriptionProduct> SUBSCRIPTION_PRODUCTS = Arrays.asList(
        SubscriptionProduct.builder()
            .productId("SUB_BASIC")
            .name("Basic")
            .tier("BASIC")
            .monthlyPrice(new BigDecimal("4900"))
            .yearlyPrice(new BigDecimal("49000"))
            .features(Arrays.asList(
                "광고 제거",
                "AI 추천 무제한",
                "기본 NFT 테마"
            ))
            .isPopular(false)
            .build(),
        SubscriptionProduct.builder()
            .productId("SUB_PREMIUM")
            .name("Premium")
            .tier("PREMIUM")
            .monthlyPrice(new BigDecimal("9900"))
            .yearlyPrice(new BigDecimal("99000"))
            .features(Arrays.asList(
                "Basic 모든 기능",
                "프리미엄 NFT 테마",
                "우선 민팅",
                "여행 리포트",
                "전용 고객 지원"
            ))
            .isPopular(true)
            .build(),
        SubscriptionProduct.builder()
            .productId("SUB_PRO")
            .name("Pro")
            .tier("PRO")
            .monthlyPrice(new BigDecimal("19900"))
            .yearlyPrice(new BigDecimal("199000"))
            .features(Arrays.asList(
                "Premium 모든 기능",
                "한정판 NFT 접근",
                "API 액세스",
                "비즈니스 분석",
                "우선 지원 + 1:1 컨설팅"
            ))
            .isPopular(false)
            .build()
    );

    /**
     * 포인트 상품 목록 조회
     */
    public List<PointProduct> getPointProducts() {
        return POINT_PRODUCTS;
    }

    /**
     * 구독 상품 목록 조회
     */
    public List<SubscriptionProduct> getSubscriptionProducts() {
        return SUBSCRIPTION_PRODUCTS;
    }

    /**
     * 결제 준비
     */
    @Transactional
    public PaymentPrepareResponse preparePayment(Long userId, PaymentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 주문 ID 생성
        String orderId = generateOrderId();

        // 상품 정보 조회 및 금액 계산
        String orderName;
        BigDecimal amount;
        ProductType productType;

        switch (request.getProductType()) {
            case "POINTS":
                PointProduct pointProduct = findPointProduct(request.getProductId());
                orderName = pointProduct.getName();
                amount = pointProduct.getPrice();
                productType = ProductType.POINTS;
                break;
            case "SUBSCRIPTION":
                SubscriptionProduct subProduct = findSubscriptionProduct(request.getProductId());
                orderName = subProduct.getName() + " 구독";
                // 월간/연간 선택에 따라 금액 결정
                amount = request.getQuantity() != null && request.getQuantity() == 12
                        ? subProduct.getYearlyPrice()
                        : subProduct.getMonthlyPrice();
                productType = ProductType.SUBSCRIPTION;
                break;
            default:
                throw new IllegalArgumentException("지원하지 않는 상품 유형입니다.");
        }

        // 쿠폰 적용
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getCouponCode() != null) {
            CouponApplyResult couponResult = applyCoupon(request.getCouponCode(), amount);
            if (couponResult.getIsValid()) {
                discountAmount = couponResult.getDiscountAmount();
            }
        }

        BigDecimal finalAmount = amount.subtract(discountAmount);

        // 결제 정보 저장
        Payment payment = Payment.builder()
                .user(user)
                .orderId(orderId)
                .orderName(orderName)
                .productType(productType)
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .amount(amount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .couponCode(request.getCouponCode())
                .couponDiscount(discountAmount)
                .pgProvider("TOSS")
                .status(PaymentStatus.PENDING)
                .build();

        paymentRepository.save(payment);
        log.info("Payment prepared: orderId={}, amount={}", orderId, finalAmount);

        return PaymentPrepareResponse.builder()
                .orderId(orderId)
                .orderName(orderName)
                .amount(amount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .currency("KRW")
                .pgProvider("TOSS")
                .clientKey(tossClientKey)
                .customerKey(user.getId().toString())
                .successUrl(appBaseUrl + "/payment/success")
                .failUrl(appBaseUrl + "/payment/fail")
                .build();
    }

    /**
     * 결제 확인 (Toss Payments 승인)
     */
    @Transactional
    public PaymentResult confirmPayment(Long userId, PaymentConfirmRequest request) {
        Payment payment = paymentRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        // 사용자 검증
        if (!payment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("결제 권한이 없습니다.");
        }

        // 금액 검증
        if (payment.getFinalAmount().compareTo(request.getAmount()) != 0) {
            log.error("Payment amount mismatch: expected={}, actual={}",
                    payment.getFinalAmount(), request.getAmount());
            throw new IllegalArgumentException("결제 금액이 일치하지 않습니다.");
        }

        try {
            // Toss Payments API 호출 (실제 환경에서)
            // 테스트 환경에서는 바로 성공 처리
            if (tossSecretKey.startsWith("test_")) {
                // 테스트 모드 - 바로 성공 처리
                payment.complete(request.getPaymentKey(), null);
            } else {
                // 실제 Toss API 호출
                confirmWithToss(payment, request.getPaymentKey());
            }

            // 결제 성공 후 처리
            processPaymentSuccess(payment);

            log.info("Payment completed: orderId={}, paymentKey={}",
                    payment.getOrderId(), payment.getPaymentKey());

            return PaymentResult.builder()
                    .orderId(payment.getOrderId())
                    .paymentKey(payment.getPaymentKey())
                    .status("COMPLETED")
                    .amount(payment.getFinalAmount())
                    .productType(payment.getProductType().name())
                    .productName(payment.getOrderName())
                    .paidAt(payment.getPaidAt())
                    .receiptUrl(payment.getReceiptUrl())
                    .message("결제가 완료되었습니다.")
                    .build();

        } catch (Exception e) {
            log.error("Payment confirmation failed: orderId={}, error={}",
                    request.getOrderId(), e.getMessage());
            payment.fail(e.getMessage());
            paymentRepository.save(payment);

            return PaymentResult.builder()
                    .orderId(payment.getOrderId())
                    .status("FAILED")
                    .amount(payment.getFinalAmount())
                    .message("결제에 실패했습니다: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Toss Payments 승인 API 호출
     */
    private void confirmWithToss(Payment payment, String paymentKey) {
        String url = tossApiUrl + "/payments/confirm";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(tossSecretKey, "");

        Map<String, Object> body = new HashMap<>();
        body.put("paymentKey", paymentKey);
        body.put("orderId", payment.getOrderId());
        body.put("amount", payment.getFinalAmount().intValue());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map<String, Object> result = response.getBody();
            String receiptUrl = (String) result.get("receipt");
            payment.complete(paymentKey, receiptUrl);
        } else {
            throw new RuntimeException("Toss 결제 승인 실패");
        }
    }

    /**
     * 결제 성공 후 처리
     */
    private void processPaymentSuccess(Payment payment) {
        switch (payment.getProductType()) {
            case POINTS:
                // 포인트 지급
                PointProduct pointProduct = findPointProduct(payment.getProductId());
                pointService.earnPoints(
                        payment.getUser().getId(),
                        (long) pointProduct.getPoints(),
                        PointSource.PURCHASE,
                        "포인트 구매: " + pointProduct.getName(),
                        payment.getId(),
                        "PAYMENT"
                );
                break;

            case SUBSCRIPTION:
                // 구독 활성화
                activateSubscription(payment);
                break;

            default:
                break;
        }
    }

    /**
     * 구독 활성화
     */
    private void activateSubscription(Payment payment) {
        SubscriptionProduct product = findSubscriptionProduct(payment.getProductId());
        User user = payment.getUser();

        SubscriptionTier tier = SubscriptionTier.valueOf(product.getTier());
        boolean isYearly = payment.getQuantity() != null && payment.getQuantity() == 12;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = isYearly ? now.plusYears(1) : now.plusMonths(1);

        Subscription subscription = subscriptionRepository.findByUserId(user.getId())
                .orElse(Subscription.builder()
                        .user(user)
                        .build());

        subscription.setTier(tier);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setBillingCycle(isYearly ? BillingCycle.YEARLY : BillingCycle.MONTHLY);
        subscription.setStartDate(now);
        subscription.setEndDate(endDate);
        subscription.setNextBillingDate(endDate);
        subscription.setBillingAmount(payment.getFinalAmount());
        subscription.setAutoRenew(true);

        subscriptionRepository.save(subscription);
        log.info("Subscription activated: userId={}, tier={}, endDate={}",
                user.getId(), tier, endDate);
    }

    /**
     * 결제 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<PaymentHistory> getPaymentHistory(Long userId, Pageable pageable) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toPaymentHistory);
    }

    /**
     * 환불 요청
     */
    @Transactional
    public RefundResult requestRefund(Long userId, RefundRequest request) {
        Payment payment = paymentRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        // 권한 검증
        if (!payment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("환불 권한이 없습니다.");
        }

        // 상태 검증
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new IllegalArgumentException("환불할 수 없는 결제입니다.");
        }

        BigDecimal refundAmount = request.getRefundAmount() != null
                ? request.getRefundAmount()
                : payment.getFinalAmount();

        try {
            // Toss 환불 API 호출 (실제 환경에서)
            if (!tossSecretKey.startsWith("test_")) {
                cancelWithToss(payment, refundAmount, request.getReason());
            }

            payment.refund(refundAmount, request.getReason());
            paymentRepository.save(payment);

            // 포인트 차감 등 후처리
            processRefund(payment);

            log.info("Refund completed: orderId={}, amount={}", payment.getOrderId(), refundAmount);

            return RefundResult.builder()
                    .orderId(payment.getOrderId())
                    .refundAmount(refundAmount)
                    .status("REFUNDED")
                    .refundedAt(LocalDateTime.now())
                    .message("환불이 완료되었습니다.")
                    .build();

        } catch (Exception e) {
            log.error("Refund failed: orderId={}, error={}", request.getOrderId(), e.getMessage());
            throw new RuntimeException("환불 처리에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * Toss 환불 API 호출
     */
    private void cancelWithToss(Payment payment, BigDecimal refundAmount, String reason) {
        String url = tossApiUrl + "/payments/" + payment.getPaymentKey() + "/cancel";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(tossSecretKey, "");

        Map<String, Object> body = new HashMap<>();
        body.put("cancelReason", reason);
        if (refundAmount.compareTo(payment.getFinalAmount()) < 0) {
            body.put("cancelAmount", refundAmount.intValue());
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Toss 환불 요청 실패");
        }
    }

    /**
     * 환불 후 처리
     */
    private void processRefund(Payment payment) {
        switch (payment.getProductType()) {
            case POINTS:
                // 포인트 차감
                PointProduct pointProduct = findPointProduct(payment.getProductId());
                pointService.spendPoints(
                        payment.getUser().getId(),
                        (long) pointProduct.getPoints(),
                        PointSource.REFUND,
                        "포인트 환불: " + pointProduct.getName(),
                        payment.getId(),
                        "PAYMENT_REFUND"
                );
                break;

            case SUBSCRIPTION:
                // 구독 취소
                subscriptionRepository.findActiveByUserId(payment.getUser().getId())
                        .ifPresent(sub -> {
                            sub.cancel("환불로 인한 취소");
                            subscriptionRepository.save(sub);
                        });
                break;

            default:
                break;
        }
    }

    /**
     * 쿠폰 적용
     */
    public CouponApplyResult applyCoupon(String couponCode, BigDecimal originalAmount) {
        // 간단한 쿠폰 시스템 (실제로는 DB에서 관리)
        Map<String, Map<String, Object>> coupons = new HashMap<>();
        coupons.put("WELCOME10", Map.of("name", "신규가입 10% 할인", "type", "PERCENT", "value", 10));
        coupons.put("TRAVEL2024", Map.of("name", "2024 여행 할인", "type", "FIXED", "value", 1000));

        if (!coupons.containsKey(couponCode.toUpperCase())) {
            return CouponApplyResult.builder()
                    .couponCode(couponCode)
                    .isValid(false)
                    .message("유효하지 않은 쿠폰입니다.")
                    .build();
        }

        Map<String, Object> coupon = coupons.get(couponCode.toUpperCase());
        String type = (String) coupon.get("type");
        int value = (int) coupon.get("value");

        BigDecimal discountAmount;
        if ("PERCENT".equals(type)) {
            discountAmount = originalAmount.multiply(new BigDecimal(value))
                    .divide(new BigDecimal("100"), 0, RoundingMode.DOWN);
        } else {
            discountAmount = new BigDecimal(value);
        }

        return CouponApplyResult.builder()
                .couponCode(couponCode)
                .couponName((String) coupon.get("name"))
                .discountType(type)
                .discountValue(new BigDecimal(value))
                .discountAmount(discountAmount)
                .isValid(true)
                .message("쿠폰이 적용되었습니다.")
                .build();
    }

    /**
     * 구독 정보 조회
     */
    @Transactional(readOnly = true)
    public SubscriptionInfo getSubscriptionInfo(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .map(this::toSubscriptionInfo)
                .orElse(SubscriptionInfo.builder()
                        .tier("FREE")
                        .status("NONE")
                        .activeFeatures(Collections.emptyList())
                        .build());
    }

    /**
     * 구독 취소
     */
    @Transactional
    public SubscriptionInfo cancelSubscription(Long userId, String reason) {
        Subscription subscription = subscriptionRepository.findActiveByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("활성 구독이 없습니다."));

        subscription.cancel(reason);
        subscriptionRepository.save(subscription);

        log.info("Subscription cancelled: userId={}, reason={}", userId, reason);

        return toSubscriptionInfo(subscription);
    }

    /**
     * 결제 통계 (관리자용)
     */
    @Transactional(readOnly = true)
    public PaymentStats getPaymentStats() {
        LocalDateTime today = LocalDate.now().atStartOfDay();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        BigDecimal totalRevenue = paymentRepository.getTotalRevenue();
        BigDecimal monthlyRevenue = paymentRepository.getRevenueAfter(monthStart);
        BigDecimal dailyRevenue = paymentRepository.getRevenueAfter(today);

        long completed = paymentRepository.countByStatus(PaymentStatus.COMPLETED);
        long failed = paymentRepository.countByStatus(PaymentStatus.FAILED);
        long refunded = paymentRepository.countByStatus(PaymentStatus.REFUNDED);

        BigDecimal avgOrderValue = paymentRepository.getAverageOrderValue();

        List<Object[]> revenueByType = paymentRepository.getRevenueByProductType();
        List<RevenueByProduct> revenueByProduct = revenueByType.stream()
                .map(row -> RevenueByProduct.builder()
                        .productType(((ProductType) row[0]).name())
                        .revenue((BigDecimal) row[2])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());

        return PaymentStats.builder()
                .totalRevenue(totalRevenue)
                .monthlyRevenue(monthlyRevenue)
                .dailyRevenue(dailyRevenue)
                .totalTransactions(completed + failed + refunded)
                .completedTransactions(completed)
                .failedTransactions(failed)
                .refundedTransactions(refunded)
                .averageOrderValue(avgOrderValue)
                .revenueByProduct(revenueByProduct)
                .build();
    }

    // Helper methods
    private String generateOrderId() {
        return "ORDER_" + System.currentTimeMillis() + "_" +
               UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private PointProduct findPointProduct(String productId) {
        return POINT_PRODUCTS.stream()
                .filter(p -> p.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("포인트 상품을 찾을 수 없습니다."));
    }

    private SubscriptionProduct findSubscriptionProduct(String productId) {
        return SUBSCRIPTION_PRODUCTS.stream()
                .filter(p -> p.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("구독 상품을 찾을 수 없습니다."));
    }

    private PaymentHistory toPaymentHistory(Payment payment) {
        return PaymentHistory.builder()
                .orderId(payment.getOrderId())
                .paymentKey(payment.getPaymentKey())
                .status(payment.getStatus().name())
                .amount(payment.getFinalAmount())
                .productType(payment.getProductType().name())
                .productName(payment.getOrderName())
                .paymentMethod(payment.getPaymentMethod() != null
                        ? payment.getPaymentMethod().name() : null)
                .createdAt(payment.getCreatedAt())
                .paidAt(payment.getPaidAt())
                .build();
    }

    private SubscriptionInfo toSubscriptionInfo(Subscription subscription) {
        List<String> features = new ArrayList<>();
        SubscriptionProduct product = SUBSCRIPTION_PRODUCTS.stream()
                .filter(p -> p.getTier().equals(subscription.getTier().name()))
                .findFirst()
                .orElse(null);

        if (product != null) {
            features = product.getFeatures();
        }

        return SubscriptionInfo.builder()
                .tier(subscription.getTier().name())
                .status(subscription.getStatus().name())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .nextBillingDate(subscription.getNextBillingDate())
                .nextBillingAmount(subscription.getBillingAmount())
                .autoRenew(subscription.getAutoRenew())
                .activeFeatures(features)
                .build();
    }
}
