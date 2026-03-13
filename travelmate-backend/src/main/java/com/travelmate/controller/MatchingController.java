package com.travelmate.controller;

import com.travelmate.dto.MatchingHistoryDto;
import com.travelmate.dto.MatchingRequestDto;
import com.travelmate.dto.UserSummaryDto;
import com.travelmate.service.MatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
@Tag(name = "Matching", description = "동반자 매칭 API")
@SecurityRequirement(name = "bearerAuth")
public class MatchingController {

    private final MatchingService matchingService;

    /**
     * GET /api/matching/recommendations
     * 호환성 점수 기반 동반자 추천 목록 (차단/이미 요청한 사용자 제외)
     */
    @Operation(summary = "동반자 추천 목록", description = "호환성 점수 알고리즘 기반 동반자 추천 목록을 반환합니다.")
    @GetMapping("/recommendations")
    public ResponseEntity<Page<UserSummaryDto>> getRecommendations(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(matchingService.getRecommendations(Long.parseLong(userId), pageable));
    }

    /**
     * POST /api/matching/requests
     * 매칭 요청 전송 (PENDING 상태)
     * Body: { "toUserId": 123 }
     */
    @Operation(summary = "매칭 요청 전송", description = "상대방에게 동반자 매칭 요청을 보냅니다.")
    @PostMapping("/requests")
    public ResponseEntity<MatchingRequestDto.Response> sendMatchingRequest(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody MatchingRequestDto.Request request) {
        return ResponseEntity.ok(
                matchingService.sendMatchingRequest(Long.parseLong(userId), request.getToUserId()));
    }

    /**
     * PUT /api/matching/requests/{id}/accept
     * 매칭 요청 수락
     */
    @Operation(summary = "매칭 요청 수락", description = "받은 매칭 요청을 수락합니다.")
    @PutMapping("/requests/{id}/accept")
    public ResponseEntity<MatchingRequestDto.Response> acceptMatchingRequest(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(
                matchingService.acceptMatchingRequest(id, Long.parseLong(userId)));
    }

    /**
     * PUT /api/matching/requests/{id}/reject
     * 매칭 요청 거절
     */
    @Operation(summary = "매칭 요청 거절", description = "받은 매칭 요청을 거절합니다.")
    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<MatchingRequestDto.Response> rejectMatchingRequest(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(
                matchingService.rejectMatchingRequest(id, Long.parseLong(userId)));
    }

    /**
     * DELETE /api/matching/requests/{id}
     * 보낸 매칭 요청 취소 (PENDING → CANCELLED)
     */
    @Operation(summary = "매칭 요청 취소", description = "내가 보낸 PENDING 상태의 매칭 요청을 취소합니다.")
    @DeleteMapping("/requests/{id}")
    public ResponseEntity<Void> cancelMatchingRequest(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {
        matchingService.cancelMatchingRequest(Long.parseLong(userId), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/matching/requests/received
     * 받은 매칭 요청 목록 (PENDING)
     */
    @Operation(summary = "받은 매칭 요청 목록", description = "내가 받은 PENDING 상태의 매칭 요청 목록을 조회합니다.")
    @GetMapping("/requests/received")
    public ResponseEntity<Page<MatchingRequestDto.Response>> getReceivedMatchingRequests(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(
                matchingService.getReceivedRequests(Long.parseLong(userId), pageable));
    }

    /**
     * GET /api/matching/requests/sent
     * 보낸 매칭 요청 목록 (PENDING)
     */
    @Operation(summary = "보낸 매칭 요청 목록", description = "내가 보낸 PENDING 상태의 매칭 요청 목록을 조회합니다.")
    @GetMapping("/requests/sent")
    public ResponseEntity<Page<MatchingRequestDto.Response>> getSentMatchingRequests(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(
                matchingService.getSentRequests(Long.parseLong(userId), pageable));
    }

    /**
     * GET /api/matching/requests/pending/count
     * 대기 중인 받은 요청 수
     */
    @Operation(summary = "대기 중인 매칭 요청 수", description = "내가 받은 PENDING 상태의 매칭 요청 개수를 반환합니다.")
    @GetMapping("/requests/pending/count")
    public ResponseEntity<Map<String, Long>> getPendingRequestCount(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(
                Map.of("count", matchingService.getPendingRequestCount(Long.parseLong(userId))));
    }

    /**
     * GET /api/matching/history
     * 매칭 히스토리 (ACCEPTED 상태)
     */
    @Operation(summary = "매칭 히스토리", description = "수락된 매칭 히스토리 목록을 조회합니다.")
    @GetMapping("/history")
    public ResponseEntity<Page<MatchingHistoryDto>> getMatchingHistory(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(
                matchingService.getMatchingHistory(Long.parseLong(userId), pageable));
    }
}
