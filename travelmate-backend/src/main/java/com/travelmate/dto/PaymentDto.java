package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 결제 시스템 DTO
 */
public class PaymentDto {

    /**
     * 결제 요청
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentRequest {
        private String productType; // POINTS, SUBSCRIPTION, NFT
        private String productId;
        private Integer quantity;
        private String paymentMethod; // CARD, BANK_TRANSFER, KAKAO_PAY, TOSS_PAY
        private String couponCode;
    }

    /**
     * 결제 준비 응답 (PG사 연동 전)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentPrepareResponse {
        private String orderId;
        private String orderName;
        private BigDecimal amount;
        private BigDecimal discountAmount;
        private BigDecimal finalAmount;
        private String currency;
        private String pgProvider;
        private String clientKey;
        private String customerKey;
        private String successUrl;
        private String failUrl;
    }

    /**
     * 결제 확인 요청
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentConfirmRequest {
        private String orderId;
        private String paymentKey;
        private BigDecimal amount;
    }

    /**
     * 결제 결과
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentResult {
        private String orderId;
        private String paymentKey;
        private String status; // PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED
        private BigDecimal amount;
        private String productType;
        private String productName;
        private LocalDateTime paidAt;
        private String receiptUrl;
        private String message;
    }

    /**
     * 결제 내역
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentHistory {
        private String orderId;
        private String paymentKey;
        private String status;
        private BigDecimal amount;
        private String productType;
        private String productName;
        private String paymentMethod;
        private LocalDateTime createdAt;
        private LocalDateTime paidAt;
    }

    /**
     * 포인트 상품
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointProduct {
        private String productId;
        private String name;
        private Integer points;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer discountPercent;
        private Boolean isBestValue;
        private String badge;
    }

    /**
     * 구독 상품
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionProduct {
        private String productId;
        private String name;
        private String tier; // BASIC, PREMIUM, PRO
        private BigDecimal monthlyPrice;
        private BigDecimal yearlyPrice;
        private List<String> features;
        private Boolean isPopular;
    }

    /**
     * 구독 정보
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionInfo {
        private String tier;
        private String status; // ACTIVE, CANCELLED, EXPIRED
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private LocalDateTime nextBillingDate;
        private BigDecimal nextBillingAmount;
        private Boolean autoRenew;
        private List<String> activeFeatures;
    }

    /**
     * 환불 요청
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefundRequest {
        private String orderId;
        private String reason;
        private BigDecimal refundAmount; // null이면 전액 환불
    }

    /**
     * 환불 결과
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefundResult {
        private String orderId;
        private String refundKey;
        private BigDecimal refundAmount;
        private String status;
        private LocalDateTime refundedAt;
        private String message;
    }

    /**
     * 쿠폰 적용 결과
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CouponApplyResult {
        private String couponCode;
        private String couponName;
        private String discountType; // PERCENT, FIXED
        private BigDecimal discountValue;
        private BigDecimal discountAmount;
        private Boolean isValid;
        private String message;
    }

    /**
     * 결제 통계 (관리자용)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentStats {
        private BigDecimal totalRevenue;
        private BigDecimal monthlyRevenue;
        private BigDecimal dailyRevenue;
        private Long totalTransactions;
        private Long completedTransactions;
        private Long failedTransactions;
        private Long refundedTransactions;
        private BigDecimal averageOrderValue;
        private List<RevenueByProduct> revenueByProduct;
    }

    /**
     * 상품별 매출
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueByProduct {
        private String productType;
        private String productName;
        private BigDecimal revenue;
        private Long count;
    }
}
