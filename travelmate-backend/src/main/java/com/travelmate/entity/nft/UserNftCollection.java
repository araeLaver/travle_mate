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
 * 사용자 NFT 컬렉션 엔티티
 * 사용자가 수집한 NFT 정보
 */
@Entity
@Table(name = "user_nft_collections", indexes = {
    @Index(name = "idx_nft_user", columnList = "user_id"),
    @Index(name = "idx_nft_location", columnList = "location_id"),
    @Index(name = "idx_nft_user_location", columnList = "user_id, location_id", unique = true),
    @Index(name = "idx_nft_mint_status", columnList = "mint_status"),
    @Index(name = "idx_nft_collected_at", columnList = "collected_at"),
    @Index(name = "idx_nft_token_id", columnList = "token_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNftCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private CollectibleLocation location;

    // Polygon 블록체인 정보
    @Column(name = "token_id", length = 100)
    private String tokenId;

    @Column(name = "contract_address", length = 100)
    private String contractAddress;

    @Column(name = "transaction_hash", length = 100)
    private String transactionHash;

    @Column(name = "wallet_address", length = 100)
    private String walletAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "mint_status", nullable = false, length = 20)
    @Builder.Default
    private MintStatus mintStatus = MintStatus.PENDING;

    // 수집 위치 정보
    @Column(name = "collected_latitude", nullable = false)
    private Double collectedLatitude;

    @Column(name = "collected_longitude", nullable = false)
    private Double collectedLongitude;

    @Column(name = "collected_at", nullable = false)
    private LocalDateTime collectedAt;

    // GPS 검증 정보
    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "gps_accuracy", length = 50)
    private String gpsAccuracy;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "verification_method", length = 50)
    private String verificationMethod; // GPS, WIFI, CELL_TOWER

    @Column(name = "earned_points")
    private Integer earnedPoints;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * NFT가 성공적으로 민팅되었는지 확인
     */
    public boolean isMinted() {
        return mintStatus == MintStatus.MINTED && tokenId != null;
    }
}
