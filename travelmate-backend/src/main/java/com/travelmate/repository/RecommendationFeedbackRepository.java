package com.travelmate.repository;

import com.travelmate.entity.RecommendationFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RecommendationFeedbackRepository extends JpaRepository<RecommendationFeedback, Long> {

    List<RecommendationFeedback> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);

    long countByRating(Integer rating);

    long countByRatingLessThanEqual(Integer rating);

    long countByCreatedAtAfter(LocalDateTime createdAt);

    @Query("select avg(f.rating) from RecommendationFeedback f")
    Double getAverageRating();

    @Query(value = """
            select f from RecommendationFeedback f
            join fetch f.user u
            where (:userId is null or u.id = :userId)
              and (:rating is null or f.rating = :rating)
              and (:feedbackType is null or lower(f.feedbackType) = lower(:feedbackType))
              and (:targetType is null or lower(f.targetType) = lower(:targetType))
            """,
            countQuery = """
            select count(f) from RecommendationFeedback f
            where (:userId is null or f.user.id = :userId)
              and (:rating is null or f.rating = :rating)
              and (:feedbackType is null or lower(f.feedbackType) = lower(:feedbackType))
              and (:targetType is null or lower(f.targetType) = lower(:targetType))
            """)
    Page<RecommendationFeedback> findForAdmin(
            @Param("userId") Long userId,
            @Param("rating") Integer rating,
            @Param("feedbackType") String feedbackType,
            @Param("targetType") String targetType,
            Pageable pageable);

    @Query("""
            select f.feedbackType, count(f)
            from RecommendationFeedback f
            where f.feedbackType is not null
            group by f.feedbackType
            """)
    List<Object[]> countByFeedbackType();

    @Query("""
            select f.targetType, count(f)
            from RecommendationFeedback f
            where f.targetType is not null
            group by f.targetType
            """)
    List<Object[]> countByTargetType();
}
