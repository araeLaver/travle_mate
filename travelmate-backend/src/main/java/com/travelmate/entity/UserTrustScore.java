package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_trust_scores")
@Getter
@Setter
@NoArgsConstructor
public class UserTrustScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Integer baseScore = 50;

    @Column(nullable = false)
    private Integer reviewScore = 0;

    @Column(nullable = false)
    private Integer activityScore = 0;

    @Column(nullable = false)
    private Integer totalScore = 50;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TrustBadge trustBadge = TrustBadge.NEW;

    @Column(nullable = false)
    private LocalDateTime lastCalculatedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastCalculatedAt = LocalDateTime.now();
    }

    public enum TrustBadge {
        NEW("신규"),
        BRONZE("브론즈"),
        SILVER("실버"),
        GOLD("골드"),
        PLATINUM("플래티넘");

        private final String description;

        TrustBadge(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public static TrustBadge calculateBadge(int totalScore) {
        if (totalScore >= 90) return TrustBadge.PLATINUM;
        if (totalScore >= 75) return TrustBadge.GOLD;
        if (totalScore >= 55) return TrustBadge.SILVER;
        if (totalScore >= 30) return TrustBadge.BRONZE;
        return TrustBadge.NEW;
    }
}
