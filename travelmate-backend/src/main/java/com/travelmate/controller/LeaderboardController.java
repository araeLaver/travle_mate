package com.travelmate.controller;

import com.travelmate.dto.LeaderboardDto;
import com.travelmate.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Leaderboard Controller
 *
 * REST API endpoints for NFT collection leaderboards.
 */
@RestController
@RequestMapping("/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "NFT 수집 리더보드 API")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/global")
    @Operation(summary = "전체 기간 리더보드 조회", description = "전체 기간 NFT 수집 상위 사용자 목록을 조회합니다.")
    public ResponseEntity<LeaderboardDto.LeaderboardResponse> getGlobalLeaderboard(
            @Parameter(description = "조회할 순위 수 (기본값: 100)")
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(leaderboardService.getGlobalLeaderboard(limit));
    }

    @GetMapping("/weekly")
    @Operation(summary = "주간 리더보드 조회", description = "최근 7일간 NFT 수집 상위 사용자 목록을 조회합니다.")
    public ResponseEntity<LeaderboardDto.LeaderboardResponse> getWeeklyLeaderboard(
            @Parameter(description = "조회할 순위 수 (기본값: 100)")
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(leaderboardService.getWeeklyLeaderboard(limit));
    }

    @GetMapping("/monthly")
    @Operation(summary = "월간 리더보드 조회", description = "최근 30일간 NFT 수집 상위 사용자 목록을 조회합니다.")
    public ResponseEntity<LeaderboardDto.LeaderboardResponse> getMonthlyLeaderboard(
            @Parameter(description = "조회할 순위 수 (기본값: 100)")
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(leaderboardService.getMonthlyLeaderboard(limit));
    }

    @GetMapping("/my-rank")
    @Operation(summary = "내 순위 조회", description = "현재 로그인한 사용자의 랭킹 정보를 조회합니다.")
    public ResponseEntity<LeaderboardDto.UserRankResponse> getMyRank(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(leaderboardService.getUserRank(userId));
    }

    @GetMapping("/users/{userId}/rank")
    @Operation(summary = "특정 사용자 순위 조회", description = "특정 사용자의 랭킹 정보를 조회합니다.")
    public ResponseEntity<LeaderboardDto.UserRankResponse> getUserRank(
            @Parameter(description = "사용자 ID")
            @PathVariable Long userId) {
        return ResponseEntity.ok(leaderboardService.getUserRank(userId));
    }
}
