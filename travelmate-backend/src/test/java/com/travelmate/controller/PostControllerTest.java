package com.travelmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.PostDto;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.Post;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.PostService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = PostController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("게시글 컨트롤러 테스트")
class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PostService postService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private PostDto.Response postResponse;
    private PostDto.DetailResponse detailResponse;

    @BeforeEach
    void setUp() {
        // SecurityContext 설정
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                1L, // principal로 userId 사용
                null,
                Collections.emptyList()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        // PostDto.Response 설정
        UserDto.Response authorResponse = new UserDto.Response();
        authorResponse.setId(1L);
        authorResponse.setNickname("작성자");

        postResponse = new PostDto.Response();
        postResponse.setId(1L);
        postResponse.setTitle("테스트 게시글");
        postResponse.setContent("테스트 내용입니다.");
        postResponse.setAuthor(authorResponse);
        postResponse.setCategory(Post.Category.TRAVEL_TIP);
        postResponse.setLocationName("서울");
        postResponse.setViewCount(0);
        postResponse.setLikeCount(0);
        postResponse.setCommentCount(0);
        postResponse.setIsPinned(false);
        postResponse.setCreatedAt(LocalDateTime.now());
        postResponse.setUpdatedAt(LocalDateTime.now());
        postResponse.setImageUrls(new ArrayList<>());

        // PostDto.DetailResponse 설정
        detailResponse = new PostDto.DetailResponse();
        detailResponse.setId(1L);
        detailResponse.setTitle("테스트 게시글");
        detailResponse.setContent("테스트 내용입니다.");
        detailResponse.setAuthor(authorResponse);
        detailResponse.setCategory(Post.Category.TRAVEL_TIP);
        detailResponse.setViewCount(1);
        detailResponse.setLikeCount(0);
        detailResponse.setCommentCount(0);
        detailResponse.setComments(new ArrayList<>());
        detailResponse.setCreatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("게시글 생성 테스트")
    class CreatePostTest {

        @Test
        @DisplayName("POST /api/posts - 성공")
        void createPost_Success() throws Exception {
            // Given
            PostDto.CreateRequest request = new PostDto.CreateRequest();
            request.setTitle("새 게시글");
            request.setContent("게시글 내용");
            request.setCategory(Post.Category.TRAVEL_TIP);
            request.setAuthorId(1L);

            when(postService.createPost(anyLong(), any(PostDto.CreateRequest.class)))
                    .thenReturn(postResponse);

            // When & Then
            mockMvc.perform(post("/api/posts")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.title").value("테스트 게시글"));

            verify(postService).createPost(anyLong(), any(PostDto.CreateRequest.class));
        }
    }

    @Nested
    @DisplayName("게시글 목록 조회 테스트")
    class GetPostsTest {

        @Test
        @DisplayName("GET /api/posts - 전체 목록 조회")
        void getPosts_Success() throws Exception {
            // Given
            Page<PostDto.Response> page = new PageImpl<>(
                    List.of(postResponse), PageRequest.of(0, 10), 1);

            when(postService.getPosts(any(), any(), any(), any()))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/api/posts"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("테스트 게시글"))
                    .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        @DisplayName("GET /api/posts - 카테고리 필터")
        void getPosts_WithCategoryFilter() throws Exception {
            // Given
            Page<PostDto.Response> page = new PageImpl<>(
                    List.of(postResponse), PageRequest.of(0, 10), 1);

            when(postService.getPosts(eq(Post.Category.TRAVEL_TIP), any(), any(), any()))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/api/posts")
                            .param("category", "TRAVEL_TIP"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].category").value("TRAVEL_TIP"));
        }

        @Test
        @DisplayName("GET /api/posts - 키워드 검색")
        void getPosts_WithKeyword() throws Exception {
            // Given
            Page<PostDto.Response> page = new PageImpl<>(
                    List.of(postResponse), PageRequest.of(0, 10), 1);

            when(postService.getPosts(any(), eq("테스트"), any(), any()))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/api/posts")
                            .param("keyword", "테스트"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }
    }

    @Nested
    @DisplayName("게시글 상세 조회 테스트")
    class GetPostDetailTest {

        @Test
        @DisplayName("GET /api/posts/{id} - 성공")
        void getPost_Success() throws Exception {
            // Given
            when(postService.getPostDetail(1L)).thenReturn(detailResponse);

            // When & Then
            mockMvc.perform(get("/api/posts/1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.title").value("테스트 게시글"))
                    .andExpect(jsonPath("$.viewCount").value(1));
        }

        @Test
        @DisplayName("GET /api/posts/{id} - 게시글 없음")
        void getPost_NotFound() throws Exception {
            // Given
            when(postService.getPostDetail(999L))
                    .thenThrow(new RuntimeException("게시글을 찾을 수 없습니다."));

            // When & Then
            mockMvc.perform(get("/api/posts/999"))
                    .andDo(print())
                    .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("게시글 수정 테스트")
    class UpdatePostTest {

        @Test
        @DisplayName("PUT /api/posts/{id} - 성공")
        void updatePost_Success() throws Exception {
            // Given
            PostDto.UpdateRequest request = new PostDto.UpdateRequest();
            request.setTitle("수정된 제목");
            request.setContent("수정된 내용");
            request.setCategory(Post.Category.QUESTION);

            postResponse.setTitle("수정된 제목");
            postResponse.setContent("수정된 내용");
            postResponse.setCategory(Post.Category.QUESTION);

            when(postService.updatePost(anyLong(), eq(1L), any(PostDto.UpdateRequest.class)))
                    .thenReturn(postResponse);

            // When & Then
            mockMvc.perform(put("/api/posts/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("수정된 제목"))
                    .andExpect(jsonPath("$.category").value("QUESTION"));
        }
    }

    @Nested
    @DisplayName("게시글 삭제 테스트")
    class DeletePostTest {

        @Test
        @DisplayName("DELETE /api/posts/{id} - 성공")
        void deletePost_Success() throws Exception {
            // Given
            doNothing().when(postService).deletePost(anyLong(), eq(1L));

            // When & Then
            mockMvc.perform(delete("/api/posts/1")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isNoContent());

            verify(postService).deletePost(anyLong(), eq(1L));
        }
    }

    @Nested
    @DisplayName("좋아요 테스트")
    class LikePostTest {

        @Test
        @DisplayName("POST /api/posts/{id}/like - 좋아요 성공")
        void likePost_Success() throws Exception {
            // Given
            doNothing().when(postService).likePost(1L, 1L);

            // When & Then
            mockMvc.perform(post("/api/posts/1/like")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk());

            verify(postService).likePost(eq(1L), anyLong());
        }

        @Test
        @DisplayName("DELETE /api/posts/{id}/like - 좋아요 취소 성공")
        void unlikePost_Success() throws Exception {
            // Given
            doNothing().when(postService).unlikePost(1L, 1L);

            // When & Then
            mockMvc.perform(delete("/api/posts/1/like")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk());

            verify(postService).unlikePost(eq(1L), anyLong());
        }
    }

    @Nested
    @DisplayName("트렌딩 게시글 조회 테스트")
    class GetTrendingPostsTest {

        @Test
        @DisplayName("GET /api/posts/trending - 성공")
        void getTrendingPosts_Success() throws Exception {
            // Given
            postResponse.setLikeCount(100);
            postResponse.setViewCount(500);

            when(postService.getTrendingPosts()).thenReturn(List.of(postResponse));

            // When & Then
            mockMvc.perform(get("/api/posts/trending"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].likeCount").value(100));
        }
    }

    @Nested
    @DisplayName("주변 게시글 조회 테스트")
    class GetNearbyPostsTest {

        @Test
        @DisplayName("GET /api/posts/nearby - 성공")
        void getNearbyPosts_Success() throws Exception {
            // Given
            when(postService.getNearbyPosts(37.5665, 126.9780, 5.0))
                    .thenReturn(List.of(postResponse));

            // When & Then
            mockMvc.perform(get("/api/posts/nearby")
                            .param("latitude", "37.5665")
                            .param("longitude", "126.9780")
                            .param("radiusKm", "5.0"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].locationName").value("서울"));
        }

        @Test
        @DisplayName("GET /api/posts/nearby - 잘못된 위도")
        void getNearbyPosts_InvalidLatitude() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/posts/nearby")
                            .param("latitude", "100") // 유효하지 않은 위도
                            .param("longitude", "126.9780"))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("GET /api/posts/nearby - 잘못된 경도")
        void getNearbyPosts_InvalidLongitude() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/posts/nearby")
                            .param("latitude", "37.5665")
                            .param("longitude", "200")) // 유효하지 않은 경도
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("GET /api/posts/nearby - 잘못된 반경")
        void getNearbyPosts_InvalidRadius() throws Exception {
            // When & Then
            mockMvc.perform(get("/api/posts/nearby")
                            .param("latitude", "37.5665")
                            .param("longitude", "126.9780")
                            .param("radiusKm", "150")) // 100km 초과
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("이미지 업로드 테스트")
    class UploadImagesTest {

        @Test
        @DisplayName("POST /api/posts/{id}/images - 성공")
        void uploadImages_Success() throws Exception {
            // Given
            MockMultipartFile file1 = new MockMultipartFile(
                    "images", "image1.jpg", "image/jpeg", "test image".getBytes());
            MockMultipartFile file2 = new MockMultipartFile(
                    "images", "image2.jpg", "image/jpeg", "test image 2".getBytes());

            when(postService.uploadImages(anyLong(), eq(1L), anyList()))
                    .thenReturn(List.of("http://image1.jpg", "http://image2.jpg"));

            // When & Then
            mockMvc.perform(multipart("/api/posts/1/images")
                            .file(file1)
                            .file(file2)
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0]").value("http://image1.jpg"))
                    .andExpect(jsonPath("$[1]").value("http://image2.jpg"));
        }
    }
}
