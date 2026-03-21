package com.travelmate.entity.nft;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * NFT 트레이트 (속성) 엔티티
 * 각 NFT에 부여되는 고유 속성 (색상, 계절, 날씨, 시간대 등)
 */
@Entity
@Table(name = "nft_traits", indexes = {
    @Index(name = "idx_trait_collection", columnList = "nft_collection_id"),
    @Index(name = "idx_trait_type", columnList = "trait_type"),
    @Index(name = "idx_trait_value", columnList = "trait_value")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NftTrait {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nft_collection_id", nullable = false)
    private UserNftCollection nftCollection;

    @Column(name = "trait_type", nullable = false, length = 50)
    private String traitType; // SEASON, WEATHER, TIME_OF_DAY, MOOD, SPECIAL

    @Column(name = "trait_value", nullable = false, length = 100)
    private String traitValue; // spring, rainy, sunset, adventurous, first_visitor

    @Column(name = "rarity_modifier")
    @Builder.Default
    private Double rarityModifier = 1.0; // 1.0 = normal, 1.5 = 50% more rare

    @Column(name = "point_bonus")
    @Builder.Default
    private Integer pointBonus = 0;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;
}
