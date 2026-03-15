package com.travelmate.repository.nft;

import com.travelmate.entity.nft.NftAuction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NftAuctionRepository extends JpaRepository<NftAuction, Long> {

    Page<NftAuction> findByStatusOrderByEndAtAsc(NftAuction.AuctionStatus status, Pageable pageable);

    List<NftAuction> findBySellerId(Long sellerId);

    @Query("SELECT a FROM NftAuction a WHERE a.highestBidder.id = :userId AND a.status = 'ACTIVE'")
    List<NftAuction> findActiveByBidderId(Long userId);

    @Query("SELECT a FROM NftAuction a WHERE a.status = 'ACTIVE' AND a.endAt < :now")
    List<NftAuction> findExpiredAuctions(LocalDateTime now);

    boolean existsByNftCollectionIdAndStatus(Long nftCollectionId, NftAuction.AuctionStatus status);
}
