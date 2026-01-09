package com.travelmate.entity.nft;

import com.travelmate.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자 포인트 엔티티
 * 사용자의 포인트 잔액 및 통계
 */
@Entity
@Table(name = "user_points", indexes = {
    @Index(name = "idx_user_points_rank", columnList = "current_rank"),
    @Index(name = "idx_user_points_season", columnList = "season_points")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "total_points", nullable = false)
    @Builder.Default
    private Long totalPoints = 0L;

    @Column(name = "lifetime_earned", nullable = false)
    @Builder.Default
    private Long lifetimeEarned = 0L;

    @Column(name = "lifetime_spent", nullable = false)
    @Builder.Default
    private Long lifetimeSpent = 0L;

    @Column(name = "season_points", nullable = false)
    @Builder.Default
    private Long seasonPoints = 0L;

    @Column(name = "current_rank")
    private Integer currentRank;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 포인트 획득
     */
    public void earnPoints(long amount) {
        this.totalPoints += amount;
        this.lifetimeEarned += amount;
        this.seasonPoints += amount;
    }

    /**
     * 포인트 사용
     */
    public boolean spendPoints(long amount) {
        if (this.totalPoints < amount) {
            return false;
        }
        this.totalPoints -= amount;
        this.lifetimeSpent += amount;
        return true;
    }

    /**
     * 포인트 충분 여부 확인
     */
    public boolean hasEnoughPoints(long amount) {
        return this.totalPoints >= amount;
    }

    /**
     * 시즌 리셋
     */
    public void resetSeason() {
        this.seasonPoints = 0L;
        this.currentRank = null;
    }
}
