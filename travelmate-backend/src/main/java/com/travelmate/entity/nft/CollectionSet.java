package com.travelmate.entity.nft;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 컬렉션 세트 엔티티
 * 특정 장소들을 모두 수집하면 보너스를 받는 세트 정의
 */
@Entity
@Table(name = "collection_sets", indexes = {
    @Index(name = "idx_set_active", columnList = "is_active"),
    @Index(name = "idx_set_region", columnList = "region")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectionSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "region", length = 100)
    private String region; // Tokyo, Seoul, Europe 등

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "badge_url", length = 500)
    private String badgeUrl; // 세트 완성 시 배지 이미지

    @Column(name = "bonus_points", nullable = false)
    @Builder.Default
    private Integer bonusPoints = 500;

    @Column(name = "bonus_title", length = 100)
    private String bonusTitle; // 세트 완성 시 얻는 칭호

    @Column(name = "required_count", nullable = false)
    private Integer requiredCount; // 필요 수집 개수

    @ManyToMany
    @JoinTable(
        name = "collection_set_locations",
        joinColumns = @JoinColumn(name = "set_id"),
        inverseJoinColumns = @JoinColumn(name = "location_id")
    )
    @Builder.Default
    private List<CollectibleLocation> locations = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_limited_time")
    @Builder.Default
    private Boolean isLimitedTime = false;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public boolean isAvailable() {
        if (!isActive) return false;
        if (!isLimitedTime) return true;
        LocalDateTime now = LocalDateTime.now();
        return (startAt == null || now.isAfter(startAt))
            && (endAt == null || now.isBefore(endAt));
    }
}
