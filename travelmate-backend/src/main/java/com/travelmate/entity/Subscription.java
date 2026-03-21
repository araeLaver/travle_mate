package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 구독 엔티티
 */
@Entity
@Table(name = "subscriptions", indexes = {
    @Index(name = "idx_subscription_user", columnList = "user_id"),
    @Index(name = "idx_subscription_status", columnList = "status"),
    @Index(name = "idx_subscription_end_date", columnList = "end_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, length = 20)
    private SubscriptionTier tier;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", length = 20)
    private BillingCycle billingCycle;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "next_billing_date")
    private LocalDateTime nextBillingDate;

    @Column(name = "billing_amount", precision = 12, scale = 2)
    private BigDecimal billingAmount;

    @Column(name = "auto_renew")
    @Builder.Default
    private Boolean autoRenew = true;

    @Column(name = "payment_method_id", length = 100)
    private String paymentMethodId;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum SubscriptionTier {
        FREE,    // 무료
        BASIC,   // 기본
        PREMIUM, // 프리미엄
        PRO      // 프로
    }

    public enum SubscriptionStatus {
        ACTIVE,     // 활성
        CANCELLED,  // 취소됨 (기간까지 유효)
        EXPIRED,    // 만료
        SUSPENDED,  // 정지
        PENDING     // 대기 (결제 대기)
    }

    public enum BillingCycle {
        MONTHLY, // 월간
        YEARLY   // 연간
    }

    // 편의 메서드
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE &&
               endDate.isAfter(LocalDateTime.now());
    }

    public boolean isPremiumOrHigher() {
        return tier == SubscriptionTier.PREMIUM || tier == SubscriptionTier.PRO;
    }

    public void cancel(String reason) {
        this.status = SubscriptionStatus.CANCELLED;
        this.autoRenew = false;
        this.cancelledAt = LocalDateTime.now();
        this.cancelReason = reason;
    }

    public void renew(LocalDateTime newEndDate, BigDecimal amount) {
        this.status = SubscriptionStatus.ACTIVE;
        this.endDate = newEndDate;
        this.billingAmount = amount;

        if (billingCycle == BillingCycle.MONTHLY) {
            this.nextBillingDate = newEndDate;
        } else {
            this.nextBillingDate = newEndDate;
        }
    }

    public void expire() {
        this.status = SubscriptionStatus.EXPIRED;
        this.autoRenew = false;
    }
}
