package com.travelmate.repository;

import com.travelmate.entity.TravelItinerary;
import com.travelmate.entity.TravelItinerary.ItineraryVisibility;
import com.travelmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelItineraryRepository extends JpaRepository<TravelItinerary, Long> {

    // 소유자별 일정 조회
    Page<TravelItinerary> findByOwnerOrderByStartDateDesc(User owner, Pageable pageable);

    List<TravelItinerary> findByOwnerOrderByStartDateDesc(User owner);

    // 공유 코드로 조회
    Optional<TravelItinerary> findByShareCode(String shareCode);

    // 공개 일정 조회
    @Query("SELECT ti FROM TravelItinerary ti WHERE ti.visibility = :visibility ORDER BY ti.createdAt DESC")
    Page<TravelItinerary> findByVisibility(@Param("visibility") ItineraryVisibility visibility, Pageable pageable);

    // 인기 일정 조회 (조회수 + 좋아요 기반)
    @Query("SELECT ti FROM TravelItinerary ti WHERE ti.visibility = 'PUBLIC' " +
            "ORDER BY (ti.viewCount + ti.likeCount * 5) DESC")
    Page<TravelItinerary> findPopularItineraries(Pageable pageable);

    // 팔로워에게 공개된 일정 조회
    @Query("SELECT ti FROM TravelItinerary ti " +
            "WHERE ti.owner.id IN :followingIds " +
            "AND ti.visibility IN ('PUBLIC', 'FOLLOWERS') " +
            "ORDER BY ti.createdAt DESC")
    Page<TravelItinerary> findByFollowing(@Param("followingIds") List<Long> followingIds, Pageable pageable);

    // 협업 일정 조회
    @Query("SELECT DISTINCT ti FROM TravelItinerary ti " +
            "JOIN ti.collaborators c " +
            "WHERE c.user.id = :userId AND c.status = 'ACCEPTED' " +
            "ORDER BY ti.startDate DESC")
    Page<TravelItinerary> findCollaboratingItineraries(@Param("userId") Long userId, Pageable pageable);

    // 검색
    @Query("SELECT ti FROM TravelItinerary ti " +
            "WHERE ti.visibility = 'PUBLIC' " +
            "AND (LOWER(ti.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(ti.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY ti.createdAt DESC")
    Page<TravelItinerary> searchPublicItineraries(@Param("keyword") String keyword, Pageable pageable);

    // 조회수 증가
    @Modifying
    @Query("UPDATE TravelItinerary ti SET ti.viewCount = ti.viewCount + 1 WHERE ti.id = :id")
    void incrementViewCount(@Param("id") Long id);

    // 좋아요 수 증가
    @Modifying
    @Query("UPDATE TravelItinerary ti SET ti.likeCount = ti.likeCount + 1 WHERE ti.id = :id")
    void incrementLikeCount(@Param("id") Long id);

    // 좋아요 수 감소
    @Modifying
    @Query("UPDATE TravelItinerary ti SET ti.likeCount = ti.likeCount - 1 WHERE ti.id = :id AND ti.likeCount > 0")
    void decrementLikeCount(@Param("id") Long id);

    // 복사 수 증가
    @Modifying
    @Query("UPDATE TravelItinerary ti SET ti.copyCount = ti.copyCount + 1 WHERE ti.id = :id")
    void incrementCopyCount(@Param("id") Long id);

    // 특정 기간의 일정 조회
    @Query("SELECT ti FROM TravelItinerary ti " +
            "WHERE ti.owner.id = :userId " +
            "AND ((ti.startDate <= :endDate AND ti.endDate >= :startDate))")
    List<TravelItinerary> findOverlappingItineraries(
            @Param("userId") Long userId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate);
}
