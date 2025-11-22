package com.travelmate.repository;

import com.travelmate.entity.UserReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserReviewRepository extends JpaRepository<UserReview, Long> {
    
    List<UserReview> findByRevieweeId(Long revieweeId);

    List<UserReview> findByReviewerId(Long reviewerId);

    boolean existsByReviewerIdAndRevieweeId(Long reviewerId, Long revieweeId);
    
    @Query("SELECT AVG(r.rating) FROM UserReview r WHERE r.reviewee.id = :userId")
    Double getAverageRatingByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM UserReview r WHERE r.reviewee.id = :userId")
    Integer getReviewCountByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM UserReview r WHERE r.reviewee.id = :userId ORDER BY r.createdAt DESC")
    List<UserReview> findByRevieweeIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}