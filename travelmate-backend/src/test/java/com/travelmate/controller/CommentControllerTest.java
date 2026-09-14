package com.travelmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.CommentDto;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.CommentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = CommentController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("댓글 컨트롤러 테스트")
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CommentService commentService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private CommentDto.Response commentResponse;
    private CommentDto.AuthorInfo authorInfo;

    @BeforeEach
    void setUp() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "1",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        // AuthorInfo 설정
        authorInfo = CommentDto.AuthorInfo.builder()
                .id(1L)
                .nickname("작성자")
                .username("author")
                .profileImageUrl("http://example.com/profile.jpg")
                .build();

        // CommentDto.Response 설정
        commentResponse = CommentDto.Response.builder()
                .id(1L)
                .content("테스트 댓글")
                .author(authorInfo)
                .postId(1L)
                .parentCommentId(null)
                .likeCount(0)
                .replyCount(0)
                .isLiked(false)
                .isOwner(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .replies(Collections.emptyList())
                .build();
    }

    @Nested
    @DisplayName("댓글 작성 테스트")
    class CreateCommentTest {

        @Test
        @DisplayName("POST /api/posts/{postId}/comments - 성공")
        void createComment_Success() throws Exception {
            // Given
            CommentDto.CreateRequest request = new CommentDto.CreateRequest();
            request.setContent("새 댓글입니다.");

            when(commentService.createComment(eq(1L), eq(1L), any(CommentDto.CreateRequest.class)))
                    .thenReturn(commentResponse);

            // When & Then
            mockMvc.perform(post("/posts/1/comments")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.content").value("테스트 댓글"));

            verify(commentService).createComment(eq(1L), eq(1L), any(CommentDto.CreateRequest.class));
        }

        @Test
        @DisplayName("POST /api/posts/{postId}/comments - 답글 작성 성공")
        void createComment_Reply_Success() throws Exception {
            // Given
            CommentDto.CreateRequest request = new CommentDto.CreateRequest();
            request.setContent("답글입니다.");
            request.setParentCommentId(1L);

            CommentDto.Response replyResponse = CommentDto.Response.builder()
                    .id(2L)
                    .content("답글입니다.")
                    .author(authorInfo)
                    .postId(1L)
                    .parentCommentId(1L)
                    .likeCount(0)
                    .replyCount(0)
                    .isLiked(false)
                    .isOwner(true)
                    .createdAt(LocalDateTime.now())
                    .replies(Collections.emptyList())
                    .build();

            when(commentService.createComment(eq(1L), eq(1L), any(CommentDto.CreateRequest.class)))
                    .thenReturn(replyResponse);

            // When & Then
            mockMvc.perform(post("/posts/1/comments")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(2))
                    .andExpect(jsonPath("$.parentCommentId").value(1));
        }
    }

    @Nested
    @DisplayName("댓글 목록 조회 테스트")
    class GetCommentsTest {

        @Test
        @DisplayName("GET /api/posts/{postId}/comments - 성공")
        void getComments_Success() throws Exception {
            // Given
            CommentDto.CommentListResponse listResponse = CommentDto.CommentListResponse.builder()
                    .postId(1L)
                    .totalCount(1L)
                    .comments(List.of(commentResponse))
                    .build();

            when(commentService.getCommentsByPostId(eq(1L), any(), any()))
                    .thenReturn(listResponse);

            // When & Then
            mockMvc.perform(get("/posts/1/comments"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.postId").value(1))
                    .andExpect(jsonPath("$.totalCount").value(1))
                    .andExpect(jsonPath("$.comments[0].id").value(1));
        }

        @Test
        @DisplayName("GET /api/posts/{postId}/comments - 페이지네이션")
        void getComments_WithPagination() throws Exception {
            // Given
            CommentDto.CommentListResponse listResponse = CommentDto.CommentListResponse.builder()
                    .postId(1L)
                    .totalCount(50L)
                    .comments(List.of(commentResponse))
                    .build();

            when(commentService.getCommentsByPostId(eq(1L), any(), any()))
                    .thenReturn(listResponse);

            // When & Then
            mockMvc.perform(get("/posts/1/comments")
                            .param("page", "1")
                            .param("size", "10"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalCount").value(50));
        }
    }

    @Nested
    @DisplayName("댓글 수정 테스트")
    class UpdateCommentTest {

        @Test
        @DisplayName("PUT /api/comments/{commentId} - 성공")
        void updateComment_Success() throws Exception {
            // Given
            CommentDto.UpdateRequest request = new CommentDto.UpdateRequest();
            request.setContent("수정된 댓글");

            CommentDto.Response updatedResponse = CommentDto.Response.builder()
                    .id(1L)
                    .content("수정된 댓글")
                    .author(authorInfo)
                    .postId(1L)
                    .likeCount(0)
                    .isLiked(false)
                    .isOwner(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .replies(Collections.emptyList())
                    .build();

            when(commentService.updateComment(eq(1L), eq(1L), any(CommentDto.UpdateRequest.class)))
                    .thenReturn(updatedResponse);

            // When & Then
            mockMvc.perform(put("/comments/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").value("수정된 댓글"));
        }
    }

    @Nested
    @DisplayName("댓글 삭제 테스트")
    class DeleteCommentTest {

        @Test
        @DisplayName("DELETE /api/comments/{commentId} - 성공")
        void deleteComment_Success() throws Exception {
            // Given
            doNothing().when(commentService).deleteComment(1L, 1L);

            // When & Then
            mockMvc.perform(delete("/comments/1")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isNoContent());

            verify(commentService).deleteComment(1L, 1L);
        }
    }

    @Nested
    @DisplayName("댓글 좋아요 테스트")
    class LikeCommentTest {

        @Test
        @DisplayName("POST /api/comments/{commentId}/like - 성공")
        void likeComment_Success() throws Exception {
            // Given
            CommentDto.LikeResponse likeResponse = CommentDto.LikeResponse.builder()
                    .commentId(1L)
                    .likeCount(1)
                    .isLiked(true)
                    .build();

            when(commentService.likeComment(1L, 1L)).thenReturn(likeResponse);

            // When & Then
            mockMvc.perform(post("/comments/1/like")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.commentId").value(1))
                    .andExpect(jsonPath("$.likeCount").value(1))
                    .andExpect(jsonPath("$.isLiked").value(true));
        }

        @Test
        @DisplayName("DELETE /api/comments/{commentId}/like - 좋아요 취소 성공")
        void unlikeComment_Success() throws Exception {
            // Given
            CommentDto.LikeResponse likeResponse = CommentDto.LikeResponse.builder()
                    .commentId(1L)
                    .likeCount(0)
                    .isLiked(false)
                    .build();

            when(commentService.unlikeComment(1L, 1L)).thenReturn(likeResponse);

            // When & Then
            mockMvc.perform(delete("/comments/1/like")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.commentId").value(1))
                    .andExpect(jsonPath("$.likeCount").value(0))
                    .andExpect(jsonPath("$.isLiked").value(false));
        }
    }

    @Nested
    @DisplayName("답글 조회 테스트")
    class GetRepliesTest {

        @Test
        @DisplayName("GET /api/comments/{commentId}/replies - 성공")
        void getReplies_Success() throws Exception {
            // Given
            CommentDto.Response reply = CommentDto.Response.builder()
                    .id(2L)
                    .content("답글입니다.")
                    .author(authorInfo)
                    .postId(1L)
                    .parentCommentId(1L)
                    .likeCount(0)
                    .isLiked(false)
                    .createdAt(LocalDateTime.now())
                    .replies(Collections.emptyList())
                    .build();

            when(commentService.getReplies(1L, 1L)).thenReturn(List.of(reply));

            // When & Then
            mockMvc.perform(get("/comments/1/replies"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(2))
                    .andExpect(jsonPath("$[0].parentCommentId").value(1));
        }

        @Test
        @DisplayName("GET /api/comments/{commentId}/replies - 빈 답글 목록")
        void getReplies_Empty() throws Exception {
            // Given
            when(commentService.getReplies(1L, 1L)).thenReturn(Collections.emptyList());

            // When & Then
            mockMvc.perform(get("/comments/1/replies"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$").isEmpty());
        }
    }
}
