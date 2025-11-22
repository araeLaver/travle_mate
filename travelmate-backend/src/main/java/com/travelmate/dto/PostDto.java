package com.travelmate.dto;

import com.travelmate.entity.Post;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class PostDto {
    
    @Data
    public static class CreateRequest {
        @NotBlank
        private String title;
        
        @NotBlank
        private String content;
        
        @NotNull
        private Long authorId;
        
        @NotNull
        private Post.Category category;
        
        private String locationName;
        private Double locationLatitude;
        private Double locationLongitude;
        private List<String> imageUrls;
    }
    
    @Data
    public static class UpdateRequest {
        @NotBlank
        private String title;
        
        @NotBlank
        private String content;
        
        @NotNull
        private Post.Category category;
        
        private String locationName;
        private Double locationLatitude;
        private Double locationLongitude;
    }
    
    @Data
    public static class Response {
        private Long id;
        private String title;
        private String content;
        private UserDto.Response author;
        private Post.Category category;
        private String locationName;
        private Double locationLatitude;
        private Double locationLongitude;
        private List<String> imageUrls;
        private Integer viewCount;
        private Integer likeCount;
        private Integer commentCount;
        private Boolean isPinned;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    
    @Data
    public static class DetailResponse extends Response {
        private List<CommentDto.Response> comments;
        private Boolean isLikedByCurrentUser;
    }
    
    @Data
    public static class CommentDto {
        
        @Data
        public static class CreateRequest {
            @NotBlank
            private String content;
            
            @NotNull
            private Long postId;
            
            @NotNull
            private Long authorId;
            
            private Long parentCommentId;
        }
        
        @Data
        public static class Response {
            private Long id;
            private String content;
            private UserDto.Response author;
            private Long parentCommentId;
            private List<Response> replies;
            private Integer likeCount;
            private Boolean isDeleted;
            private LocalDateTime createdAt;
            private LocalDateTime updatedAt;
        }
    }
}