package com.travelmate.controller;

import com.travelmate.dto.AIRecommendationDto;
import com.travelmate.dto.AIRecommendationDto.*;
import com.travelmate.service.AIRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 추천 시스템 컨트롤러
 */
@Tag(name = "AI Recommendation", description = "AI 기반 추천 시스템 API")
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
public class AIRecommendationController {

    private final AIRecommendationService aiService;

    /**
     * AI 여행 일정 생성
     */
    @Operation(summary = "AI 여행 일정 생성", description = "목적지, 기간, 여행 스타일에 맞는 AI 생성 일정")
    @PostMapping("/itinerary")
    public ResponseEntity<ItineraryResponse> generateItinerary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ItineraryRequest request) {

        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("AI itinerary request from user {} for {}", userId, request.getDestination());

        ItineraryResponse response = aiService.generateItinerary(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * AI 장소 추천
     */
    @Operation(summary = "AI 장소 추천", description = "현재 위치 기반 AI 장소 추천")
    @PostMapping("/places")
    public ResponseEntity<List<PlaceRecommendation>> getPlaceRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PlaceRecommendationRequest request) {

        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("AI place recommendation request from user {} at ({}, {})",
                userId, request.getLatitude(), request.getLongitude());

        List<PlaceRecommendation> recommendations = aiService.getAIPlaceRecommendations(userId, request);
        return ResponseEntity.ok(recommendations);
    }

    /**
     * 개인화 추천
     */
    @Operation(summary = "개인화 추천", description = "사용자 히스토리 기반 개인화 추천")
    @PostMapping("/personalized")
    public ResponseEntity<PersonalizedResponse> getPersonalizedRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PersonalizedRequest request) {

        Long userId = Long.parseLong(userDetails.getUsername());
        request.setUserId(userId);

        log.info("Personalized recommendation request from user {}", userId);

        PersonalizedResponse response = aiService.getPersonalizedRecommendations(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 분석
     */
    @Operation(summary = "사용자 여행 분석", description = "사용자의 여행 패턴 및 성향 분석")
    @GetMapping("/analysis")
    public ResponseEntity<UserAnalysis> getUserAnalysis(
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("User analysis request for user {}", userId);

        UserAnalysis analysis = aiService.analyzeUser(userId);
        return ResponseEntity.ok(analysis);
    }

    /**
     * AI 여행 팁
     */
    @Operation(summary = "AI 여행 팁", description = "목적지 및 여행 스타일에 맞는 여행 팁")
    @PostMapping("/tips")
    public ResponseEntity<List<TravelTip>> getTravelTips(
            @RequestBody TravelTipsRequest request) {

        log.info("Travel tips request for {}", request.getDestination());

        List<TravelTip> tips = aiService.generateTravelTips(request);
        return ResponseEntity.ok(tips);
    }

    /**
     * AI 채팅 (여행 어시스턴트)
     */
    @Operation(summary = "AI 여행 어시스턴트", description = "AI와 대화하며 여행 정보 얻기")
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatRequest request) {

        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("AI chat from user {}: {}", userId, request.getMessage());

        ChatResponse response = aiService.chat(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 빠른 추천 (위치 기반)
     */
    @Operation(summary = "빠른 추천", description = "현재 위치에서 빠르게 장소 추천받기")
    @GetMapping("/quick")
    public ResponseEntity<List<PlaceRecommendation>> getQuickRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5") Double radiusKm) {

        Long userId = Long.parseLong(userDetails.getUsername());

        PlaceRecommendationRequest request = PlaceRecommendationRequest.builder()
                .latitude(latitude)
                .longitude(longitude)
                .radiusKm(radiusKm)
                .build();

        List<PlaceRecommendation> recommendations = aiService.getAIPlaceRecommendations(userId, request);
        return ResponseEntity.ok(recommendations);
    }
}
