package com.travelmate.repository.nft;

import com.travelmate.entity.nft.ListingStatus;
import com.travelmate.entity.nft.NftMarketplaceListing;
import com.travelmate.entity.nft.Rarity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NftMarketplaceListingRepository extends JpaRepository<NftMarketplaceListing, Long> {

    /**
     * 활성 리스팅 조회
     */
    @Query("SELECT ml FROM NftMarketplaceListing ml WHERE ml.status = 'ACTIVE' " +
           "AND (ml.expiresAt IS NULL OR ml.expiresAt > CURRENT_TIMESTAMP) " +
           "ORDER BY ml.listedAt DESC")
    Page<NftMarketplaceListing> findActiveListings(Pageable pageable);

    /**
     * 판매자별 리스팅 조회
     */
    Page<NftMarketplaceListing> findBySellerIdOrderByListedAtDesc(Long sellerId, Pageable pageable);

    /**
     * 판매자의 활성 리스팅 조회
     */
    @Query("SELECT ml FROM NftMarketplaceListing ml WHERE ml.seller.id = :sellerId " +
           "AND ml.status = 'ACTIVE' ORDER BY ml.listedAt DESC")
    List<NftMarketplaceListing> findActiveListingsBySellerId(@Param("sellerId") Long sellerId);

    /**
     * 구매자별 구매 내역 조회
     */
    Page<NftMarketplaceListing> findByBuyerIdAndStatusOrderBySoldAtDesc(
            Long buyerId, ListingStatus status, Pageable pageable);

    /**
     * NFT 컬렉션 ID로 활성 리스팅 조회
     */
    @Query("SELECT ml FROM NftMarketplaceListing ml WHERE ml.nftCollection.id = :nftCollectionId " +
           "AND ml.status = 'ACTIVE'")
    Optional<NftMarketplaceListing> findActiveListingByNftCollectionId(
            @Param("nftCollectionId") Long nftCollectionId);

    /**
     * 가격 범위로 조회
     */
    @Query("SELECT ml FROM NftMarketplaceListing ml WHERE ml.status = 'ACTIVE' " +
           "AND ml.priceInPoints BETWEEN :minPrice AND :maxPrice " +
           "ORDER BY ml.priceInPoints ASC")
    Page<NftMarketplaceListing> findByPriceRange(
            @Param("minPrice") Long minPrice,
            @Param("maxPrice") Long maxPrice,
            Pageable pageable);

    /**
     * 희귀도별 조회
     */
    @Query("SELECT ml FROM NftMarketplaceListing ml WHERE ml.status = 'ACTIVE' " +
           "AND ml.nftCollection.location.rarity = :rarity ORDER BY ml.listedAt DESC")
    Page<NftMarketplaceListing> findByRarity(@Param("rarity") Rarity rarity, Pageable pageable);

    /**
     * 만료된 리스팅 조회
     */
    @Query("SELECT ml FROM NftMarketplaceListing ml WHERE ml.status = 'ACTIVE' " +
           "AND ml.expiresAt < CURRENT_TIMESTAMP")
    List<NftMarketplaceListing> findExpiredListings();

    /**
     * 만료된 리스팅 상태 업데이트
     */
    @Modifying
    @Query("UPDATE NftMarketplaceListing ml SET ml.status = 'EXPIRED' " +
           "WHERE ml.status = 'ACTIVE' AND ml.expiresAt < CURRENT_TIMESTAMP")
    int updateExpiredListings();

    /**
     * NFT가 이미 리스팅되어 있는지 확인
     */
    @Query("SELECT COUNT(ml) > 0 FROM NftMarketplaceListing ml " +
           "WHERE ml.nftCollection.id = :nftCollectionId AND ml.status = 'ACTIVE'")
    boolean isNftListed(@Param("nftCollectionId") Long nftCollectionId);

    /**
     * 거래 통계 조회
     */
    @Query("SELECT COUNT(ml), SUM(ml.priceInPoints) FROM NftMarketplaceListing ml " +
           "WHERE ml.status = 'SOLD' AND ml.soldAt >= :since")
    Object[] getTradeStatsSince(@Param("since") LocalDateTime since);

    /**
     * 인기 리스팅 조회 (최근 판매된 장소 기준)
     */
    @Query(value = """
        SELECT cl.id, cl.name, COUNT(ml.id) as sales_count
        FROM nft_marketplace_listings ml
        JOIN user_nft_collections nc ON ml.nft_collection_id = nc.id
        JOIN collectible_locations cl ON nc.location_id = cl.id
        WHERE ml.status = 'SOLD' AND ml.sold_at >= :since
        GROUP BY cl.id, cl.name
        ORDER BY sales_count DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> getPopularLocations(@Param("since") LocalDateTime since);
}
