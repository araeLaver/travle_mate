package com.travelmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class CommentDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "댓글 내용은 필수입니다.")
        @Size(max = 1000, message = "댓글은 1000자 이내로 작성해주세요.")
        private String content;

        // 답글인 경우 부모 댓글 ID
        private Long parentCommentId;

        // 멘션된 사용자 목록
        private List<Long> mentionedUserIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "댓글 내용은 필수입니다.")
        @Size(max = 1000, message = "댓글은 1000자 이내로 작성해주세요.")
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String content;
        private AuthorInfo author;
        private Long postId;
        private Long parentCommentId;
        private Integer likeCount;
        private Integer replyCount;
        private Boolean isLiked;
        private Boolean isOwner;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<Response> replies;
        private List<MentionInfo> mentions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorInfo {
        private Long id;
        private String username;
        private String nickname;
        private String profileImageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MentionInfo {
        private Long userId;
        private String username;
        private String nickname;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LikeResponse {
        private Long commentId;
        private Integer likeCount;
        private Boolean isLiked;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentListResponse {
        private Long postId;
        private Long totalCount;
        private List<Response> comments;
    }
}
