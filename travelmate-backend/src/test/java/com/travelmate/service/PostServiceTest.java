package com.travelmate.service;

import com.travelmate.dto.PostDto;
import com.travelmate.entity.Post;
import com.travelmate.entity.PostImage;
import com.travelmate.entity.PostLike;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.exception.ErrorCode;
import com.travelmate.repository.PostImageRepository;
import com.travelmate.repository.PostLikeRepository;
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
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostService 테스트")
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private PostImageRepository postImageRepository;

    @Mock
    private FileUploadService fileUploadService;

    @InjectMocks
    private PostService postService;

    private User author;
    private User otherUser;
    private Post post;

    @BeforeEach
    void setUp() {
        author = new User();
        author.setId(1L);
        author.setNickname("작성자");
        author.setEmail("author@test.com");
        author.setPassword("password");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setNickname("다른사용자");
        otherUser.setEmail("other@test.com");
        otherUser.setPassword("password");

        post = new Post();
        post.setId(1L);
        post.setTitle("테스트 게시글");
        post.setContent("테스트 내용입니다.");
        post.setAuthor(author);
        post.setCategory(Post.Category.TRAVEL_TIP);
        post.setLocationName("서울");
        post.setLocationLatitude(37.5665);
        post.setLocationLongitude(126.9780);
        post.setViewCount(0);
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setIsPinned(false);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        post.setImages(new ArrayList<>());
    }

    @Nested
    @DisplayName("게시글 생성 테스트")
    class CreatePostTest {

        @Test
        @DisplayName("성공 - 게시글 생성")
        void createPost_Success() {
            // Given
            PostDto.CreateRequest request = new PostDto.CreateRequest();
            request.setTitle("새 게시글");
            request.setContent("게시글 내용");
            request.setCategory(Post.Category.TRAVEL_TIP);
            request.setLocationName("부산");

            when(userRepository.findById(1L)).thenReturn(Optional.of(author));
            when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
                Post savedPost = invocation.getArgument(0);
                savedPost.setId(1L);
                savedPost.setCreatedAt(LocalDateTime.now());
                savedPost.setUpdatedAt(LocalDateTime.now());
                return savedPost;
            });

            // When
            PostDto.Response result = postService.createPost(1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("새 게시글");
            assertThat(result.getContent()).isEqualTo("게시글 내용");
            assertThat(result.getCategory()).isEqualTo(Post.Category.TRAVEL_TIP);

            verify(postRepository).save(any(Post.class));
        }

        @Test
        @DisplayName("성공 - 이미지 URL 포함 게시글 생성")
        void createPost_Success_WithImages() {
            // Given
            PostDto.CreateRequest request = new PostDto.CreateRequest();
            request.setTitle("이미지 게시글");
            request.setContent("이미지가 포함된 게시글");
            request.setCategory(Post.Category.TRAVEL_TIP);
            request.setImageUrls(List.of("http://image1.jpg", "http://image2.jpg"));

            when(userRepository.findById(1L)).thenReturn(Optional.of(author));
            when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
                Post savedPost = invocation.getArgument(0);
                savedPost.setId(1L);
                savedPost.setCreatedAt(LocalDateTime.now());
                return savedPost;
            });

            // When
            PostDto.Response result = postService.createPost(1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(postImageRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void createPost_Fail_UserNotFound() {
            // Given
            PostDto.CreateRequest request = new PostDto.CreateRequest();
            request.setTitle("게시글");
            request.setContent("내용");

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> postService.createPost(999L, request))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("게시글 목록 조회 테스트")
    class GetPostsTest {

        @Test
        @DisplayName("성공 - 전체 게시글 조회")
        void getPosts_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Post> postPage = new PageImpl<>(List.of(post), pageable, 1);

            when(postRepository.findPostsWithFilters(any(), any(), any(), any()))
                    .thenReturn(postPage);

            // When
            Page<PostDto.Response> result = postService.getPosts(null, null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("테스트 게시글");
        }

        @Test
        @DisplayName("성공 - 카테고리 필터 적용")
        void getPosts_WithCategoryFilter() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Post> postPage = new PageImpl<>(List.of(post), pageable, 1);

            when(postRepository.findPostsWithFilters(eq(Post.Category.TRAVEL_TIP), any(), any(), any()))
                    .thenReturn(postPage);

            // When
            Page<PostDto.Response> result = postService.getPosts(Post.Category.TRAVEL_TIP, null, null, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(postRepository).findPostsWithFilters(eq(Post.Category.TRAVEL_TIP), any(), any(), any());
        }

        @Test
        @DisplayName("성공 - 검색어 필터 적용")
        void getPosts_WithKeywordFilter() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Post> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(postRepository.findPostsWithFilters(any(), eq("찾을수없는키워드"), any(), any()))
                    .thenReturn(emptyPage);

            // When
            Page<PostDto.Response> result = postService.getPosts(null, "찾을수없는키워드", null, pageable);

            // Then
            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("게시글 상세 조회 테스트")
    class GetPostDetailTest {

        @Test
        @DisplayName("성공 - 게시글 상세 조회 및 조회수 증가")
        void getPostDetail_Success() {
            // Given
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(postRepository.save(any(Post.class))).thenReturn(post);

            // When
            PostDto.DetailResponse result = postService.getPostDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("테스트 게시글");
            assertThat(result.getViewCount()).isEqualTo(1);

            verify(postRepository).save(any(Post.class));
        }

        @Test
        @DisplayName("실패 - 게시글 없음")
        void getPostDetail_Fail_NotFound() {
            // Given
            when(postRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> postService.getPostDetail(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("요청한 리소스를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("게시글 수정 테스트")
    class UpdatePostTest {

        @Test
        @DisplayName("성공 - 게시글 수정")
        void updatePost_Success() {
            // Given
            PostDto.UpdateRequest request = new PostDto.UpdateRequest();
            request.setTitle("수정된 제목");
            request.setContent("수정된 내용");
            request.setCategory(Post.Category.QUESTION);

            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
                Post savedPost = invocation.getArgument(0);
                savedPost.setUpdatedAt(LocalDateTime.now());
                return savedPost;
            });

            // When
            PostDto.Response result = postService.updatePost(1L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("수정된 제목");
            assertThat(result.getContent()).isEqualTo("수정된 내용");
            assertThat(result.getCategory()).isEqualTo(Post.Category.QUESTION);
        }

        @Test
        @DisplayName("실패 - 게시글 없음")
        void updatePost_Fail_NotFound() {
            // Given
            PostDto.UpdateRequest request = new PostDto.UpdateRequest();
            when(postRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> postService.updatePost(1L, 999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("요청한 리소스를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 작성자가 아닌 경우")
        void updatePost_Fail_NotAuthor() {
            // Given
            PostDto.UpdateRequest request = new PostDto.UpdateRequest();
            request.setTitle("수정 시도");

            when(postRepository.findById(1L)).thenReturn(Optional.of(post));

            // When & Then
            assertThatThrownBy(() -> postService.updatePost(2L, 1L, request))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("게시글 삭제 테스트")
    class DeletePostTest {

        @Test
        @DisplayName("성공 - 게시글 삭제")
        void deletePost_Success() {
            // Given
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            doNothing().when(postRepository).delete(any(Post.class));

            // When
            postService.deletePost(1L, 1L);

            // Then
            verify(postRepository).delete(post);
        }

        @Test
        @DisplayName("실패 - 게시글 없음")
        void deletePost_Fail_NotFound() {
            // Given
            when(postRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> postService.deletePost(1L, 999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("요청한 리소스를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 작성자가 아닌 경우")
        void deletePost_Fail_NotAuthor() {
            // Given
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));

            // When & Then
            assertThatThrownBy(() -> postService.deletePost(2L, 1L))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("좋아요 테스트")
    class LikePostTest {

        @Test
        @DisplayName("성공 - 좋아요 추가")
        void likePost_Success() {
            // Given
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(postLikeRepository.existsByPostIdAndUserId(1L, 2L)).thenReturn(false);
            when(postLikeRepository.save(any(PostLike.class))).thenReturn(new PostLike());
            when(postRepository.save(any(Post.class))).thenReturn(post);

            // When
            postService.likePost(1L, 2L);

            // Then
            ArgumentCaptor<PostLike> captor = ArgumentCaptor.forClass(PostLike.class);
            verify(postLikeRepository).save(captor.capture());
            assertThat(captor.getValue().getPost()).isEqualTo(post);
            assertThat(captor.getValue().getUser()).isEqualTo(otherUser);
        }

        @Test
        @DisplayName("실패 - 이미 좋아요한 게시글")
        void likePost_Fail_AlreadyLiked() {
            // Given
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(postLikeRepository.existsByPostIdAndUserId(1L, 2L)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> postService.likePost(1L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 수행한 작업입니다");
        }

        @Test
        @DisplayName("실패 - 게시글 없음")
        void likePost_Fail_PostNotFound() {
            // Given
            when(postRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> postService.likePost(999L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("요청한 리소스를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("좋아요 취소 테스트")
    class UnlikePostTest {

        @Test
        @DisplayName("성공 - 좋아요 취소")
        void unlikePost_Success() {
            // Given
            PostLike postLike = new PostLike();
            postLike.setPost(post);
            postLike.setUser(otherUser);

            post.setLikeCount(1);

            when(postLikeRepository.findByPostIdAndUserId(1L, 2L)).thenReturn(Optional.of(postLike));
            doNothing().when(postLikeRepository).delete(postLike);
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(postRepository.save(any(Post.class))).thenReturn(post);

            // When
            postService.unlikePost(1L, 2L);

            // Then
            verify(postLikeRepository).delete(postLike);
            assertThat(post.getLikeCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("실패 - 좋아요 기록 없음")
        void unlikePost_Fail_NotLiked() {
            // Given
            when(postLikeRepository.findByPostIdAndUserId(1L, 2L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> postService.unlikePost(1L, 2L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("요청한 리소스를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("이미지 업로드 테스트")
    class UploadImagesTest {

        @Test
        @DisplayName("성공 - 이미지 업로드")
        void uploadImages_Success() {
            // Given
            MultipartFile mockFile = mock(MultipartFile.class);
            when(mockFile.getOriginalFilename()).thenReturn("test.jpg");
            when(mockFile.getSize()).thenReturn(1024L);

            when(postRepository.findById(1L)).thenReturn(Optional.of(post));
            when(fileUploadService.uploadImage(any(MultipartFile.class)))
                    .thenReturn("http://uploaded-image.jpg");
            when(postImageRepository.save(any(PostImage.class))).thenReturn(new PostImage());

            // When
            List<String> result = postService.uploadImages(1L, 1L, List.of(mockFile));

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0)).isEqualTo("http://uploaded-image.jpg");
            verify(fileUploadService).uploadImage(any(MultipartFile.class));
            verify(postImageRepository).save(any(PostImage.class));
        }

        @Test
        @DisplayName("실패 - 작성자가 아닌 경우")
        void uploadImages_Fail_NotAuthor() {
            // Given
            MultipartFile mockFile = mock(MultipartFile.class);
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));

            // When & Then
            assertThatThrownBy(() -> postService.uploadImages(2L, 1L, List.of(mockFile)))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("트렌딩 게시글 조회 테스트")
    class GetTrendingPostsTest {

        @Test
        @DisplayName("성공 - 트렌딩 게시글 조회")
        void getTrendingPosts_Success() {
            // Given
            post.setLikeCount(100);
            post.setViewCount(500);

            when(postRepository.findTrendingPosts(any(LocalDateTime.class), any(Pageable.class)))
                    .thenReturn(List.of(post));

            // When
            List<PostDto.Response> result = postService.getTrendingPosts();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getLikeCount()).isEqualTo(100);
        }

        @Test
        @DisplayName("성공 - 트렌딩 게시글 없음")
        void getTrendingPosts_Empty() {
            // Given
            when(postRepository.findTrendingPosts(any(LocalDateTime.class), any(Pageable.class)))
                    .thenReturn(List.of());

            // When
            List<PostDto.Response> result = postService.getTrendingPosts();

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("주변 게시글 조회 테스트")
    class GetNearbyPostsTest {

        @Test
        @DisplayName("성공 - 주변 게시글 조회")
        void getNearbyPosts_Success() {
            // Given
            when(postRepository.findNearbyPosts(anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(List.of(post));

            // When
            List<PostDto.Response> result = postService.getNearbyPosts(37.5665, 126.9780, 5.0);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getLocationName()).isEqualTo("서울");
        }

        @Test
        @DisplayName("성공 - 주변 게시글 20개 제한")
        void getNearbyPosts_LimitTo20() {
            // Given
            List<Post> manyPosts = new ArrayList<>();
            for (int i = 0; i < 30; i++) {
                Post p = new Post();
                p.setId((long) i);
                p.setTitle("게시글 " + i);
                p.setContent("내용");
                p.setAuthor(author);
                p.setViewCount(0);
                p.setLikeCount(0);
                p.setCommentCount(0);
                p.setIsPinned(false);
                p.setImages(new ArrayList<>());
                p.setCreatedAt(LocalDateTime.now());
                manyPosts.add(p);
            }

            when(postRepository.findNearbyPosts(anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(manyPosts);

            // When
            List<PostDto.Response> result = postService.getNearbyPosts(37.5665, 126.9780, 5.0);

            // Then
            assertThat(result).hasSize(20);
        }
    }
}
