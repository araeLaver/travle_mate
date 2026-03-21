package com.travelmate.entity.nft;

import com.travelmate.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * NFT 마켓플레이스 리스팅 엔티티
 * NFT 판매 등록 정보
 */
@Entity
@Table(name = "nft_marketplace_listings", indexes = {
    @Index(name = "idx_listing_seller", columnList = "seller_id"),
    @Index(name = "idx_listing_nft", columnList = "nft_collection_id"),
    @Index(name = "idx_listing_status", columnList = "status"),
    @Index(name = "idx_listing_price_points", columnList = "price_in_points"),
    @Index(name = "idx_listing_created", columnList = "listed_at"),
    @Index(name = "idx_listing_expires", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NftMarketplaceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nft_collection_id", nullable = false)
    private UserNftCollection nftCollection;

    @Column(name = "price_in_points", nullable = false)
    private Long priceInPoints;

    @Column(name = "price_in_matic", precision = 18, scale = 8)
    private BigDecimal priceInMatic; // MATIC 가격 (옵션)

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ListingStatus status = ListingStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id")
    private User buyer;

    @Column(name = "buy_transaction_hash", length = 100)
    private String buyTransactionHash;

    @Column(name = "listed_at", nullable = false)
    private LocalDateTime listedAt;

    @Column(name = "sold_at")
    private LocalDateTime soldAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * 리스팅 생성 시 초기화
     */
    @PrePersist
    public void prePersist() {
        if (listedAt == null) {
            listedAt = LocalDateTime.now();
        }
        if (expiresAt == null) {
            expiresAt = listedAt.plusDays(30); // 기본 30일 만료
        }
    }

    /**
     * 리스팅이 활성 상태인지 확인
     */
    public boolean isActive() {
        return status == ListingStatus.ACTIVE
            && (expiresAt == null || LocalDateTime.now().isBefore(expiresAt));
    }

    /**
     * 리스팅 만료 여부 확인
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * 판매 완료 처리
     */
    public void markAsSold(User buyer, String transactionHash) {
        this.buyer = buyer;
        this.buyTransactionHash = transactionHash;
        this.status = ListingStatus.SOLD;
        this.soldAt = LocalDateTime.now();
    }

    /**
     * 취소 처리
     */
    public void cancel() {
        this.status = ListingStatus.CANCELLED;
    }
}
