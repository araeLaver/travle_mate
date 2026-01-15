package com.travelmate.repository.nft;

import com.travelmate.entity.nft.LocationReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LocationReviewRepository extends JpaRepository<LocationReview, Long> {

    // 장소별 리뷰 목록 (최신순)
    Page<LocationReview> findByLocationIdOrderByCreatedAtDesc(Long locationId, Pageable pageable);

    // 장소별 리뷰 목록 (도움됨 순)
    Page<LocationReview> findByLocationIdOrderByHelpfulCountDesc(Long locationId, Pageable pageable);

    // 사용자별 리뷰 목록
    Page<LocationReview> findByReviewerIdOrderByCreatedAtDesc(Long reviewerId, Pageable pageable);

    // 특정 사용자의 특정 장소 리뷰 조회
    Optional<LocationReview> findByReviewerIdAndLocationId(Long reviewerId, Long locationId);

    // 특정 장소의 평균 평점
    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM LocationReview r WHERE r.location.id = :locationId")
    Double getAverageRatingByLocationId(@Param("locationId") Long locationId);

    // 특정 장소의 리뷰 수
    long countByLocationId(Long locationId);

    // 특정 사용자가 해당 장소에 리뷰를 작성했는지 확인
    boolean existsByReviewerIdAndLocationId(Long reviewerId, Long locationId);

    // 사용자의 총 리뷰 수
    long countByReviewerId(Long reviewerId);

    // ===== Admin Dashboard Queries =====

    /**
     * 전체 리뷰 평균 평점
     */
    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM LocationReview r")
    Double getAverageRating();
}
