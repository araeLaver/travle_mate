package com.travelmate.repository.nft;

import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.LocationCategory;
import com.travelmate.entity.nft.Rarity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectibleLocationRepository extends JpaRepository<CollectibleLocation, Long> {

    /**
     * 활성화된 장소 목록 조회
     */
    List<CollectibleLocation> findByIsActiveTrue();

    /**
     * 특정 지역의 장소 목록 조회
     */
    List<CollectibleLocation> findByRegionAndIsActiveTrue(String region);

    /**
     * 특정 국가의 장소 목록 조회
     */
    List<CollectibleLocation> findByCountryAndIsActiveTrue(String country);

    /**
     * 카테고리별 장소 조회
     */
    List<CollectibleLocation> findByCategoryAndIsActiveTrue(LocationCategory category);

    /**
     * 희귀도별 장소 조회
     */
    List<CollectibleLocation> findByRarityAndIsActiveTrue(Rarity rarity);

    /**
     * 반경 내 장소 조회 (Haversine 공식)
     */
    @Query(value = """
        SELECT * FROM collectible_locations cl
        WHERE cl.is_active = true
        AND (6371000 * acos(cos(radians(:lat)) * cos(radians(cl.latitude))
            * cos(radians(cl.longitude) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(cl.latitude)))) <= :radiusMeters
        """, nativeQuery = true)
    List<CollectibleLocation> findNearbyLocations(
            @Param("lat") double latitude,
            @Param("lng") double longitude,
            @Param("radiusMeters") double radiusMeters);

    /**
     * 이벤트 장소 조회
     */
    @Query("SELECT cl FROM CollectibleLocation cl WHERE cl.isSeasonalEvent = true " +
           "AND cl.isActive = true AND cl.eventStartAt <= CURRENT_TIMESTAMP " +
           "AND cl.eventEndAt >= CURRENT_TIMESTAMP")
    List<CollectibleLocation> findActiveEventLocations();

    /**
     * 지역별 장소 수 조회
     */
    @Query("SELECT cl.region, COUNT(cl) FROM CollectibleLocation cl " +
           "WHERE cl.isActive = true GROUP BY cl.region")
    List<Object[]> countByRegion();

    /**
     * 페이징 조회
     */
    Page<CollectibleLocation> findByIsActiveTrue(Pageable pageable);

    /**
     * 카테고리별 장소 조회 (페이징)
     */
    Page<CollectibleLocation> findByCategoryAndIsActiveTrue(LocationCategory category, Pageable pageable);

    /**
     * 반경 내 활성 장소 조회 (km 단위)
     */
    @Query(value = """
        SELECT * FROM collectible_locations cl
        WHERE cl.is_active = true
        AND (6371 * acos(cos(radians(:lat)) * cos(radians(cl.latitude))
            * cos(radians(cl.longitude) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(cl.latitude)))) <= :radiusKm
        ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(cl.latitude))
            * cos(radians(cl.longitude) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(cl.latitude)))) ASC
        """, nativeQuery = true)
    List<CollectibleLocation> findNearbyActiveLocations(
            @Param("lat") Double latitude,
            @Param("lng") Double longitude,
            @Param("radiusKm") Double radiusKm);

    /**
     * 검색 (이름 또는 설명에 키워드 포함)
     */
    @Query("SELECT cl FROM CollectibleLocation cl WHERE cl.isActive = true " +
           "AND (LOWER(cl.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(cl.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<CollectibleLocation> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 활성 시즌 이벤트 장소 조회
     */
    List<CollectibleLocation> findByIsSeasonalEventTrueAndIsActiveTrue();

    /**
     * 활성 장소 수 카운트
     */
    long countByIsActiveTrue();

    /**
     * 시즌 이벤트 장소 수 카운트
     */
    long countByIsSeasonalEventTrue();

    /**
     * 희귀도별 장소 수 카운트
     */
    int countByRarity(Rarity rarity);

    // ===== Admin Dashboard Queries =====

    /**
     * 관리자용 장소 검색 (검색어, 카테고리, 희귀도, 활성상태 필터)
     */
    @Query("SELECT cl FROM CollectibleLocation cl WHERE " +
           "(:search IS NULL OR LOWER(cl.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "    OR LOWER(cl.region) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:category IS NULL OR CAST(cl.category AS string) = :category) AND " +
           "(:rarity IS NULL OR CAST(cl.rarity AS string) = :rarity) AND " +
           "(:isActive IS NULL OR cl.isActive = :isActive)")
    Page<CollectibleLocation> findLocationsForAdmin(
            @Param("search") String search,
            @Param("category") String category,
            @Param("rarity") String rarity,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}
