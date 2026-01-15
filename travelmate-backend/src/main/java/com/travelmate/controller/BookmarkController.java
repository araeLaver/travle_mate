package com.travelmate.controller;

import com.travelmate.dto.BookmarkDto;
import com.travelmate.entity.Bookmark;
import com.travelmate.security.CurrentUser;
import com.travelmate.security.UserPrincipal;
import com.travelmate.service.BookmarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Bookmarks", description = "북마크 관리 API")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping
    @Operation(summary = "북마크 추가", description = "대상을 북마크에 추가합니다.")
    public ResponseEntity<BookmarkDto.Response> createBookmark(
            @CurrentUser UserPrincipal userPrincipal,
            @Valid @RequestBody BookmarkDto.CreateRequest request) {

        BookmarkDto.Response response = bookmarkService.createBookmark(
                userPrincipal.getId(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/toggle")
    @Operation(summary = "북마크 토글", description = "북마크를 추가하거나 제거합니다.")
    public ResponseEntity<BookmarkDto.ToggleResponse> toggleBookmark(
            @CurrentUser UserPrincipal userPrincipal,
            @RequestParam Bookmark.TargetType targetType,
            @RequestParam Long targetId) {

        BookmarkDto.ToggleResponse response = bookmarkService.toggleBookmark(
                userPrincipal.getId(), targetType, targetId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{bookmarkId}")
    @Operation(summary = "북마크 수정", description = "북마크의 폴더명이나 메모를 수정합니다.")
    public ResponseEntity<BookmarkDto.Response> updateBookmark(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable Long bookmarkId,
            @Valid @RequestBody BookmarkDto.UpdateRequest request) {

        BookmarkDto.Response response = bookmarkService.updateBookmark(
                userPrincipal.getId(), bookmarkId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{bookmarkId}")
    @Operation(summary = "북마크 삭제", description = "북마크를 삭제합니다.")
    public ResponseEntity<Void> deleteBookmark(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable Long bookmarkId) {

        bookmarkService.deleteBookmark(userPrincipal.getId(), bookmarkId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "내 북마크 목록 조회", description = "내 북마크 목록을 조회합니다.")
    public ResponseEntity<BookmarkDto.ListResponse> getMyBookmarks(
            @CurrentUser UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        BookmarkDto.ListResponse response = bookmarkService.getMyBookmarks(
                userPrincipal.getId(), pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/type/{targetType}")
    @Operation(summary = "타입별 북마크 조회", description = "특정 타입의 북마크 목록을 조회합니다.")
    public ResponseEntity<BookmarkDto.ListResponse> getMyBookmarksByType(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable Bookmark.TargetType targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        BookmarkDto.ListResponse response = bookmarkService.getMyBookmarksByType(
                userPrincipal.getId(), targetType, pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/folder/{folderName}")
    @Operation(summary = "폴더별 북마크 조회", description = "특정 폴더의 북마크 목록을 조회합니다.")
    public ResponseEntity<BookmarkDto.ListResponse> getMyBookmarksByFolder(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable String folderName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        BookmarkDto.ListResponse response = bookmarkService.getMyBookmarksByFolder(
                userPrincipal.getId(), folderName, pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    @Operation(summary = "북마크 상태 조회", description = "특정 대상의 북마크 여부를 조회합니다.")
    public ResponseEntity<BookmarkDto.StatusResponse> getBookmarkStatus(
            @CurrentUser UserPrincipal userPrincipal,
            @RequestParam Bookmark.TargetType targetType,
            @RequestParam Long targetId) {

        BookmarkDto.StatusResponse response = bookmarkService.getBookmarkStatus(
                userPrincipal.getId(), targetType, targetId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/status/batch")
    @Operation(summary = "북마크 상태 일괄 조회", description = "여러 대상의 북마크 여부를 일괄 조회합니다.")
    public ResponseEntity<BookmarkDto.BatchStatusResponse> getBatchBookmarkStatus(
            @CurrentUser UserPrincipal userPrincipal,
            @Valid @RequestBody BookmarkDto.BatchStatusRequest request) {

        BookmarkDto.BatchStatusResponse response = bookmarkService.getBatchBookmarkStatus(
                userPrincipal.getId(), request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @Operation(summary = "북마크 통계 조회", description = "내 북마크 통계를 조회합니다.")
    public ResponseEntity<BookmarkDto.StatsResponse> getBookmarkStats(
            @CurrentUser UserPrincipal userPrincipal) {

        BookmarkDto.StatsResponse response = bookmarkService.getBookmarkStats(
                userPrincipal.getId());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/folders/rename")
    @Operation(summary = "폴더명 변경", description = "북마크 폴더명을 일괄 변경합니다.")
    public ResponseEntity<Integer> renameFolder(
            @CurrentUser UserPrincipal userPrincipal,
            @Valid @RequestBody BookmarkDto.FolderRenameRequest request) {

        int updatedCount = bookmarkService.renameFolder(userPrincipal.getId(), request);
        return ResponseEntity.ok(updatedCount);
    }
}
