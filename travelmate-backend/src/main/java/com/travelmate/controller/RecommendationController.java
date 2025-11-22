package com.travelmate.controller;

import com.travelmate.dto.RecommendationDto;
import com.travelmate.dto.UserDto;
import com.travelmate.service.LocationService;
import com.travelmate.service.RecommendationService;
import com.travelmate.service.AdvancedRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {
    
    private final RecommendationService recommendationService;
    private final LocationService locationService;
    private final AdvancedRecommendationService advancedRecommendationService;
    
    @GetMapping("/users")
    public ResponseEntity<List<UserDto.Response>> getRecommendedUsers(
            @AuthenticationPrincipal String userId,
            @RequestParam Double latitude,
            @RequestParam Double longitude) {
        Long userIdLong = Long.parseLong(userId);
        List<UserDto.Response> recommendations = locationService.getSmartRecommendations(userIdLong, latitude, longitude);
        return ResponseEntity.ok(recommendations);
    }
    
    @GetMapping("/personalized")
    public ResponseEntity<List<UserDto.Response>> getPersonalizedRecommendations(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        List<UserDto.Response> recommendations = advancedRecommendationService
            .getPersonalizedRecommendations(userIdLong);
        return ResponseEntity.ok(recommendations);
    }
    
    @GetMapping("/activity")
    public ResponseEntity<List<UserDto.Response>> getActivityBasedRecommendations(
            @AuthenticationPrincipal String userId,
            @RequestParam String activity) {
        Long userIdLong = Long.parseLong(userId);
        List<UserDto.Response> recommendations = advancedRecommendationService
            .getActivityBasedRecommendations(userIdLong, activity);
        return ResponseEntity.ok(recommendations);
    }
    
    @PostMapping("/intelligent-matching")
    public ResponseEntity<Void> performIntelligentMatching(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        advancedRecommendationService.performIntelligentMatching(userIdLong);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/travel-tips")
    public ResponseEntity<List<Map<String, Object>>> getTravelTips(
            @RequestParam String location,
            @RequestParam(required = false) String category) {
        List<Map<String, Object>> tips = recommendationService.getTravelTips(location, category);
        return ResponseEntity.ok(tips);
    }
    
    @GetMapping("/nearby-attractions")
    public ResponseEntity<List<Map<String, Object>>> getNearbyAttractions(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5.0") Double radiusKm) {
        List<Map<String, Object>> attractions = recommendationService.getNearbyAttractions(latitude, longitude, radiusKm);
        return ResponseEntity.ok(attractions);
    }
    
    @PostMapping("/feedback")
    public ResponseEntity<Void> submitFeedback(
            @RequestBody Map<String, Object> feedback) {
        recommendationService.processFeedback(feedback);
        return ResponseEntity.ok().build();
    }

    // ===== 고급 추천 알고리즘 API =====

    /**
     * 그룹 추천 (하이브리드 방식: 콘텐츠 기반 + 협업 필터링)
     * GET /api/recommendations/groups?limit=10
     */
    @GetMapping("/groups")
    public ResponseEntity<List<RecommendationDto.GroupRecommendation>> getGroupRecommendations(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "10") int limit) {

        List<RecommendationDto.GroupRecommendation> recommendations =
                recommendationService.recommendGroups(Long.parseLong(userId), limit);

        return ResponseEntity.ok(recommendations);
    }

    /**
     * 동행자 추천 (고급 유사도 분석)
     * GET /api/recommendations/travel-mates?limit=10
     */
    @GetMapping("/travel-mates")
    public ResponseEntity<List<RecommendationDto.UserRecommendation>> getTravelMateRecommendations(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "10") int limit) {

        List<RecommendationDto.UserRecommendation> recommendations =
                recommendationService.recommendTravelMates(Long.parseLong(userId), limit);

        return ResponseEntity.ok(recommendations);
    }
}