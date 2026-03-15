package com.travelmate.repository.nft;

import com.travelmate.entity.nft.AuctionBid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionBidRepository extends JpaRepository<AuctionBid, Long> {
    List<AuctionBid> findByAuctionIdOrderByBidAmountDesc(Long auctionId);
    Optional<AuctionBid> findTopByAuctionIdOrderByBidAmountDesc(Long auctionId);
    List<AuctionBid> findByBidderId(Long bidderId);
    long countByAuctionId(Long auctionId);
}
