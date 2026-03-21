package com.travelmate.repository;

import com.travelmate.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * ID로 게시글 조회 - author와 images를 함께 로드하여 N+1 방지
     */
    @EntityGraph(attributePaths = {"author", "images"})
    Optional<Post> findById(Long id);

    /**
     * 카테고리별 게시글 조회 - author와 images 함께 로드
     */
    @Query("SELECT DISTINCT p FROM Post p " +
           "LEFT JOIN FETCH p.author " +
           "LEFT JOIN FETCH p.images " +
           "WHERE p.category = :category")
    Page<Post> findByCategoryWithDetails(@Param("category") Post.Category category, Pageable pageable);

    Page<Post> findByCategory(Post.Category category, Pageable pageable);
    
    @Query("SELECT p FROM Post p WHERE " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:keyword IS NULL OR p.title LIKE %:keyword% OR p.content LIKE %:keyword%) AND " +
           "(:location IS NULL OR p.locationName LIKE %:location%)")
    Page<Post> findPostsWithFilters(@Param("category") Post.Category category,
                                   @Param("keyword") String keyword,
                                   @Param("location") String location,
                                   Pageable pageable);
    
    @Query("SELECT p FROM Post p WHERE p.locationLatitude IS NOT NULL AND p.locationLongitude IS NOT NULL " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(p.locationLatitude)) * " +
           "cos(radians(p.locationLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(p.locationLatitude)))) <= :radiusKm " +
           "ORDER BY p.createdAt DESC")
    List<Post> findNearbyPosts(@Param("latitude") Double latitude,
                              @Param("longitude") Double longitude,
                              @Param("radiusKm") Double radiusKm);
    
    @Query("SELECT p FROM Post p WHERE p.createdAt >= :since " +
           "ORDER BY (p.likeCount * 2 + p.commentCount + p.viewCount * 0.1) DESC")
    List<Post> findTrendingPosts(@Param("since") LocalDateTime since, Pageable pageable);
    
    @Query("SELECT p FROM Post p WHERE p.isPinned = true ORDER BY p.createdAt DESC")
    List<Post> findPinnedPosts();
    
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}