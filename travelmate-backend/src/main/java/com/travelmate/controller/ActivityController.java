package com.travelmate.controller;

import com.travelmate.dto.ActivityDto;
import com.travelmate.entity.Activity;
import com.travelmate.security.CurrentUser;
import com.travelmate.security.UserPrincipal;
import com.travelmate.service.ActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@Tag(name = "Activities", description = "활동 피드 API")
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/timeline")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "내 타임라인 조회", description = "팔로잉 사용자들과 본인의 활동을 시간순으로 조회합니다.")
    public ResponseEntity<ActivityDto.TimelineResponse> getMyTimeline(
            @CurrentUser UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        ActivityDto.TimelineResponse response = activityService.getMyTimeline(
                userPrincipal.getId(), pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/explore")
    @Operation(summary = "탐색 피드 조회", description = "전체 공개 활동 피드를 조회합니다.")
    public ResponseEntity<ActivityDto.FeedResponse> getExploreFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        ActivityDto.FeedResponse response = activityService.getExploreFeed(pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "사용자 활동 조회", description = "특정 사용자의 활동 목록을 조회합니다.")
    public ResponseEntity<ActivityDto.FeedResponse> getUserActivities(
            @CurrentUser @Parameter(hidden = true) UserPrincipal userPrincipal,
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long viewerId = userPrincipal != null ? userPrincipal.getId() : null;
        Pageable pageable = PageRequest.of(page, size);
        ActivityDto.FeedResponse response = activityService.getUserActivities(
                userId, viewerId, pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}/stats")
    @Operation(summary = "사용자 활동 통계 조회", description = "특정 사용자의 활동 통계를 조회합니다.")
    public ResponseEntity<ActivityDto.StatsResponse> getUserActivityStats(
            @PathVariable Long userId) {

        ActivityDto.StatsResponse response = activityService.getUserActivityStats(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "타입별 활동 조회", description = "특정 활동 타입의 피드를 조회합니다.")
    public ResponseEntity<ActivityDto.FeedResponse> getActivitiesByType(
            @PathVariable Activity.ActivityType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        ActivityDto.FeedResponse response = activityService.getActivitiesByType(type, pageable);

        return ResponseEntity.ok(response);
    }
}
