package com.travelmate.controller;

import com.travelmate.dto.TravelReviewDto;
import com.travelmate.service.TravelReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 동행 후 상호평가 API
 *
 * <ul>
 *   <li>POST   /api/reviews              — 리뷰 작성</li>
 *   <li>GET    /api/reviews/user/{userId} — 특정 유저가 받은 리뷰 목록</li>
 *   <li>GET    /api/reviews/match/{matchId} — 특정 매칭의 리뷰 목록</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
public class TravelReviewController {

    private final TravelReviewService travelReviewService;

    /**
     * 동행 후 평가 작성
     * POST /api/reviews
     */
    @PostMapping
    public ResponseEntity<TravelReviewDto.ReviewResponse> createReview(
            @Valid @RequestBody TravelReviewDto.CreateReviewRequest request,
            @AuthenticationPrincipal String userId) {

        Long reviewerId = Long.parseLong(userId);
        TravelReviewDto.ReviewResponse response = travelReviewService.createReview(reviewerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 특정 사용자가 받은 리뷰 목록 조회
     * GET /api/reviews/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TravelReviewDto.ReviewResponse>> getReviewsForUser(
            @PathVariable Long userId) {

        List<TravelReviewDto.ReviewResponse> response = travelReviewService.getReviewsForUser(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 매칭에 대한 리뷰 목록 조회 (양방향 포함)
     * GET /api/reviews/match/{matchId}
     */
    @GetMapping("/match/{matchId}")
    public ResponseEntity<List<TravelReviewDto.ReviewResponse>> getReviewsForMatch(
            @PathVariable Long matchId) {

        List<TravelReviewDto.ReviewResponse> response = travelReviewService.getReviewsForMatch(matchId);
        return ResponseEntity.ok(response);
    }
}
