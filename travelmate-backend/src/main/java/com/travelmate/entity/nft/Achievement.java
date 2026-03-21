package com.travelmate.entity.nft;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 업적 엔티티
 * 달성 가능한 업적 정의
 */
@Entity
@Table(name = "achievements", indexes = {
    @Index(name = "idx_achievement_code", columnList = "code", unique = true),
    @Index(name = "idx_achievement_type", columnList = "type"),
    @Index(name = "idx_achievement_active", columnList = "is_active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code; // JEJU_COMPLETE, EUROPE_TOUR, FIRST_NFT 등

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "badge_image_url", length = 500)
    private String badgeImageUrl; // 배지 NFT 이미지

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private AchievementType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "rarity", nullable = false, length = 20)
    private Rarity rarity;

    @Column(name = "point_reward", nullable = false)
    @Builder.Default
    private Integer pointReward = 0;

    @Column(name = "grants_badge_nft", nullable = false)
    @Builder.Default
    private Boolean grantsBadgeNft = false; // 배지 NFT 발행 여부

    @Column(name = "condition_json", columnDefinition = "TEXT")
    private String conditionJson; // {"type": "COLLECT_COUNT", "region": "JEJU", "count": 10}

    @Column(name = "target_count")
    private Integer targetCount; // 목표 수량

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * 업적이 카운트 기반인지 확인
     */
    public boolean isCountBased() {
        return targetCount != null && targetCount > 0;
    }
}
