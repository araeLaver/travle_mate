package com.travelmate.dto.itinerary;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "댓글 응답")
public class CommentResponse {

    @Schema(description = "댓글 ID", example = "1")
    private Long id;

    @Schema(description = "댓글 내용", example = "정말 좋은 일정이네요!")
    private String content;

    @Schema(description = "작성자 정보")
    private AuthorInfo author;

    @Schema(description = "부모 댓글 ID (대댓글인 경우)", example = "1")
    private Long parentId;

    @Schema(description = "대댓글 목록")
    private List<CommentResponse> replies;

    @Schema(description = "대댓글 수", example = "3")
    private int replyCount;

    @Schema(description = "삭제 여부", example = "false")
    private boolean isDeleted;

    @Schema(description = "현재 사용자가 작성자인지 여부", example = "true")
    private boolean isAuthor;

    @Schema(description = "생성 일시")
    private LocalDateTime createdAt;

    @Schema(description = "수정 일시")
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "작성자 정보")
    public static class AuthorInfo {
        @Schema(description = "사용자 ID", example = "1")
        private Long id;

        @Schema(description = "닉네임", example = "여행러버")
        private String nickname;

        @Schema(description = "프로필 이미지 URL")
        private String profileImage;
    }
}
