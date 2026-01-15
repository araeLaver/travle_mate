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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CommentService 테스트")
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private CommentLikeRepository commentLikeRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CommentService commentService;

    private User author;
    private User otherUser;
    private Post post;
    private Comment comment;

    @BeforeEach
    void setUp() {
        author = new User();
        author.setId(1L);
        author.setNickname("작성자");
        author.setEmail("author@test.com");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setNickname("다른사용자");
        otherUser.setEmail("other@test.com");

        post = new Post();
        post.setId(1L);
        post.setTitle("테스트 게시글");
        post.setContent("테스트 내용");
        post.setAuthor(author);
        post.setCommentCount(0);

        comment = new Comment();
        comment.setId(1L);
        comment.setContent("테스트 댓글");
        comment.setAuthor(author);
        comment.setPost(post);
        comment.setLikeCount(0);
        comment.setIsDeleted(false);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        comment.setReplies(new ArrayList<>());
    }

    @Nested
    @DisplayName("댓글 작성 테스트")
    class CreateCommentTest {

        @Test
        @DisplayName("성공 - 일반 댓글 작성")
        void createComment_Success() {
            // Given
            CommentDto.CreateRequest request = new CommentDto.CreateRequest();
            request.setContent("새 댓글입니다.");

            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
                Comment savedComment = invocation.getArgument(0);
                savedComment.setId(2L);
                savedComment.setCreatedAt(LocalDateTime.now());
                savedComment.setReplies(new ArrayList<>());
                return savedComment;
            });
            when(commentRepository.countByPostId(1L)).thenReturn(1L);
            when(postRepository.save(any(Post.class))).thenReturn(post);
            doNothing().when(notificationService).sendCommentNotification(any(), any(), any(), any());

            // When
            CommentDto.Response result = commentService.createComment(2L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEqualTo("새 댓글입니다.");
            verify(commentRepository).save(any(Comment.class));
            verify(notificationService).sendCommentNotification(eq(author), eq(otherUser), eq(post), any(Comment.class));
        }

        @Test
        @DisplayName("성공 - 답글 작성")
        void createComment_Success_Reply() {
            // Given
            CommentDto.CreateRequest request = new CommentDto.CreateRequest();
            request.setContent("답글입니다.");
            request.setParentCommentId(1L);

            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));
            when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
                Comment savedComment = invocation.getArgument(0);
                savedComment.setId(2L);
                savedComment.setCreatedAt(LocalDateTime.now());
                savedComment.setReplies(new ArrayList<>());
                return savedComment;
            });
            when(commentRepository.countByPostId(1L)).thenReturn(2L);
            when(postRepository.save(any(Post.class))).thenReturn(post);
            doNothing().when(notificationService).sendCommentReplyNotification(any(), any(), any(), any());

            // When
            CommentDto.Response result = commentService.createComment(2L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getParentCommentId()).isEqualTo(1L);
            verify(notificationService).sendCommentReplyNotification(eq(author), eq(otherUser), eq(post), any(Comment.class));
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void createComment_Fail_UserNotFound() {
            // Given
            CommentDto.CreateRequest request = new CommentDto.CreateRequest();
            request.setContent("댓글");

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commentService.createComment(999L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 게시글 없음")
        void createComment_Fail_PostNotFound() {
            // Given
            CommentDto.CreateRequest request = new CommentDto.CreateRequest();
            request.setContent("댓글");

            when(userRepository.findById(1L)).thenReturn(Optional.of(author));
            when(postRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commentService.createComment(1L, 999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("게시글을 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 부모 댓글 없음")
        void createComment_Fail_ParentNotFound() {
            // Given
            CommentDto.CreateRequest request = new CommentDto.CreateRequest();
            request.setContent("답글");
            request.setParentCommentId(999L);

            when(userRepository.findById(1L)).thenReturn(Optional.of(author));
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(commentRepository.findByIdAndNotDeleted(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commentService.createComment(1L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("부모 댓글을 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("댓글 수정 테스트")
    class UpdateCommentTest {

        @Test
        @DisplayName("성공 - 댓글 수정")
        void updateComment_Success() {
            // Given
            CommentDto.UpdateRequest request = new CommentDto.UpdateRequest();
            request.setContent("수정된 댓글");

            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));
            when(commentRepository.save(any(Comment.class))).thenReturn(comment);

            // When
            CommentDto.Response result = commentService.updateComment(1L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEqualTo("수정된 댓글");
        }

        @Test
        @DisplayName("실패 - 댓글 없음")
        void updateComment_Fail_NotFound() {
            // Given
            CommentDto.UpdateRequest request = new CommentDto.UpdateRequest();
            request.setContent("수정 시도");

            when(commentRepository.findByIdAndNotDeleted(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commentService.updateComment(1L, 999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("댓글을 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 작성자가 아닌 경우")
        void updateComment_Fail_NotAuthor() {
            // Given
            CommentDto.UpdateRequest request = new CommentDto.UpdateRequest();
            request.setContent("수정 시도");

            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));

            // When & Then
            assertThatThrownBy(() -> commentService.updateComment(2L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("수정할 권한이 없습니다");
        }
    }

    @Nested
    @DisplayName("댓글 삭제 테스트")
    class DeleteCommentTest {

        @Test
        @DisplayName("성공 - 작성자가 삭제")
        void deleteComment_Success_ByAuthor() {
            // Given
            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));
            when(commentRepository.save(any(Comment.class))).thenReturn(comment);
            when(commentRepository.countByPostId(1L)).thenReturn(0L);
            when(postRepository.save(any(Post.class))).thenReturn(post);

            // When
            commentService.deleteComment(1L, 1L);

            // Then
            assertThat(comment.getIsDeleted()).isTrue();
            verify(commentRepository).save(comment);
        }

        @Test
        @DisplayName("성공 - 게시글 작성자가 삭제")
        void deleteComment_Success_ByPostAuthor() {
            // Given
            Comment otherComment = new Comment();
            otherComment.setId(2L);
            otherComment.setContent("다른 댓글");
            otherComment.setAuthor(otherUser);
            otherComment.setPost(post);
            otherComment.setIsDeleted(false);

            when(commentRepository.findByIdAndNotDeleted(2L)).thenReturn(Optional.of(otherComment));
            when(commentRepository.save(any(Comment.class))).thenReturn(otherComment);
            when(commentRepository.countByPostId(1L)).thenReturn(0L);
            when(postRepository.save(any(Post.class))).thenReturn(post);

            // When
            commentService.deleteComment(1L, 2L);

            // Then
            assertThat(otherComment.getIsDeleted()).isTrue();
        }

        @Test
        @DisplayName("실패 - 권한 없음")
        void deleteComment_Fail_NoPermission() {
            // Given
            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));

            // When & Then
            assertThatThrownBy(() -> commentService.deleteComment(3L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("삭제할 권한이 없습니다");
        }
    }

    @Nested
    @DisplayName("댓글 좋아요 테스트")
    class LikeCommentTest {

        @Test
        @DisplayName("성공 - 좋아요 추가")
        void likeComment_Success() {
            // Given
            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(commentLikeRepository.existsByCommentIdAndUserId(1L, 2L)).thenReturn(false);
            when(commentLikeRepository.save(any(CommentLike.class))).thenReturn(new CommentLike());
            doNothing().when(commentRepository).updateLikeCount(1L, 1);
            doNothing().when(notificationService).sendCommentLikeNotification(any(), any(), any());

            // When
            CommentDto.LikeResponse result = commentService.likeComment(2L, 1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getIsLiked()).isTrue();
            assertThat(result.getLikeCount()).isEqualTo(1);
            verify(commentLikeRepository).save(any(CommentLike.class));
        }

        @Test
        @DisplayName("실패 - 이미 좋아요한 댓글")
        void likeComment_Fail_AlreadyLiked() {
            // Given
            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(commentLikeRepository.existsByCommentIdAndUserId(1L, 2L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commentService.likeComment(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 좋아요한 댓글");
        }
    }

    @Nested
    @DisplayName("댓글 좋아요 취소 테스트")
    class UnlikeCommentTest {

        @Test
        @DisplayName("성공 - 좋아요 취소")
        void unlikeComment_Success() {
            // Given
            comment.setLikeCount(1);

            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));
            when(commentLikeRepository.existsByCommentIdAndUserId(1L, 2L)).thenReturn(true);
            doNothing().when(commentLikeRepository).deleteByCommentIdAndUserId(1L, 2L);
            doNothing().when(commentRepository).updateLikeCount(1L, -1);

            // When
            CommentDto.LikeResponse result = commentService.unlikeComment(2L, 1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getIsLiked()).isFalse();
            assertThat(result.getLikeCount()).isEqualTo(0);
            verify(commentLikeRepository).deleteByCommentIdAndUserId(1L, 2L);
        }

        @Test
        @DisplayName("실패 - 좋아요하지 않은 댓글")
        void unlikeComment_Fail_NotLiked() {
            // Given
            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));
            when(commentLikeRepository.existsByCommentIdAndUserId(1L, 2L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> commentService.unlikeComment(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("좋아요하지 않은 댓글");
        }
    }

    @Nested
    @DisplayName("댓글 목록 조회 테스트")
    class GetCommentsTest {

        @Test
        @DisplayName("성공 - 댓글 목록 조회")
        void getCommentsByPostId_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<Comment> commentPage = new PageImpl<>(List.of(comment), pageable, 1);

            when(postRepository.existsById(1L)).thenReturn(true);
            when(commentRepository.findTopLevelCommentsByPostId(1L, pageable)).thenReturn(commentPage);
            when(commentLikeRepository.findLikedCommentIdsByUserIdAndCommentIds(eq(2L), anyList())).thenReturn(List.of());
            when(commentRepository.findRepliesByParentId(1L)).thenReturn(List.of());
            when(commentRepository.countByPostId(1L)).thenReturn(1L);

            // When
            CommentDto.CommentListResponse result = commentService.getCommentsByPostId(1L, 2L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTotalCount()).isEqualTo(1);
            assertThat(result.getComments()).hasSize(1);
        }

        @Test
        @DisplayName("실패 - 게시글 없음")
        void getCommentsByPostId_Fail_PostNotFound() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            when(postRepository.existsById(999L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> commentService.getCommentsByPostId(999L, 1L, pageable))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("게시글을 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("답글 조회 테스트")
    class GetRepliesTest {

        @Test
        @DisplayName("성공 - 답글 목록 조회")
        void getReplies_Success() {
            // Given
            Comment reply = new Comment();
            reply.setId(2L);
            reply.setContent("답글");
            reply.setAuthor(otherUser);
            reply.setPost(post);
            reply.setParentComment(comment);
            reply.setLikeCount(0);
            reply.setIsDeleted(false);
            reply.setReplies(new ArrayList<>());

            when(commentRepository.findByIdAndNotDeleted(1L)).thenReturn(Optional.of(comment));
            when(commentRepository.findRepliesByParentId(1L)).thenReturn(List.of(reply));
            when(commentLikeRepository.findLikedCommentIdsByUserIdAndCommentIds(eq(2L), anyList())).thenReturn(List.of());

            // When
            List<CommentDto.Response> result = commentService.getReplies(1L, 2L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getContent()).isEqualTo("답글");
        }

        @Test
        @DisplayName("실패 - 부모 댓글 없음")
        void getReplies_Fail_ParentNotFound() {
            // Given
            when(commentRepository.findByIdAndNotDeleted(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commentService.getReplies(999L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("댓글을 찾을 수 없습니다");
        }
    }
}
