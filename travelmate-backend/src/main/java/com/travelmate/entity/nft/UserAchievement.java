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
 * 사용자 업적 엔티티
 * 사용자의 업적 진행 상황 및 완료 정보
 */
@Entity
@Table(name = "user_achievements", indexes = {
    @Index(name = "idx_user_achievement_user", columnList = "user_id"),
    @Index(name = "idx_user_achievement", columnList = "achievement_id"),
    @Index(name = "idx_user_achievement_unique", columnList = "user_id, achievement_id", unique = true),
    @Index(name = "idx_user_achievement_completed", columnList = "is_completed")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;

    @Column(name = "current_progress", nullable = false)
    @Builder.Default
    private Integer currentProgress = 0;

    @Column(name = "target_progress", nullable = false)
    private Integer targetProgress;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    // 배지 NFT 정보 (업적 완료 시)
    @Column(name = "badge_token_id", length = 100)
    private String badgeTokenId;

    @Column(name = "badge_transaction_hash", length = 100)
    private String badgeTransactionHash;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * 진행률 퍼센트 계산
     */
    public int getProgressPercent() {
        if (targetProgress == null || targetProgress == 0) return 0;
        return Math.min(100, (currentProgress * 100) / targetProgress);
    }

    /**
     * 진행도 증가
     */
    public boolean incrementProgress() {
        if (isCompleted) return false;

        this.currentProgress++;
        if (this.currentProgress >= this.targetProgress) {
            this.isCompleted = true;
            this.completedAt = LocalDateTime.now();
            return true; // 업적 달성
        }
        return false;
    }

    /**
     * 업적 완료 처리
     */
    public void complete() {
        this.isCompleted = true;
        this.currentProgress = this.targetProgress;
        this.completedAt = LocalDateTime.now();
    }
}
