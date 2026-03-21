package com.travelmate.repository;

import com.travelmate.entity.TravelReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TravelReviewRepository extends JpaRepository<TravelReview, Long> {

    /**
     * 특정 사용자가 받은 리뷰 목록 (reviewer fetch join으로 N+1 방지)
     */
    @Query("SELECT r FROM TravelReview r " +
           "LEFT JOIN FETCH r.reviewer " +
           "WHERE r.reviewee.id = :revieweeId " +
           "ORDER BY r.createdAt DESC")
    List<TravelReview> findByRevieweeIdWithReviewer(@Param("revieweeId") Long revieweeId);

    /**
     * 특정 매칭에 대한 리뷰 목록 (양쪽 평가 포함)
     */
    @Query("SELECT r FROM TravelReview r " +
           "LEFT JOIN FETCH r.reviewer " +
           "LEFT JOIN FETCH r.reviewee " +
           "WHERE r.matchRequest.id = :matchRequestId " +
           "ORDER BY r.createdAt ASC")
    List<TravelReview> findByMatchRequestIdWithUsers(@Param("matchRequestId") Long matchRequestId);

    /**
     * 중복 평가 확인: 동일 reviewer + matchRequest 조합
     */
    boolean existsByReviewerIdAndMatchRequestId(Long reviewerId, Long matchRequestId);

    /**
     * 특정 사용자가 받은 리뷰의 평균 점수 (세 항목 평균)
     */
    @Query("SELECT AVG((r.punctualityScore + r.mannersScore + r.communicationScore) / 3.0) " +
           "FROM TravelReview r WHERE r.reviewee.id = :revieweeId")
    Double getAverageScoreByRevieweeId(@Param("revieweeId") Long revieweeId);

    /**
     * 특정 사용자가 받은 리뷰 수
     */
    @Query("SELECT COUNT(r) FROM TravelReview r WHERE r.reviewee.id = :revieweeId")
    Integer getReviewCountByRevieweeId(@Param("revieweeId") Long revieweeId);
}
