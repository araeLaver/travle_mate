package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 결제 엔티티
 */
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_user", columnList = "user_id"),
    @Index(name = "idx_payment_order", columnList = "order_id"),
    @Index(name = "idx_payment_status", columnList = "status"),
    @Index(name = "idx_payment_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "order_id", nullable = false, unique = true, length = 64)
    private String orderId;

    @Column(name = "payment_key", length = 200)
    private String paymentKey;

    @Column(name = "order_name", nullable = false)
    private String orderName;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 20)
    private ProductType productType;

    @Column(name = "product_id", length = 50)
    private String productId;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "KRW";

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "pg_provider", length = 20)
    private String pgProvider;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "coupon_discount", precision = 12, scale = 2)
    private BigDecimal couponDiscount;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_reason")
    private String refundReason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum ProductType {
        POINTS,      // 포인트 구매
        SUBSCRIPTION, // 구독
        NFT           // NFT 구매
    }

    public enum PaymentMethod {
        CARD,          // 카드
        BANK_TRANSFER, // 계좌이체
        VIRTUAL_ACCOUNT, // 가상계좌
        KAKAO_PAY,     // 카카오페이
        TOSS_PAY,      // 토스페이
        NAVER_PAY      // 네이버페이
    }

    public enum PaymentStatus {
        PENDING,    // 대기
        READY,      // 준비완료 (PG 응답)
        IN_PROGRESS, // 진행중
        COMPLETED,  // 완료
        FAILED,     // 실패
        CANCELLED,  // 취소
        PARTIAL_CANCELLED, // 부분취소
        REFUNDED    // 환불
    }

    // 편의 메서드
    public void complete(String paymentKey, String receiptUrl) {
        this.paymentKey = paymentKey;
        this.receiptUrl = receiptUrl;
        this.status = PaymentStatus.COMPLETED;
        this.paidAt = LocalDateTime.now();
    }

    public void fail(String reason) {
        this.failureReason = reason;
        this.status = PaymentStatus.FAILED;
    }

    public void cancel(String reason) {
        this.refundReason = reason;
        this.status = PaymentStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }

    public void refund(BigDecimal refundAmount, String reason) {
        this.refundAmount = refundAmount;
        this.refundReason = reason;
        this.refundedAt = LocalDateTime.now();

        if (refundAmount.compareTo(this.finalAmount) >= 0) {
            this.status = PaymentStatus.REFUNDED;
        } else {
            this.status = PaymentStatus.PARTIAL_CANCELLED;
        }
    }
}
