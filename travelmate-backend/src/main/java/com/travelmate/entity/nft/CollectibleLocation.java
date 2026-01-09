package com.travelmate.entity.nft;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 수집 가능한 장소 엔티티
 * 특정 위치에서 NFT를 수집할 수 있는 장소 정보
 */
@Entity
@Table(name = "collectible_locations", indexes = {
    @Index(name = "idx_collectible_location", columnList = "latitude, longitude"),
    @Index(name = "idx_collectible_country", columnList = "country"),
    @Index(name = "idx_collectible_region", columnList = "region"),
    @Index(name = "idx_collectible_rarity", columnList = "rarity"),
    @Index(name = "idx_collectible_active", columnList = "is_active"),
    @Index(name = "idx_collectible_event", columnList = "is_seasonal_event, event_start_at, event_end_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectibleLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "collect_radius", nullable = false)
    private Double collectRadius; // 수집 가능 반경 (미터)

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private LocationCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "rarity", nullable = false, length = 20)
    private Rarity rarity;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "region", length = 100)
    private String region; // 지역 그룹 (제주도, 유럽 등)

    @Column(name = "image_url", length = 500)
    private String imageUrl; // 장소 이미지

    @Column(name = "nft_image_url", length = 500)
    private String nftImageUrl; // NFT 이미지 (IPFS URI)

    @Column(name = "nft_metadata_uri", length = 500)
    private String nftMetadataUri; // NFT 메타데이터 URI

    @Column(name = "point_reward")
    private Integer pointReward; // 수집 시 포인트 보상

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_seasonal_event", nullable = false)
    @Builder.Default
    private Boolean isSeasonalEvent = false;

    @Column(name = "event_start_at")
    private LocalDateTime eventStartAt;

    @Column(name = "event_end_at")
    private LocalDateTime eventEndAt;

    @Column(name = "total_collected")
    @Builder.Default
    private Integer totalCollected = 0; // 총 수집 횟수

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 현재 이벤트가 활성화 상태인지 확인
     */
    public boolean isEventActive() {
        if (!isSeasonalEvent) return true;
        LocalDateTime now = LocalDateTime.now();
        return eventStartAt != null && eventEndAt != null
            && now.isAfter(eventStartAt) && now.isBefore(eventEndAt);
    }

    /**
     * 포인트 보상 계산 (기본값 또는 커스텀)
     */
    public int getEffectivePointReward() {
        return pointReward != null ? pointReward : rarity.getBasePointReward();
    }
}
