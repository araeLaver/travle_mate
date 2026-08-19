package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "match_requests", indexes = {
    @Index(name = "idx_match_requester_status", columnList = "requester_id, status"),
    @Index(name = "idx_match_receiver_status", columnList = "receiver_id, status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;

    @Column(name = "total_score", precision = 5, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "travel_style_score", precision = 5, scale = 2)
    private BigDecimal travelStyleScore;

    @Column(name = "schedule_overlap_score", precision = 5, scale = 2)
    private BigDecimal scheduleOverlapScore;

    @Column(name = "budget_score", precision = 5, scale = 2)
    private BigDecimal budgetScore;

    @Column(name = "language_score", precision = 5, scale = 2)
    private BigDecimal languageScore;

    @Column(name = "rating_score", precision = 5, scale = 2)
    private BigDecimal ratingScore;

    @Column(name = "message", length = 500)
    private String message;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    private void validateNotSelfMatch() {
        if (requester != null && receiver != null
                && requester.getId() != null && requester.getId().equals(receiver.getId())) {
            throw new IllegalStateException("자기 자신에게 매칭 요청을 보낼 수 없습니다.");
        }
    }

    public enum MatchStatus {
        PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED, MATCHED, COMPLETED
    }
}
