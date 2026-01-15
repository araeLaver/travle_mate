package com.travelmate.repository;

import com.travelmate.entity.Comment;
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
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 게시글의 최상위 댓글 조회 (부모가 없는 댓글)
    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.parentComment IS NULL AND c.isDeleted = false ORDER BY c.createdAt DESC")
    Page<Comment> findTopLevelCommentsByPostId(@Param("postId") Long postId, Pageable pageable);

    // 특정 댓글의 답글 조회
    @Query("SELECT c FROM Comment c WHERE c.parentComment.id = :parentId AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentId(@Param("parentId") Long parentId);

    // 게시글의 전체 댓글 수 조회
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.post.id = :postId AND c.isDeleted = false")
    Long countByPostId(@Param("postId") Long postId);

    // 특정 사용자의 댓글 조회
    @Query("SELECT c FROM Comment c WHERE c.author.id = :userId AND c.isDeleted = false ORDER BY c.createdAt DESC")
    Page<Comment> findByAuthorId(@Param("userId") Long userId, Pageable pageable);

    // 게시글의 모든 댓글 조회 (삭제되지 않은)
    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<Comment> findAllByPostId(@Param("postId") Long postId);

    // 특정 댓글 조회 (삭제되지 않은)
    @Query("SELECT c FROM Comment c WHERE c.id = :id AND c.isDeleted = false")
    Optional<Comment> findByIdAndNotDeleted(@Param("id") Long id);

    // 좋아요 수 업데이트
    @Modifying
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount + :delta WHERE c.id = :commentId")
    void updateLikeCount(@Param("commentId") Long commentId, @Param("delta") int delta);

    // 게시글의 최근 댓글 N개 조회
    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Comment> findRecentCommentsByPostId(@Param("postId") Long postId, Pageable pageable);
}
