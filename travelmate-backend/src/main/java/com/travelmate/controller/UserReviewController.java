package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.UserReviewDto;
import com.travelmate.service.UserReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
@Slf4j
public class UserReviewController {

    private final UserReviewService userReviewService;

    /**
     * 사용자 평가 작성
     * POST /users/{revieweeId}/user-reviews
     */
    @PostMapping("/users/{revieweeId}/user-reviews")
    public ResponseEntity<UserReviewDto.Response> createReview(
            @PathVariable Long revieweeId,
            @Valid @RequestBody UserReviewDto.CreateRequest request,
            @AuthenticationPrincipal String userId) {

        Long reviewerId = AuthenticatedUserId.parse(userId);
        UserReviewDto.Response response = userReviewService.createReview(reviewerId, revieweeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 특정 사용자에 대한 평가 목록 조회
     * GET /users/{userId}/user-reviews
     */
    @GetMapping("/users/{userId}/user-reviews")
    public ResponseEntity<List<UserReviewDto.Response>> getReviewsForUser(
            @PathVariable Long userId) {

        List<UserReviewDto.Response> response = userReviewService.getReviewsForUser(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 사용자의 평가 통계 조회
     * GET /users/{userId}/user-reviews/stats
     */
    @GetMapping("/users/{userId}/user-reviews/stats")
    public ResponseEntity<UserReviewDto.UserReviewStats> getReviewStats(
            @PathVariable Long userId) {

        UserReviewDto.UserReviewStats response = userReviewService.getReviewStats(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 평가 삭제 (작성자 본인만)
     * DELETE /user-reviews/{reviewId}
     */
    @DeleteMapping("/user-reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal String userId) {

        Long reviewerId = AuthenticatedUserId.parse(userId);
        userReviewService.deleteReview(reviewerId, reviewId);
        return ResponseEntity.noContent().build();
    }
}
