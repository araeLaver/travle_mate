package com.travelmate.service;

import com.travelmate.dto.PostDto;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.*;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostImageRepository postImageRepository;
    private final FileUploadService fileUploadService;

    public PostDto.Response createPost(Long userId, PostDto.CreateRequest request) {
        User author = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.userNotFound(userId));

        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setAuthor(author);
        post.setCategory(request.getCategory());
        post.setLocationName(request.getLocationName());
        post.setLocationLatitude(request.getLocationLatitude());
        post.setLocationLongitude(request.getLocationLongitude());
        post.setViewCount(0);
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setIsPinned(false);

        Post savedPost = postRepository.save(post);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            savePostImages(savedPost, request.getImageUrls());
        }

        log.info("새 게시글 작성: {} by {}", savedPost.getId(), author.getNickname());
        return convertToDto(savedPost);
    }

    @Transactional(readOnly = true)
    public Page<PostDto.Response> getPosts(Post.Category category, String keyword,
                                          String location, Pageable pageable) {
        Page<Post> posts = postRepository.findPostsWithFilters(
            category, keyword, location, pageable);

        return posts.map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public PostDto.DetailResponse getPostDetail(Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);

        PostDto.DetailResponse response = new PostDto.DetailResponse();
        PostDto.Response basicDto = convertToDto(post);
        response.setId(basicDto.getId());
        response.setTitle(basicDto.getTitle());
        response.setContent(basicDto.getContent());
        response.setAuthor(basicDto.getAuthor());
        response.setCategory(basicDto.getCategory());
        response.setLocationName(basicDto.getLocationName());
        response.setLocationLatitude(basicDto.getLocationLatitude());
        response.setLocationLongitude(basicDto.getLocationLongitude());
        response.setImageUrls(basicDto.getImageUrls());
        response.setViewCount(basicDto.getViewCount());
        response.setLikeCount(basicDto.getLikeCount());
        response.setCommentCount(basicDto.getCommentCount());
        response.setIsPinned(basicDto.getIsPinned());
        response.setCreatedAt(basicDto.getCreatedAt());
        response.setUpdatedAt(basicDto.getUpdatedAt());

        response.setComments(new ArrayList<>());

        return response;
    }

    public PostDto.Response updatePost(Long userId, Long postId, PostDto.UpdateRequest request) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 검증
        if (!post.getAuthor().getId().equals(userId)) {
            throw BusinessException.forbidden("게시글을 수정할 권한이 없습니다.");
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCategory(request.getCategory());
        post.setLocationName(request.getLocationName());
        post.setLocationLatitude(request.getLocationLatitude());
        post.setLocationLongitude(request.getLocationLongitude());

        Post updatedPost = postRepository.save(post);
        log.info("게시글 수정: {} by user {}", postId, userId);

        return convertToDto(updatedPost);
    }

    public void deletePost(Long userId, Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 검증
        if (!post.getAuthor().getId().equals(userId)) {
            throw BusinessException.forbidden("게시글을 삭제할 권한이 없습니다.");
        }

        postRepository.delete(post);
        log.info("게시글 삭제: {} by user {}", postId, userId);
    }

    public void likePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.userNotFound(userId));

        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new RuntimeException("이미 좋아요한 게시글입니다.");
        }

        PostLike like = new PostLike();
        like.setPost(post);
        like.setUser(user);
        postLikeRepository.save(like);

        post.setLikeCount(post.getLikeCount() + 1);
        postRepository.save(post);

        log.debug("게시글 좋아요: {} by {}", postId, userId);
    }

    public void unlikePost(Long postId, Long userId) {
        PostLike like = postLikeRepository.findByPostIdAndUserId(postId, userId)
            .orElseThrow(() -> new RuntimeException("좋아요 기록을 찾을 수 없습니다."));

        postLikeRepository.delete(like);

        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
        postRepository.save(post);

        log.debug("게시글 좋아요 취소: {} by {}", postId, userId);
    }

    public List<String> uploadImages(Long userId, Long postId, List<MultipartFile> images) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 검증
        if (!post.getAuthor().getId().equals(userId)) {
            throw BusinessException.forbidden("게시글 이미지를 업로드할 권한이 없습니다.");
        }

        List<String> imageUrls = new ArrayList<>();

        for (MultipartFile image : images) {
            String imageUrl = fileUploadService.uploadImage(image);
            imageUrls.add(imageUrl);

            PostImage postImage = new PostImage();
            postImage.setPost(post);
            postImage.setImageUrl(imageUrl);
            postImage.setOriginalFilename(image.getOriginalFilename());
            postImage.setFileSize(image.getSize());
            postImage.setDisplayOrder(imageUrls.size() - 1);

            postImageRepository.save(postImage);
        }

        log.info("게시글 {} 이미지 {}개 업로드 by user {}", postId, images.size(), userId);
        return imageUrls;
    }

    @Transactional(readOnly = true)
    public List<PostDto.Response> getTrendingPosts() {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        Pageable pageable = PageRequest.of(0, 10);

        List<Post> trendingPosts = postRepository.findTrendingPosts(since, pageable);

        return trendingPosts.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PostDto.Response> getNearbyPosts(Double latitude, Double longitude, Double radiusKm) {
        List<Post> nearbyPosts = postRepository.findNearbyPosts(latitude, longitude, radiusKm);

        return nearbyPosts.stream()
            .limit(20)
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    private void savePostImages(Post post, List<String> imageUrls) {
        for (int i = 0; i < imageUrls.size(); i++) {
            PostImage postImage = new PostImage();
            postImage.setPost(post);
            postImage.setImageUrl(imageUrls.get(i));
            postImage.setDisplayOrder(i);
            postImageRepository.save(postImage);
        }
    }

    private PostDto.Response convertToDto(Post post) {
        PostDto.Response dto = new PostDto.Response();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setAuthor(convertUserToDto(post.getAuthor()));
        dto.setCategory(post.getCategory());
        dto.setLocationName(post.getLocationName());
        dto.setLocationLatitude(post.getLocationLatitude());
        dto.setLocationLongitude(post.getLocationLongitude());

        if (post.getImages() != null) {
            List<String> imageUrls = post.getImages().stream()
                .map(PostImage::getImageUrl)
                .collect(Collectors.toList());
            dto.setImageUrls(imageUrls);
        }

        dto.setViewCount(post.getViewCount());
        dto.setLikeCount(post.getLikeCount());
        dto.setCommentCount(post.getCommentCount());
        dto.setIsPinned(post.getIsPinned());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());

        return dto;
    }

    private UserDto.Response convertUserToDto(User user) {
        UserDto.Response dto = new UserDto.Response();
        dto.setId(user.getId());
        dto.setNickname(user.getNickname());
        dto.setProfileImageUrl(user.getProfileImageUrl());
        return dto;
    }
}
