package com.travelmate.controller;

import com.travelmate.dto.PostDto;
import com.travelmate.entity.Post;
import com.travelmate.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PostController {
    
    private final PostService postService;
    
    @PostMapping
    public ResponseEntity<PostDto.Response> createPost(
            @Valid @RequestBody PostDto.CreateRequest request) {
        PostDto.Response response = postService.createPost(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<Page<PostDto.Response>> getPosts(
            @RequestParam(required = false) Post.Category category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            Pageable pageable) {
        Page<PostDto.Response> posts = postService.getPosts(category, keyword, location, pageable);
        return ResponseEntity.ok(posts);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PostDto.DetailResponse> getPost(@PathVariable Long id) {
        PostDto.DetailResponse post = postService.getPostDetail(id);
        return ResponseEntity.ok(post);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PostDto.Response> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostDto.UpdateRequest request) {
        PostDto.Response response = postService.updatePost(id, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/like")
    public ResponseEntity<Void> likePost(@PathVariable Long id, @RequestParam Long userId) {
        postService.likePost(id, userId);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> unlikePost(@PathVariable Long id, @RequestParam Long userId) {
        postService.unlikePost(id, userId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/images")
    public ResponseEntity<List<String>> uploadImages(
            @PathVariable Long id,
            @RequestParam("images") List<MultipartFile> images) {
        List<String> imageUrls = postService.uploadImages(id, images);
        return ResponseEntity.ok(imageUrls);
    }
    
    @GetMapping("/trending")
    public ResponseEntity<List<PostDto.Response>> getTrendingPosts() {
        List<PostDto.Response> trendingPosts = postService.getTrendingPosts();
        return ResponseEntity.ok(trendingPosts);
    }
    
    @GetMapping("/nearby")
    public ResponseEntity<List<PostDto.Response>> getNearbyPosts(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10.0") Double radiusKm) {
        List<PostDto.Response> nearbyPosts = postService.getNearbyPosts(latitude, longitude, radiusKm);
        return ResponseEntity.ok(nearbyPosts);
    }
}