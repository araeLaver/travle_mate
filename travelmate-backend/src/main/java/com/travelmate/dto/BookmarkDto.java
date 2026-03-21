package com.travelmate.dto;

import com.travelmate.entity.Bookmark;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class BookmarkDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull(message = "대상 타입은 필수입니다.")
        private Bookmark.TargetType targetType;

        @NotNull(message = "대상 ID는 필수입니다.")
        private Long targetId;

        @Size(max = 100, message = "폴더명은 100자 이내로 입력해주세요.")
        private String folderName;

        @Size(max = 500, message = "메모는 500자 이내로 입력해주세요.")
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @Size(max = 100, message = "폴더명은 100자 이내로 입력해주세요.")
        private String folderName;

        @Size(max = 500, message = "메모는 500자 이내로 입력해주세요.")
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String targetType;
        private String targetTypeDisplayName;
        private Long targetId;
        private TargetInfo target;
        private String folderName;
        private String note;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TargetInfo {
        private Long id;
        private String type;
        private String title;
        private String description;
        private String imageUrl;
        private String authorName;
        private Long authorId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListResponse {
        private List<Response> bookmarks;
        private Long totalCount;
        private boolean hasMore;
        private int page;
        private int size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToggleResponse {
        private String targetType;
        private Long targetId;
        private boolean isBookmarked;
        private String folderName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusResponse {
        private String targetType;
        private Long targetId;
        private boolean isBookmarked;
        private Long bookmarkId;
        private String folderName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchStatusRequest {
        @NotNull
        private Bookmark.TargetType targetType;

        @NotNull
        @Size(min = 1, max = 100, message = "대상 ID는 1개 이상 100개 이하로 지정해주세요.")
        private List<Long> targetIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchStatusResponse {
        private String targetType;
        private Map<Long, Boolean> bookmarkStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private Long userId;
        private Long totalBookmarks;
        private Map<String, Long> countByType;
        private List<String> folders;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FolderRenameRequest {
        @NotNull(message = "기존 폴더명은 필수입니다.")
        private String oldFolderName;

        @NotNull(message = "새 폴더명은 필수입니다.")
        @Size(max = 100, message = "폴더명은 100자 이내로 입력해주세요.")
        private String newFolderName;
    }
}
