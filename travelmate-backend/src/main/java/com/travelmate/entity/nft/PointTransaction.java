package com.travelmate.entity.nft;

import com.travelmate.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 포인트 거래 내역 엔티티
 * 포인트 획득/사용 기록
 */
@Entity
@Table(name = "point_transactions", indexes = {
    @Index(name = "idx_point_tx_user", columnList = "user_id"),
    @Index(name = "idx_point_tx_type", columnList = "type"),
    @Index(name = "idx_point_tx_source", columnList = "source"),
    @Index(name = "idx_point_tx_created", columnList = "created_at"),
    @Index(name = "idx_point_tx_reference", columnList = "reference_id, reference_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private PointTransactionType type;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Column(name = "balance_after", nullable = false)
    private Long balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 30)
    private PointSource source;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "description", length = 500)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * 거래 내역 생성 헬퍼 메서드 - 획득
     */
    public static PointTransaction createEarnTransaction(
            User user, long amount, long balanceAfter,
            PointSource source, Long referenceId, String referenceType, String description) {
        return PointTransaction.builder()
                .user(user)
                .type(PointTransactionType.EARN)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .source(source)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .description(description)
                .build();
    }

    /**
     * 거래 내역 생성 헬퍼 메서드 - 사용
     */
    public static PointTransaction createSpendTransaction(
            User user, long amount, long balanceAfter,
            PointSource source, Long referenceId, String referenceType, String description) {
        return PointTransaction.builder()
                .user(user)
                .type(PointTransactionType.SPEND)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .source(source)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .description(description)
                .build();
    }
}
