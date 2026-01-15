package com.travelmate.controller;

import com.travelmate.dto.nft.LocationReviewDto;
import com.travelmate.service.UserService;
import com.travelmate.service.nft.LocationReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class LocationReviewController {

    private final LocationReviewService locationReviewService;
    private final UserService userService;

    /**
     * 장소에 리뷰 작성
     * POST /api/locations/{locationId}/reviews
     */
    @PostMapping("/locations/{locationId}/reviews")
    public ResponseEntity<LocationReviewDto.Response> createReview(
            @PathVariable Long locationId,
            @Valid @RequestBody LocationReviewDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        LocationReviewDto.Response response = locationReviewService.createReview(userId, locationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 리뷰 수정
     * PUT /api/reviews/{reviewId}
     */
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<LocationReviewDto.Response> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody LocationReviewDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        LocationReviewDto.Response response = locationReviewService.updateReview(userId, reviewId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 리뷰 삭제
     * DELETE /api/reviews/{reviewId}
     */
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        locationReviewService.deleteReview(userId, reviewId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 장소별 리뷰 목록 조회
     * GET /api/locations/{locationId}/reviews
     */
    @GetMapping("/locations/{locationId}/reviews")
    public ResponseEntity<Page<LocationReviewDto.Response>> getLocationReviews(
            @PathVariable Long locationId,
            @RequestParam(defaultValue = "recent") String sort,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userDetails != null ? getCurrentUserId(userDetails) : null;
        Page<LocationReviewDto.Response> response = locationReviewService.getLocationReviews(userId, locationId, sort, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자의 리뷰 목록 조회
     * GET /api/users/{userId}/reviews
     */
    @GetMapping("/users/{targetUserId}/reviews")
    public ResponseEntity<Page<LocationReviewDto.Response>> getUserReviews(
            @PathVariable Long targetUserId,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userDetails != null ? getCurrentUserId(userDetails) : null;
        Page<LocationReviewDto.Response> response = locationReviewService.getUserReviews(userId, targetUserId, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * 리뷰 상세 조회
     * GET /api/reviews/{reviewId}
     */
    @GetMapping("/reviews/{reviewId}")
    public ResponseEntity<LocationReviewDto.Response> getReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userDetails != null ? getCurrentUserId(userDetails) : null;
        LocationReviewDto.Response response = locationReviewService.getReview(userId, reviewId);
        return ResponseEntity.ok(response);
    }

    /**
     * 도움됨 토글
     * POST /api/reviews/{reviewId}/helpful
     */
    @PostMapping("/reviews/{reviewId}/helpful")
    public ResponseEntity<Map<String, Boolean>> toggleHelpful(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        boolean isHelpful = locationReviewService.toggleHelpful(userId, reviewId);
        return ResponseEntity.ok(Map.of("isHelpful", isHelpful));
    }

    /**
     * 장소 리뷰 통계 조회
     * GET /api/locations/{locationId}/reviews/stats
     */
    @GetMapping("/locations/{locationId}/reviews/stats")
    public ResponseEntity<LocationReviewDto.LocationReviewStats> getLocationReviewStats(
            @PathVariable Long locationId) {

        LocationReviewDto.LocationReviewStats response = locationReviewService.getLocationReviewStats(locationId);
        return ResponseEntity.ok(response);
    }

    private Long getCurrentUserId(UserDetails userDetails) {
        String email = userDetails.getUsername();
        return userService.findByEmail(email).getId();
    }
}
