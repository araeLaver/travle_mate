package com.travelmate.repository;

import com.travelmate.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostImageRepository extends JpaRepository<PostImage, Long> {
    
    List<PostImage> findByPostIdOrderByDisplayOrder(Long postId);
    
    void deleteByPostId(Long postId);
}