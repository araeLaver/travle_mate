package com.travelmate.repository;

import com.travelmate.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);
    
    Long countByPostId(Long postId);
    
    void deleteByPostIdAndUserId(Long postId, Long userId);
}