package com.travelmate.entity.nft;

import com.travelmate.entity.User;
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
 * NFT 경매 엔티티
 * NFT를 경매 방식으로 판매
 */
@Entity
@Table(name = "nft_auctions", indexes = {
    @Index(name = "idx_auction_seller", columnList = "seller_id"),
    @Index(name = "idx_auction_nft", columnList = "nft_collection_id"),
    @Index(name = "idx_auction_status", columnList = "status"),
    @Index(name = "idx_auction_end", columnList = "end_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NftAuction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nft_collection_id", nullable = false)
    private UserNftCollection nftCollection;

    @Column(name = "starting_price", nullable = false)
    private Long startingPrice; // 시작가 (포인트)

    @Column(name = "current_price", nullable = false)
    private Long currentPrice;

    @Column(name = "min_bid_increment", nullable = false)
    @Builder.Default
    private Long minBidIncrement = 100L;

    @Column(name = "buy_now_price")
    private Long buyNowPrice; // 즉시 구매가 (선택)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "highest_bidder_id")
    private User highestBidder;

    @Column(name = "bid_count")
    @Builder.Default
    private Integer bidCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AuctionStatus status = AuctionStatus.ACTIVE;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "auction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AuctionBid> bids = new ArrayList<>();

    public boolean isActive() {
        return status == AuctionStatus.ACTIVE
            && LocalDateTime.now().isAfter(startAt)
            && LocalDateTime.now().isBefore(endAt);
    }

    public boolean isEnded() {
        return LocalDateTime.now().isAfter(endAt) || status != AuctionStatus.ACTIVE;
    }

    public enum AuctionStatus {
        ACTIVE,
        SOLD,
        SETTLED,
        CANCELLED,
        NO_BIDS
    }
}
