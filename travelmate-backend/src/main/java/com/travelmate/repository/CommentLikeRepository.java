package com.travelmate.repository;

import com.travelmate.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    Long countByCommentId(Long commentId);

    void deleteByCommentIdAndUserId(Long commentId, Long userId);

    // 특정 게시글 댓글들에 대한 사용자의 좋아요 여부 조회
    @Query("SELECT cl.comment.id FROM CommentLike cl WHERE cl.user.id = :userId AND cl.comment.id IN :commentIds")
    List<Long> findLikedCommentIdsByUserIdAndCommentIds(@Param("userId") Long userId, @Param("commentIds") List<Long> commentIds);
}
