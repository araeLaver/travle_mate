package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.itinerary.*;
import com.travelmate.entity.ItineraryCollaborator.CollaboratorRole;
import com.travelmate.service.ItineraryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/itineraries")
@RequiredArgsConstructor
@Tag(name = "Itinerary", description = "여행 일정 관리 API")
public class ItineraryController {

    private final ItineraryService itineraryService;

    // ==================== 일정 CRUD ====================

    @PostMapping
    @Operation(summary = "일정 생성", description = "새로운 여행 일정을 생성합니다.")
    public ResponseEntity<ItineraryResponse> createItinerary(
            @AuthenticationPrincipal String userDetails,
            @Valid @RequestBody CreateItineraryRequest request) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        ItineraryResponse response = itineraryService.createItinerary(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "일정 조회", description = "일정 상세 정보를 조회합니다.")
    public ResponseEntity<ItineraryResponse> getItinerary(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long id) {
        Long userId = userDetails != null ? AuthenticatedUserId.parse(userDetails) : null;
        return ResponseEntity.ok(itineraryService.getItinerary(id, userId));
    }

    @GetMapping("/share/{shareCode}")
    @Operation(summary = "공유 코드로 일정 조회", description = "공유 코드를 사용하여 일정을 조회합니다.")
    public ResponseEntity<ItineraryResponse> getItineraryByShareCode(
            @AuthenticationPrincipal String userDetails,
            @PathVariable String shareCode) {
        Long userId = userDetails != null ? AuthenticatedUserId.parse(userDetails) : null;
        return ResponseEntity.ok(itineraryService.getItineraryByShareCode(shareCode, userId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "일정 수정", description = "일정 정보를 수정합니다.")
    public ResponseEntity<ItineraryResponse> updateItinerary(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateItineraryRequest request) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.ok(itineraryService.updateItinerary(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "일정 삭제", description = "일정을 삭제합니다.")
    public ResponseEntity<Void> deleteItinerary(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long id) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.deleteItinerary(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/copy")
    @Operation(summary = "일정 복사", description = "다른 사용자의 일정을 복사합니다.")
    public ResponseEntity<ItineraryResponse> copyItinerary(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long id) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(itineraryService.copyItinerary(userId, id));
    }

    // ==================== 일정 목록 조회 ====================

    @GetMapping("/my")
    @Operation(summary = "내 일정 목록", description = "내가 만든 일정 목록을 조회합니다.")
    public ResponseEntity<Page<ItineraryResponse>> getMyItineraries(
            @AuthenticationPrincipal String userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.ok(itineraryService.getMyItineraries(userId, pageable));
    }

    @GetMapping("/collaborating")
    @Operation(summary = "협업 중인 일정 목록", description = "협업자로 참여 중인 일정 목록을 조회합니다.")
    public ResponseEntity<Page<ItineraryResponse>> getCollaboratingItineraries(
            @AuthenticationPrincipal String userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.ok(itineraryService.getCollaboratingItineraries(userId, pageable));
    }

    @GetMapping("/public")
    @Operation(summary = "공개 일정 목록", description = "전체 공개 일정 목록을 조회합니다.")
    public ResponseEntity<Page<ItineraryResponse>> getPublicItineraries(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(itineraryService.getPublicItineraries(pageable));
    }

    @GetMapping("/popular")
    @Operation(summary = "인기 일정 목록", description = "인기 일정 목록을 조회합니다.")
    public ResponseEntity<Page<ItineraryResponse>> getPopularItineraries(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(itineraryService.getPopularItineraries(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "일정 검색", description = "키워드로 공개 일정을 검색합니다.")
    public ResponseEntity<Page<ItineraryResponse>> searchItineraries(
            @RequestParam String keyword,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(itineraryService.searchItineraries(keyword, pageable));
    }

    // ==================== 아이템 관리 ====================

    @PostMapping("/{itineraryId}/items")
    @Operation(summary = "아이템 추가", description = "일정에 새로운 아이템을 추가합니다.")
    public ResponseEntity<ItineraryItemResponse> addItem(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itineraryId,
            @Valid @RequestBody CreateItemRequest request) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itineraryService.addItem(userId, itineraryId, request));
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "아이템 수정", description = "일정 아이템을 수정합니다.")
    public ResponseEntity<ItineraryItemResponse> updateItem(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateItemRequest request) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.ok(itineraryService.updateItem(userId, itemId, request));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "아이템 삭제", description = "일정 아이템을 삭제합니다.")
    public ResponseEntity<Void> deleteItem(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itemId) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.deleteItem(userId, itemId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{itineraryId}/items/reorder")
    @Operation(summary = "아이템 순서 변경", description = "일정 아이템들의 순서를 변경합니다.")
    public ResponseEntity<Void> reorderItems(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itineraryId,
            @Valid @RequestBody List<ReorderItemRequest> requests) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.reorderItems(userId, itineraryId, requests);
        return ResponseEntity.ok().build();
    }

    // ==================== 협업자 관리 ====================

    @PostMapping("/{itineraryId}/collaborators")
    @Operation(summary = "협업자 초대", description = "일정에 협업자를 초대합니다.")
    public ResponseEntity<Void> inviteCollaborator(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itineraryId,
            @Valid @RequestBody InviteCollaboratorRequest request) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.inviteCollaborator(userId, itineraryId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{itineraryId}/collaborators")
    @Operation(summary = "협업자 목록", description = "일정의 협업자 목록을 조회합니다.")
    public ResponseEntity<List<CollaboratorResponse>> getCollaborators(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itineraryId) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.ok(itineraryService.getCollaborators(itineraryId, userId));
    }

    @PostMapping("/invites/{collaboratorId}/accept")
    @Operation(summary = "초대 수락", description = "협업자 초대를 수락합니다.")
    public ResponseEntity<Void> acceptInvite(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long collaboratorId) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.respondToInvite(userId, collaboratorId, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/invites/{collaboratorId}/decline")
    @Operation(summary = "초대 거절", description = "협업자 초대를 거절합니다.")
    public ResponseEntity<Void> declineInvite(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long collaboratorId) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.respondToInvite(userId, collaboratorId, false);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/invites/pending")
    @Operation(summary = "대기 중인 초대 목록", description = "대기 중인 협업자 초대 목록을 조회합니다.")
    public ResponseEntity<List<CollaboratorResponse>> getPendingInvites(
            @AuthenticationPrincipal String userDetails) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.ok(itineraryService.getPendingInvites(userId));
    }

    @DeleteMapping("/{itineraryId}/collaborators/{collaboratorUserId}")
    @Operation(summary = "협업자 제거", description = "일정에서 협업자를 제거합니다.")
    public ResponseEntity<Void> removeCollaborator(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itineraryId,
            @PathVariable Long collaboratorUserId) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.removeCollaborator(userId, itineraryId, collaboratorUserId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{itineraryId}/collaborators/{collaboratorUserId}/role")
    @Operation(summary = "협업자 역할 변경", description = "협업자의 역할을 변경합니다.")
    public ResponseEntity<Void> updateCollaboratorRole(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itineraryId,
            @PathVariable Long collaboratorUserId,
            @RequestParam CollaboratorRole role) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.updateCollaboratorRole(userId, itineraryId, collaboratorUserId, role);
        return ResponseEntity.ok().build();
    }

    // ==================== 좋아요 기능 ====================

    @PostMapping("/{id}/like")
    @Operation(summary = "좋아요 토글", description = "일정에 좋아요를 추가하거나 취소합니다.")
    public ResponseEntity<LikeResponse> toggleLike(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long id) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        boolean isLiked = itineraryService.toggleLike(userId, id);
        return ResponseEntity.ok(new LikeResponse(isLiked));
    }

    @GetMapping("/{id}/like")
    @Operation(summary = "좋아요 여부 확인", description = "현재 사용자가 해당 일정에 좋아요를 했는지 확인합니다.")
    public ResponseEntity<LikeResponse> isLiked(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long id) {
        Long userId = userDetails != null ? AuthenticatedUserId.parse(userDetails) : null;
        boolean isLiked = itineraryService.isLiked(userId, id);
        return ResponseEntity.ok(new LikeResponse(isLiked));
    }

    @GetMapping("/liked")
    @Operation(summary = "좋아요한 일정 목록", description = "현재 사용자가 좋아요한 일정 목록을 조회합니다.")
    public ResponseEntity<Page<ItineraryResponse>> getLikedItineraries(
            @AuthenticationPrincipal String userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.ok(itineraryService.getLikedItineraries(userId, pageable));
    }

    // ==================== 댓글 기능 ====================

    @PostMapping("/{itineraryId}/comments")
    @Operation(summary = "댓글 작성", description = "일정에 댓글을 작성합니다.")
    public ResponseEntity<CommentResponse> addComment(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itineraryId,
            @Valid @RequestBody CreateCommentRequest request) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        CommentResponse response = itineraryService.addComment(userId, itineraryId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{itineraryId}/comments")
    @Operation(summary = "댓글 목록 조회", description = "일정의 댓글 목록을 조회합니다.")
    public ResponseEntity<Page<CommentResponse>> getComments(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long itineraryId,
            @PageableDefault(size = 20) Pageable pageable) {
        Long userId = userDetails != null ? AuthenticatedUserId.parse(userDetails) : null;
        return ResponseEntity.ok(itineraryService.getComments(itineraryId, userId, pageable));
    }

    @PutMapping("/comments/{commentId}")
    @Operation(summary = "댓글 수정", description = "댓글을 수정합니다.")
    public ResponseEntity<CommentResponse> updateComment(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        return ResponseEntity.ok(itineraryService.updateComment(userId, commentId, request));
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "댓글 삭제", description = "댓글을 삭제합니다.")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal String userDetails,
            @PathVariable Long commentId) {
        Long userId = AuthenticatedUserId.parse(userDetails);
        itineraryService.deleteComment(userId, commentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{itineraryId}/comments/count")
    @Operation(summary = "댓글 수 조회", description = "일정의 댓글 수를 조회합니다.")
    public ResponseEntity<Long> getCommentCount(@PathVariable Long itineraryId) {
        return ResponseEntity.ok(itineraryService.getCommentCount(itineraryId));
    }
}
