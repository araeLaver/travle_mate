package com.travelmate.controller;

import com.travelmate.dto.PaymentDto;
import com.travelmate.dto.PaymentDto.*;
import com.travelmate.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 결제 컨트롤러
 */
@Tag(name = "Payment", description = "결제 시스템 API")
@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 포인트 상품 목록 조회
     */
    @Operation(summary = "포인트 상품 목록", description = "구매 가능한 포인트 상품 목록 조회")
    @GetMapping("/products/points")
    public ResponseEntity<List<PointProduct>> getPointProducts() {
        List<PointProduct> products = paymentService.getPointProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * 구독 상품 목록 조회
     */
    @Operation(summary = "구독 상품 목록", description = "구매 가능한 구독 상품 목록 조회")
    @GetMapping("/products/subscriptions")
    public ResponseEntity<List<SubscriptionProduct>> getSubscriptionProducts() {
        List<SubscriptionProduct> products = paymentService.getSubscriptionProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * 결제 준비
     */
    @Operation(summary = "결제 준비", description = "PG사 결제를 위한 준비 정보 생성")
    @PostMapping("/prepare")
    public ResponseEntity<PaymentPrepareResponse> preparePayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentRequest request) {

        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("Payment prepare request from user {} for product {}", userId, request.getProductId());

        PaymentPrepareResponse response = paymentService.preparePayment(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 결제 확인 (PG사 승인)
     */
    @Operation(summary = "결제 확인", description = "PG사 결제 승인 처리")
    @PostMapping("/confirm")
    public ResponseEntity<PaymentResult> confirmPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentConfirmRequest request) {

        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("Payment confirm request from user {} for order {}", userId, request.getOrderId());

        PaymentResult result = paymentService.confirmPayment(userId, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 결제 내역 조회
     */
    @Operation(summary = "결제 내역", description = "사용자의 결제 내역 조회")
    @GetMapping("/history")
    public ResponseEntity<Page<PaymentHistory>> getPaymentHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {

        Long userId = Long.parseLong(userDetails.getUsername());
        Page<PaymentHistory> history = paymentService.getPaymentHistory(userId, pageable);
        return ResponseEntity.ok(history);
    }

    /**
     * 환불 요청
     */
    @Operation(summary = "환불 요청", description = "결제 환불 요청")
    @PostMapping("/refund")
    public ResponseEntity<RefundResult> requestRefund(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RefundRequest request) {

        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("Refund request from user {} for order {}", userId, request.getOrderId());

        RefundResult result = paymentService.requestRefund(userId, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 쿠폰 적용 확인
     */
    @Operation(summary = "쿠폰 확인", description = "쿠폰 코드 유효성 및 할인 금액 확인")
    @GetMapping("/coupon/apply")
    public ResponseEntity<CouponApplyResult> applyCoupon(
            @RequestParam String couponCode,
            @RequestParam BigDecimal amount) {

        CouponApplyResult result = paymentService.applyCoupon(couponCode, amount);
        return ResponseEntity.ok(result);
    }

    /**
     * 구독 정보 조회
     */
    @Operation(summary = "구독 정보", description = "현재 구독 상태 조회")
    @GetMapping("/subscription")
    public ResponseEntity<SubscriptionInfo> getSubscriptionInfo(
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = Long.parseLong(userDetails.getUsername());
        SubscriptionInfo info = paymentService.getSubscriptionInfo(userId);
        return ResponseEntity.ok(info);
    }

    /**
     * 구독 취소
     */
    @Operation(summary = "구독 취소", description = "구독 자동 갱신 취소")
    @PostMapping("/subscription/cancel")
    public ResponseEntity<SubscriptionInfo> cancelSubscription(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false, defaultValue = "사용자 요청") String reason) {

        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("Subscription cancel request from user {}", userId);

        SubscriptionInfo info = paymentService.cancelSubscription(userId, reason);
        return ResponseEntity.ok(info);
    }

    /**
     * 결제 통계 (관리자용)
     */
    @Operation(summary = "결제 통계", description = "관리자용 결제 통계 조회")
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentStats> getPaymentStats() {
        PaymentStats stats = paymentService.getPaymentStats();
        return ResponseEntity.ok(stats);
    }
}
