package com.travelmate.repository.nft;

import com.travelmate.entity.nft.LocationCategory;
import com.travelmate.entity.nft.MintStatus;
import com.travelmate.entity.nft.Rarity;
import com.travelmate.entity.nft.UserNftCollection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserNftCollectionRepository extends JpaRepository<UserNftCollection, Long> {

    /**
     * 사용자의 NFT 컬렉션 조회
     */
    List<UserNftCollection> findByUserId(Long userId);

    /**
     * 사용자의 NFT 컬렉션 페이징 조회
     */
    Page<UserNftCollection> findByUserId(Long userId, Pageable pageable);

    /**
     * 사용자가 특정 장소를 이미 수집했는지 확인
     */
    boolean existsByUserIdAndLocationId(Long userId, Long locationId);

    /**
     * 사용자의 특정 장소 수집 정보 조회
     */
    Optional<UserNftCollection> findByUserIdAndLocationId(Long userId, Long locationId);

    /**
     * 민팅 상태별 조회
     */
    List<UserNftCollection> findByMintStatus(MintStatus mintStatus);

    /**
     * 사용자의 민팅된 NFT 수 조회
     */
    @Query("SELECT COUNT(nc) FROM UserNftCollection nc " +
           "WHERE nc.user.id = :userId AND nc.mintStatus = 'MINTED'")
    int countMintedByUserId(@Param("userId") Long userId);

    /**
     * 특정 지역의 사용자 수집 정보 조회
     */
    @Query("SELECT nc FROM UserNftCollection nc " +
           "WHERE nc.user.id = :userId AND nc.location.region = :region")
    List<UserNftCollection> findByUserIdAndRegion(
            @Param("userId") Long userId,
            @Param("region") String region);

    /**
     * 지역별 수집 진행도 조회
     */
    @Query(value = """
        SELECT
            cl.region,
            cl.country,
            COUNT(DISTINCT cl.id) as total,
            COUNT(DISTINCT nc.location_id) as collected,
            CASE WHEN COUNT(DISTINCT cl.id) > 0
                 THEN CAST(COUNT(DISTINCT nc.location_id) AS DOUBLE PRECISION) / COUNT(DISTINCT cl.id) * 100
                 ELSE 0 END as completion_rate
        FROM collectible_locations cl
        LEFT JOIN user_nft_collections nc ON cl.id = nc.location_id AND nc.user_id = :userId
        WHERE cl.is_active = true
        GROUP BY cl.region, cl.country
        """, nativeQuery = true)
    List<Object[]> getCollectionProgressByRegion(@Param("userId") Long userId);

    /**
     * 사용자의 총 수집 수
     */
    int countByUserId(Long userId);

    /**
     * 사용자의 고유 방문 지역 수
     */
    @Query("SELECT COUNT(DISTINCT nc.location.region) FROM UserNftCollection nc " +
           "WHERE nc.user.id = :userId")
    int countDistinctRegionsByUserId(@Param("userId") Long userId);

    /**
     * 토큰 ID로 조회
     */
    Optional<UserNftCollection> findByTokenId(String tokenId);

    /**
     * 최근 수집 내역 조회
     */
    @Query("SELECT nc FROM UserNftCollection nc ORDER BY nc.collectedAt DESC")
    List<UserNftCollection> findRecentCollections(Pageable pageable);

    /**
     * 사용자의 NFT 컬렉션 조회 (수집일 내림차순)
     */
    Page<UserNftCollection> findByUserIdOrderByCollectedAtDesc(Long userId, Pageable pageable);

    /**
     * 사용자의 희귀도별 컬렉션 조회
     */
    @Query("SELECT nc FROM UserNftCollection nc WHERE nc.user.id = :userId " +
           "AND nc.location.rarity = :rarity ORDER BY nc.collectedAt DESC")
    Page<UserNftCollection> findByUserIdAndRarity(
            @Param("userId") Long userId,
            @Param("rarity") Rarity rarity,
            Pageable pageable);

    /**
     * 사용자의 고유 방문 장소 수 조회
     */
    @Query("SELECT COUNT(DISTINCT nc.location.id) FROM UserNftCollection nc WHERE nc.user.id = :userId")
    int countDistinctLocationsByUserId(@Param("userId") Long userId);

    /**
     * 사용자의 희귀도별 수집 수 조회
     */
    @Query("SELECT COUNT(nc) FROM UserNftCollection nc WHERE nc.user.id = :userId " +
           "AND nc.location.rarity = :rarity")
    int countByUserIdAndRarity(@Param("userId") Long userId, @Param("rarity") Rarity rarity);

    /**
     * 사용자의 카테고리별 수집 수 조회
     */
    @Query("SELECT COUNT(nc) FROM UserNftCollection nc WHERE nc.user.id = :userId " +
           "AND nc.location.category = :category")
    int countByUserIdAndCategory(@Param("userId") Long userId, @Param("category") LocationCategory category);

    /**
     * 사용자의 지역별 수집 수 조회
     */
    @Query("SELECT COUNT(nc) FROM UserNftCollection nc WHERE nc.user.id = :userId " +
           "AND nc.location.region = :region")
    int countByUserIdAndRegion(@Param("userId") Long userId, @Param("region") String region);

    /**
     * 카테고리별 수집 진행도 조회
     */
    @Query(value = """
        SELECT
            cl.category,
            COUNT(DISTINCT cl.id) as total,
            COUNT(DISTINCT nc.location_id) as collected,
            CASE WHEN COUNT(DISTINCT cl.id) > 0
                 THEN CAST(COUNT(DISTINCT nc.location_id) AS DOUBLE PRECISION) / COUNT(DISTINCT cl.id) * 100
                 ELSE 0 END as completion_rate
        FROM collectible_locations cl
        LEFT JOIN user_nft_collections nc ON cl.id = nc.location_id AND nc.user_id = :userId
        WHERE cl.is_active = true
        GROUP BY cl.category
        """, nativeQuery = true)
    List<Object[]> getCollectionProgressByCategory(@Param("userId") Long userId);

    /**
     * 사용자의 특정 지갑 주소로 민팅된 NFT 수 조회
     */
    @Query("SELECT COUNT(nc) FROM UserNftCollection nc " +
           "WHERE nc.user.id = :userId AND nc.walletAddress = :walletAddress AND nc.mintStatus = 'MINTED'")
    int countByUserIdAndWalletAddress(@Param("userId") Long userId, @Param("walletAddress") String walletAddress);

    /**
     * 지갑 주소로 NFT 조회
     */
    List<UserNftCollection> findByWalletAddress(String walletAddress);

    /**
     * 사용자의 지갑 주소로 민팅된 NFT 조회
     */
    @Query("SELECT nc FROM UserNftCollection nc " +
           "WHERE nc.user.id = :userId AND nc.walletAddress = :walletAddress AND nc.mintStatus = 'MINTED'")
    List<UserNftCollection> findMintedByUserIdAndWalletAddress(
            @Param("userId") Long userId, @Param("walletAddress") String walletAddress);

    /**
     * 사용자의 희귀도별 수집 수 일괄 조회 (N+1 방지)
     * 결과: [0]=COMMON, [1]=RARE, [2]=EPIC, [3]=LEGENDARY 순서
     */
    @Query("SELECT nc.location.rarity, COUNT(nc) FROM UserNftCollection nc " +
           "WHERE nc.user.id = :userId GROUP BY nc.location.rarity")
    List<Object[]> countByUserIdGroupByRarity(@Param("userId") Long userId);

    /**
     * 사용자가 수집한 장소 ID 목록 조회 (배치 체크용)
     */
    @Query("SELECT nc.location.id FROM UserNftCollection nc WHERE nc.user.id = :userId")
    List<Long> findCollectedLocationIdsByUserId(@Param("userId") Long userId);

    /**
     * NFT 컬렉션 조회 시 location 함께 로드 (N+1 방지)
     */
    @Query("SELECT nc FROM UserNftCollection nc " +
           "LEFT JOIN FETCH nc.location " +
           "WHERE nc.user.id = :userId " +
           "ORDER BY nc.collectedAt DESC")
    Page<UserNftCollection> findByUserIdWithLocation(@Param("userId") Long userId, Pageable pageable);
}
