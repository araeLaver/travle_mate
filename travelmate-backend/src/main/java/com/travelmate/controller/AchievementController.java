package com.travelmate.controller;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.nft.AchievementType;
import com.travelmate.service.nft.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${app.cors.allowed-origins:http://localhost:3000}"})
public class AchievementController {

    private final AchievementService achievementService;

    /**
     * 전체 업적 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<NftDto.AchievementResponse>> getAllAchievements(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        List<NftDto.AchievementResponse> achievements = achievementService.getAllAchievements(userIdLong);
        return ResponseEntity.ok(achievements);
    }

    /**
     * 타입별 업적 조회
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<NftDto.AchievementResponse>> getAchievementsByType(
            @AuthenticationPrincipal String userId,
            @PathVariable AchievementType type) {
        Long userIdLong = Long.parseLong(userId);
        List<NftDto.AchievementResponse> achievements = achievementService.getAchievementsByType(userIdLong, type);
        return ResponseEntity.ok(achievements);
    }

    /**
     * 내 업적 현황 조회
     */
    @GetMapping("/my")
    public ResponseEntity<List<NftDto.AchievementResponse>> getMyAchievements(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        List<NftDto.AchievementResponse> achievements = achievementService.getMyAchievements(userIdLong);
        return ResponseEntity.ok(achievements);
    }

    /**
     * 완료된 업적만 조회
     */
    @GetMapping("/my/completed")
    public ResponseEntity<List<NftDto.AchievementResponse>> getCompletedAchievements(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        List<NftDto.AchievementResponse> achievements = achievementService.getCompletedAchievements(userIdLong);
        return ResponseEntity.ok(achievements);
    }

    /**
     * 업적 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<NftDto.AchievementStatsResponse> getAchievementStats(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.AchievementStatsResponse stats = achievementService.getAchievementStats(userIdLong);
        return ResponseEntity.ok(stats);
    }
}
