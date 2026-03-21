package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_blocks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_block_blocker_blocked",
                columnNames = {"blocker_id", "blocked_id"}
        ),
        indexes = {
                @Index(name = "idx_user_block_blocker", columnList = "blocker_id"),
                @Index(name = "idx_user_block_blocked", columnList = "blocked_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 차단한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    /**
     * 차단당한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;

    /**
     * 차단 사유
     */
    @Column(name = "reason", length = 500)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 자기 자신을 차단하는지 검증
     */
    @PrePersist
    @PreUpdate
    private void validateNotSelfBlock() {
        if (blocker != null && blocked != null && blocker.getId().equals(blocked.getId())) {
            throw new IllegalStateException("자기 자신을 차단할 수 없습니다.");
        }
    }
}
