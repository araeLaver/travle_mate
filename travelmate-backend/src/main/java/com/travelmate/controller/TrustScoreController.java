package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.entity.UserTrustScore;
import com.travelmate.service.TrustScoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/safety/trust-score")
@RequiredArgsConstructor
@Tag(name = "Safety", description = "안전 관련 API")
public class TrustScoreController {

    private final TrustScoreService trustScoreService;

    @GetMapping
    @Operation(summary = "내 신뢰 점수 조회", description = "내 신뢰 점수와 등급을 조회합니다.")
    public ResponseEntity<TrustScoreResponse> getMyTrustScore(
            @AuthenticationPrincipal String userId) {
        UserTrustScore score = trustScoreService.getTrustScore(AuthenticatedUserId.parse(userId));
        return ResponseEntity.ok(TrustScoreResponse.from(score));
    }

    @GetMapping("/{targetUserId}")
    @Operation(summary = "사용자 신뢰 점수 조회", description = "특정 사용자의 신뢰 점수를 조회합니다.")
    public ResponseEntity<TrustScoreResponse> getUserTrustScore(
            @PathVariable Long targetUserId) {
        UserTrustScore score = trustScoreService.getTrustScore(targetUserId);
        return ResponseEntity.ok(TrustScoreResponse.from(score));
    }

    @PostMapping("/recalculate")
    @Operation(summary = "신뢰 점수 재계산", description = "내 신뢰 점수를 재계산합니다.")
    public ResponseEntity<TrustScoreResponse> recalculate(
            @AuthenticationPrincipal String userId) {
        UserTrustScore score = trustScoreService.recalculate(AuthenticatedUserId.parse(userId));
        return ResponseEntity.ok(TrustScoreResponse.from(score));
    }

    @Data
    public static class TrustScoreResponse {
        private Integer totalScore;
        private Integer baseScore;
        private Integer reviewScore;
        private Integer activityScore;
        private String trustBadge;
        private String badgeDescription;

        public static TrustScoreResponse from(UserTrustScore score) {
            TrustScoreResponse r = new TrustScoreResponse();
            r.totalScore = score.getTotalScore();
            r.baseScore = score.getBaseScore();
            r.reviewScore = score.getReviewScore();
            r.activityScore = score.getActivityScore();
            r.trustBadge = score.getTrustBadge().name();
            r.badgeDescription = score.getTrustBadge().getDescription();
            return r;
        }
    }
}
