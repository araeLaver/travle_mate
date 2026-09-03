package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.CommentDto;
import com.travelmate.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "댓글 관리 API")
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/posts/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "댓글 작성", description = "게시글에 댓글을 작성합니다.")
    public ResponseEntity<CommentDto.Response> createComment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long postId,
            @Valid @RequestBody CommentDto.CreateRequest request) {

        CommentDto.Response response = commentService.createComment(
                parseUserId(userId), postId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/posts/{postId}/comments")
    @Operation(summary = "댓글 목록 조회", description = "게시글의 댓글 목록을 조회합니다.")
    public ResponseEntity<CommentDto.CommentListResponse> getComments(
            @AuthenticationPrincipal @Parameter(hidden = true) String principalUserId,
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long userId = principalUserId != null ? parseUserId(principalUserId) : null;
        Pageable pageable = PageRequest.of(page, size);

        CommentDto.CommentListResponse response = commentService.getCommentsByPostId(postId, userId, pageable);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "댓글 수정", description = "댓글을 수정합니다.")
    public ResponseEntity<CommentDto.Response> updateComment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentDto.UpdateRequest request) {

        CommentDto.Response response = commentService.updateComment(
                parseUserId(userId), commentId, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "댓글 삭제", description = "댓글을 삭제합니다.")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long commentId) {

        commentService.deleteComment(parseUserId(userId), commentId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/comments/{commentId}/like")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "댓글 좋아요", description = "댓글에 좋아요를 추가합니다.")
    public ResponseEntity<CommentDto.LikeResponse> likeComment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long commentId) {

        CommentDto.LikeResponse response = commentService.likeComment(
                parseUserId(userId), commentId);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/comments/{commentId}/like")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "댓글 좋아요 취소", description = "댓글의 좋아요를 취소합니다.")
    public ResponseEntity<CommentDto.LikeResponse> unlikeComment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long commentId) {

        CommentDto.LikeResponse response = commentService.unlikeComment(
                parseUserId(userId), commentId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/comments/{commentId}/replies")
    @Operation(summary = "답글 목록 조회", description = "댓글의 답글 목록을 조회합니다.")
    public ResponseEntity<List<CommentDto.Response>> getReplies(
            @AuthenticationPrincipal @Parameter(hidden = true) String principalUserId,
            @PathVariable Long commentId) {

        Long userId = principalUserId != null ? parseUserId(principalUserId) : null;

        List<CommentDto.Response> responses = commentService.getReplies(commentId, userId);

        return ResponseEntity.ok(responses);
    }

    private Long parseUserId(String userId) {
        return AuthenticatedUserId.parse(userId);
    }
}
