package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.FollowDto;
import com.travelmate.service.FollowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class FollowController {

    private final FollowService followService;

    /**
     * 팔로우하기
     * POST /api/users/{userId}/follow
     */
    @PostMapping("/{userId}/follow")
    public ResponseEntity<FollowDto.FollowResponse> follow(
            @PathVariable Long userId,
            @AuthenticationPrincipal String principalUserId) {

        Long followerId = parseUserId(principalUserId);
        FollowDto.FollowResponse response = followService.follow(followerId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 언팔로우하기
     * DELETE /api/users/{userId}/follow
     */
    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<FollowDto.FollowResponse> unfollow(
            @PathVariable Long userId,
            @AuthenticationPrincipal String principalUserId) {

        Long followerId = parseUserId(principalUserId);
        FollowDto.FollowResponse response = followService.unfollow(followerId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 팔로워 목록 조회 (나를 팔로우하는 사람들)
     * GET /api/users/{userId}/followers
     */
    @GetMapping("/{userId}/followers")
    public ResponseEntity<Page<FollowDto.FollowUserResponse>> getFollowers(
            @PathVariable Long userId,
            @AuthenticationPrincipal String principalUserId,
            @PageableDefault(size = 20) Pageable pageable) {

        Long viewerId = principalUserId != null ? parseUserId(principalUserId) : null;
        Page<FollowDto.FollowUserResponse> followers = followService.getFollowers(userId, viewerId, pageable);
        return ResponseEntity.ok(followers);
    }

    /**
     * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
     * GET /api/users/{userId}/following
     */
    @GetMapping("/{userId}/following")
    public ResponseEntity<Page<FollowDto.FollowUserResponse>> getFollowing(
            @PathVariable Long userId,
            @AuthenticationPrincipal String principalUserId,
            @PageableDefault(size = 20) Pageable pageable) {

        Long viewerId = principalUserId != null ? parseUserId(principalUserId) : null;
        Page<FollowDto.FollowUserResponse> following = followService.getFollowing(userId, viewerId, pageable);
        return ResponseEntity.ok(following);
    }

    /**
     * 팔로우 통계 조회
     * GET /api/users/{userId}/follow-stats
     */
    @GetMapping("/{userId}/follow-stats")
    public ResponseEntity<FollowDto.FollowStatsResponse> getFollowStats(@PathVariable Long userId) {
        FollowDto.FollowStatsResponse stats = followService.getFollowStats(userId);
        return ResponseEntity.ok(stats);
    }

    /**
     * 팔로우 상태 확인
     * GET /api/users/{userId}/follow-status
     */
    @GetMapping("/{userId}/follow-status")
    public ResponseEntity<FollowDto.FollowStatusResponse> getFollowStatus(
            @PathVariable Long userId,
            @AuthenticationPrincipal String principalUserId) {

        Long viewerId = parseUserId(principalUserId);
        FollowDto.FollowStatusResponse status = followService.getFollowStatus(viewerId, userId);
        return ResponseEntity.ok(status);
    }

    /**
     * 맞팔로우 목록 조회
     * GET /api/users/{userId}/mutual-followers
     */
    @GetMapping("/{userId}/mutual-followers")
    public ResponseEntity<Page<FollowDto.FollowUserResponse>> getMutualFollowers(
            @PathVariable Long userId,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<FollowDto.FollowUserResponse> mutualFollowers = followService.getMutualFollowers(userId, pageable);
        return ResponseEntity.ok(mutualFollowers);
    }

    /**
     * 내 팔로워 목록 조회 (로그인 사용자)
     * GET /api/users/me/followers
     */
    @GetMapping("/me/followers")
    public ResponseEntity<Page<FollowDto.FollowUserResponse>> getMyFollowers(
            @AuthenticationPrincipal String principalUserId,
            @PageableDefault(size = 20) Pageable pageable) {

        Long userId = parseUserId(principalUserId);
        Page<FollowDto.FollowUserResponse> followers = followService.getFollowers(userId, userId, pageable);
        return ResponseEntity.ok(followers);
    }

    /**
     * 내 팔로잉 목록 조회 (로그인 사용자)
     * GET /api/users/me/following
     */
    @GetMapping("/me/following")
    public ResponseEntity<Page<FollowDto.FollowUserResponse>> getMyFollowing(
            @AuthenticationPrincipal String principalUserId,
            @PageableDefault(size = 20) Pageable pageable) {

        Long userId = parseUserId(principalUserId);
        Page<FollowDto.FollowUserResponse> following = followService.getFollowing(userId, userId, pageable);
        return ResponseEntity.ok(following);
    }

    /**
     * 내 팔로우 통계 조회 (로그인 사용자)
     * GET /api/users/me/follow-stats
     */
    @GetMapping("/me/follow-stats")
    public ResponseEntity<FollowDto.FollowStatsResponse> getMyFollowStats(
            @AuthenticationPrincipal String principalUserId) {

        Long userId = parseUserId(principalUserId);
        FollowDto.FollowStatsResponse stats = followService.getFollowStats(userId);
        return ResponseEntity.ok(stats);
    }

    /**
     * 사용자들의 팔로우 상태 배치 조회
     * POST /api/users/follow-status/batch
     */
    @PostMapping("/follow-status/batch")
    public ResponseEntity<List<FollowDto.UserWithFollowStatus>> getFollowStatusBatch(
            @RequestBody Map<String, List<Long>> request,
            @AuthenticationPrincipal String principalUserId) {

        Long viewerId = parseUserId(principalUserId);
        List<Long> userIds = request.get("userIds");

        if (userIds == null || userIds.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<FollowDto.UserWithFollowStatus> result = followService.getUsersWithFollowStatus(viewerId, userIds);
        return ResponseEntity.ok(result);
    }

    private Long parseUserId(String userId) {
        return AuthenticatedUserId.parse(userId);
    }
}
