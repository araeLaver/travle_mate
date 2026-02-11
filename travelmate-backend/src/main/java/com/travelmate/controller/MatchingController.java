package com.travelmate.controller;

import com.travelmate.dto.MatchingDto;
import com.travelmate.dto.MatchingDto.*;
import com.travelmate.service.CompanionMatchingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final CompanionMatchingService matchingService;

    @GetMapping("/recommendations")
    public ResponseEntity<List<MatchRecommendation>> getRecommendations(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "10") int limit) {
        List<MatchRecommendation> recommendations = matchingService
                .getMatchRecommendations(Long.parseLong(userId), limit);
        return ResponseEntity.ok(recommendations);
    }

    @PostMapping("/requests")
    public ResponseEntity<MatchRequestResponse> sendMatchRequest(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody SendMatchRequest request) {
        MatchRequestResponse response = matchingService
                .sendMatchRequest(Long.parseLong(userId), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/requests/{id}/respond")
    public ResponseEntity<MatchRequestResponse> respondToRequest(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id,
            @Valid @RequestBody RespondMatchRequest request) {
        MatchRequestResponse response = matchingService
                .respondToMatchRequest(Long.parseLong(userId), id, request.getAccept());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<Void> cancelRequest(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {
        matchingService.cancelMatchRequest(Long.parseLong(userId), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/requests/received")
    public ResponseEntity<Page<MatchRequestResponse>> getReceivedRequests(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<MatchRequestResponse> requests = matchingService
                .getReceivedRequests(Long.parseLong(userId), PageRequest.of(page, size));
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<Page<MatchRequestResponse>> getSentRequests(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<MatchRequestResponse> requests = matchingService
                .getSentRequests(Long.parseLong(userId), PageRequest.of(page, size));
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/history")
    public ResponseEntity<List<MatchHistoryResponse>> getMatchHistory(
            @AuthenticationPrincipal String userId) {
        List<MatchHistoryResponse> history = matchingService
                .getMatchHistory(Long.parseLong(userId));
        return ResponseEntity.ok(history);
    }

    @GetMapping("/requests/pending/count")
    public ResponseEntity<Map<String, Long>> getPendingCount(
            @AuthenticationPrincipal String userId) {
        long count = matchingService.getPendingRequestCount(Long.parseLong(userId));
        return ResponseEntity.ok(Map.of("count", count));
    }
}
