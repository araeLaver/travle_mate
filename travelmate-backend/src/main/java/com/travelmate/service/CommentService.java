package com.travelmate.service;

import com.travelmate.dto.CommentDto;
import com.travelmate.entity.Comment;
import com.travelmate.entity.CommentLike;
import com.travelmate.entity.Post;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.CommentLikeRepository;
import com.travelmate.repository.CommentRepository;
import com.travelmate.repository.PostRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 댓글 작성
     */
    @Transactional
    public CommentDto.Response createComment(Long userId, Long postId, CommentDto.CreateRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException("게시글을 찾을 수 없습니다."));

        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setAuthor(author);
        comment.setPost(post);
        comment.setLikeCount(0);
        comment.setIsDeleted(false);

        // 답글인 경우 부모 댓글 설정
        if (request.getParentCommentId() != null) {
            Comment parentComment = commentRepository.findByIdAndNotDeleted(request.getParentCommentId())
                    .orElseThrow(() -> new BusinessException("부모 댓글을 찾을 수 없습니다."));

            // 동일 게시글의 댓글인지 확인
            if (!parentComment.getPost().getId().equals(postId)) {
                throw new BusinessException("잘못된 부모 댓글입니다.");
            }

            comment.setParentComment(parentComment);

            // 답글 알림 전송 (부모 댓글 작성자에게)
            if (!parentComment.getAuthor().getId().equals(userId)) {
                notificationService.sendCommentReplyNotification(parentComment.getAuthor(), author, post, comment);
            }
        }

        Comment savedComment = commentRepository.save(comment);

        // 게시글 작성자에게 알림 전송 (본인 글이 아닌 경우)
        if (!post.getAuthor().getId().equals(userId)) {
            notificationService.sendCommentNotification(post.getAuthor(), author, post, savedComment);
        }

        // 멘션 알림 전송
        if (request.getMentionedUserIds() != null && !request.getMentionedUserIds().isEmpty()) {
            sendMentionNotifications(request.getMentionedUserIds(), author, post, savedComment);
        }

        // 게시글의 댓글 수 업데이트
        updatePostCommentCount(post);

        return toResponse(savedComment, userId, true);
    }

    /**
     * 댓글 수정
     */
    @Transactional
    public CommentDto.Response updateComment(Long userId, Long commentId, CommentDto.UpdateRequest request) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new BusinessException("댓글을 찾을 수 없습니다."));

        // 권한 확인
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new BusinessException("댓글을 수정할 권한이 없습니다.");
        }

        comment.setContent(request.getContent());
        Comment updatedComment = commentRepository.save(comment);

        return toResponse(updatedComment, userId, true);
    }

    /**
     * 댓글 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new BusinessException("댓글을 찾을 수 없습니다."));

        // 권한 확인 (작성자 또는 게시글 작성자)
        if (!comment.getAuthor().getId().equals(userId) &&
            !comment.getPost().getAuthor().getId().equals(userId)) {
            throw new BusinessException("댓글을 삭제할 권한이 없습니다.");
        }

        comment.setIsDeleted(true);
        commentRepository.save(comment);

        // 게시글의 댓글 수 업데이트
        updatePostCommentCount(comment.getPost());
    }

    /**
     * 게시글의 댓글 목록 조회
     */
    @Transactional(readOnly = true)
    public CommentDto.CommentListResponse getCommentsByPostId(Long postId, Long userId, Pageable pageable) {
        // 게시글 존재 확인
        if (!postRepository.existsById(postId)) {
            throw new BusinessException("게시글을 찾을 수 없습니다.");
        }

        // 최상위 댓글 조회
        Page<Comment> topLevelComments = commentRepository.findTopLevelCommentsByPostId(postId, pageable);

        // 사용자의 좋아요 여부 조회
        Set<Long> likedCommentIds = getLikedCommentIds(userId, topLevelComments.getContent());

        // 답글 포함하여 응답 변환
        List<CommentDto.Response> responses = topLevelComments.getContent().stream()
                .map(comment -> toResponseWithReplies(comment, userId, likedCommentIds))
                .collect(Collectors.toList());

        Long totalCount = commentRepository.countByPostId(postId);

        return CommentDto.CommentListResponse.builder()
                .postId(postId)
                .totalCount(totalCount)
                .comments(responses)
                .build();
    }

    /**
     * 댓글 좋아요
     */
    @Transactional
    public CommentDto.LikeResponse likeComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new BusinessException("댓글을 찾을 수 없습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        // 이미 좋아요 했는지 확인
        if (commentLikeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            throw new BusinessException("이미 좋아요한 댓글입니다.");
        }

        // 좋아요 생성
        CommentLike like = new CommentLike();
        like.setComment(comment);
        like.setUser(user);
        commentLikeRepository.save(like);

        // 좋아요 수 증가
        commentRepository.updateLikeCount(commentId, 1);

        // 알림 전송 (본인 댓글이 아닌 경우)
        if (!comment.getAuthor().getId().equals(userId)) {
            notificationService.sendCommentLikeNotification(comment.getAuthor(), user, comment);
        }

        return CommentDto.LikeResponse.builder()
                .commentId(commentId)
                .likeCount(comment.getLikeCount() + 1)
                .isLiked(true)
                .build();
    }

    /**
     * 댓글 좋아요 취소
     */
    @Transactional
    public CommentDto.LikeResponse unlikeComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new BusinessException("댓글을 찾을 수 없습니다."));

        // 좋아요 확인
        if (!commentLikeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            throw new BusinessException("좋아요하지 않은 댓글입니다.");
        }

        // 좋아요 삭제
        commentLikeRepository.deleteByCommentIdAndUserId(commentId, userId);

        // 좋아요 수 감소
        commentRepository.updateLikeCount(commentId, -1);

        return CommentDto.LikeResponse.builder()
                .commentId(commentId)
                .likeCount(Math.max(0, comment.getLikeCount() - 1))
                .isLiked(false)
                .build();
    }

    /**
     * 댓글의 답글 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CommentDto.Response> getReplies(Long commentId, Long userId) {
        Comment parentComment = commentRepository.findByIdAndNotDeleted(commentId)
                .orElseThrow(() -> new BusinessException("댓글을 찾을 수 없습니다."));

        List<Comment> replies = commentRepository.findRepliesByParentId(commentId);

        Set<Long> likedCommentIds = getLikedCommentIds(userId, replies);

        return replies.stream()
                .map(reply -> toResponse(reply, userId, likedCommentIds.contains(reply.getId())))
                .collect(Collectors.toList());
    }

    // === Private Helper Methods ===

    private void updatePostCommentCount(Post post) {
        Long commentCount = commentRepository.countByPostId(post.getId());
        post.setCommentCount(commentCount.intValue());
        postRepository.save(post);
    }

    private void sendMentionNotifications(List<Long> mentionedUserIds, User author, Post post, Comment comment) {
        for (Long mentionedUserId : mentionedUserIds) {
            if (!mentionedUserId.equals(author.getId())) {
                userRepository.findById(mentionedUserId).ifPresent(mentionedUser -> {
                    notificationService.sendMentionNotification(mentionedUser, author, post, comment);
                });
            }
        }
    }

    private Set<Long> getLikedCommentIds(Long userId, List<Comment> comments) {
        if (userId == null || comments.isEmpty()) {
            return Collections.emptySet();
        }

        List<Long> commentIds = comments.stream()
                .map(Comment::getId)
                .collect(Collectors.toList());

        return commentLikeRepository.findLikedCommentIdsByUserIdAndCommentIds(userId, commentIds)
                .stream()
                .collect(Collectors.toSet());
    }

    private CommentDto.Response toResponse(Comment comment, Long userId, boolean isLiked) {
        boolean isOwner = userId != null && comment.getAuthor().getId().equals(userId);

        List<Comment> replies = comment.getReplies();
        int replyCount = replies != null ?
                (int) replies.stream().filter(r -> !r.getIsDeleted()).count() : 0;

        return CommentDto.Response.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .author(toAuthorInfo(comment.getAuthor()))
                .postId(comment.getPost().getId())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .likeCount(comment.getLikeCount())
                .replyCount(replyCount)
                .isLiked(isLiked)
                .isOwner(isOwner)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .replies(Collections.emptyList())
                .build();
    }

    private CommentDto.Response toResponseWithReplies(Comment comment, Long userId, Set<Long> likedCommentIds) {
        CommentDto.Response response = toResponse(comment, userId, likedCommentIds.contains(comment.getId()));

        // 답글 로드
        List<Comment> replies = commentRepository.findRepliesByParentId(comment.getId());
        if (!replies.isEmpty()) {
            // 답글에 대한 좋아요 여부 조회
            Set<Long> replyLikedIds = getLikedCommentIds(userId, replies);

            List<CommentDto.Response> replyResponses = replies.stream()
                    .map(reply -> toResponse(reply, userId, replyLikedIds.contains(reply.getId())))
                    .collect(Collectors.toList());

            response.setReplies(replyResponses);
        }

        return response;
    }

    private CommentDto.AuthorInfo toAuthorInfo(User user) {
        return CommentDto.AuthorInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
