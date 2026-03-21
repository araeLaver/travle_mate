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
 * 경매 입찰 엔티티
 */
@Entity
@Table(name = "auction_bids", indexes = {
    @Index(name = "idx_bid_auction", columnList = "auction_id"),
    @Index(name = "idx_bid_bidder", columnList = "bidder_id"),
    @Index(name = "idx_bid_amount", columnList = "bid_amount")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionBid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private NftAuction auction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private User bidder;

    @Column(name = "bid_amount", nullable = false)
    private Long bidAmount;

    @Column(name = "is_winning")
    @Builder.Default
    private Boolean isWinning = false;

    @CreationTimestamp
    @Column(name = "bid_at")
    private LocalDateTime bidAt;
}
