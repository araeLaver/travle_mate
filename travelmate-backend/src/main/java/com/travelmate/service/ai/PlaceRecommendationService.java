package com.travelmate.service.ai;

import com.travelmate.dto.AIRecommendationDto.*;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AI 기반 장소 추천 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceRecommendationService {

    private final UserRepository userRepository;
    private final CollectibleLocationRepository locationRepository;
    private final UserNftCollectionRepository collectionRepository;

    private static final Map<String, Double> CATEGORY_WEIGHTS = Map.of(
        "LANDMARK", 1.2,
        "MUSEUM", 1.1,
        "RESTAURANT", 1.0,
        "NATURE", 1.15,
        "SHOPPING", 0.9,
        "ENTERTAINMENT", 1.0
    );

    /**
     * AI 기반 장소 추천
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "aiPlaceRecommendations", key = "#userId + '_' + #request.latitude + '_' + #request.longitude")
    public List<PlaceRecommendation> getAIPlaceRecommendations(Long userId, PlaceRecommendationRequest request) {
        log.info("Getting AI place recommendations for user {} at ({}, {})",
                userId, request.getLatitude(), request.getLongitude());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<Long> visitedLocationIds = collectionRepository.findCollectedLocationIdsByUserId(userId);

        Double radiusKm = request.getRadiusKm() != null ? request.getRadiusKm() : 5.0;
        List<CollectibleLocation> nearbyLocations = locationRepository.findNearbyActiveLocations(
                request.getLatitude(), request.getLongitude(), radiusKm);

        List<CollectibleLocation> unvisitedLocations = nearbyLocations.stream()
                .filter(loc -> !visitedLocationIds.contains(loc.getId()))
                .collect(Collectors.toList());

        return unvisitedLocations.stream()
                .map(location -> calculatePlaceRecommendation(user, location, request))
                .sorted((a, b) -> Double.compare(b.getAiScore(), a.getAiScore()))
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * 장소 추천 점수 계산
     */
    public PlaceRecommendation calculatePlaceRecommendation(User user, CollectibleLocation location, PlaceRecommendationRequest request) {
        double baseScore = 50.0;

        String category = location.getCategory() != null ? location.getCategory().name() : "OTHER";
        double categoryWeight = CATEGORY_WEIGHTS.getOrDefault(category, 1.0);
        baseScore *= categoryWeight;

        if (location.getRarity() != null) {
            baseScore += switch (location.getRarity()) {
                case LEGENDARY -> 30;
                case EPIC -> 20;
                case RARE -> 10;
                default -> 0;
            };
        }

        if (location.getAverageRating() != null && location.getAverageRating() > 0) {
            baseScore += location.getAverageRating() * 5;
        }

        double distance = calculateDistance(
                request.getLatitude(), request.getLongitude(),
                location.getLatitude(), location.getLongitude());
        baseScore -= Math.min(20, distance * 2);

        List<String> reasons = generatePlaceReasons(location, user);

        return PlaceRecommendation.builder()
                .placeId(location.getId())
                .name(location.getName())
                .description(location.getDescription())
                .category(category)
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .distance(distance)
                .rating(location.getAverageRating())
                .reviewCount(location.getReviewCount())
                .imageUrl(location.getImageUrl())
                .aiScore(Math.min(100, Math.max(0, baseScore)))
                .reasons(reasons)
                .bestTimeToVisit(determineBestTime(location))
                .estimatedDuration(estimateDuration(location))
                .build();
    }

    private List<String> generatePlaceReasons(CollectibleLocation location, User user) {
        List<String> reasons = new ArrayList<>();

        if (location.getRarity() != null) {
            switch (location.getRarity()) {
                case LEGENDARY -> reasons.add("희귀한 전설적 장소입니다!");
                case EPIC -> reasons.add("에픽 등급의 특별한 장소입니다");
                case RARE -> reasons.add("레어한 장소입니다");
            }
        }

        if (location.getAverageRating() != null && location.getAverageRating() >= 4.5) {
            reasons.add("방문자들의 평점이 매우 높습니다");
        }

        if (user.getTravelStyle() != null) {
            String style = user.getTravelStyle().name();
            String category = location.getCategory() != null ? location.getCategory().name() : "";

            if ((style.equals("CULTURE") && (category.contains("MUSEUM") || category.contains("LANDMARK"))) ||
                (style.equals("NATURE") && category.contains("NATURE")) ||
                (style.equals("FOOD") && category.contains("RESTAURANT"))) {
                reasons.add("회원님의 여행 스타일과 잘 맞습니다");
            }
        }

        if (reasons.isEmpty()) {
            reasons.add("근처의 추천 장소입니다");
        }

        return reasons;
    }

    private String determineBestTime(CollectibleLocation location) {
        String category = location.getCategory() != null ? location.getCategory().name() : "";
        return switch (category) {
            case "RESTAURANT" -> "점심 또는 저녁 시간";
            case "MUSEUM" -> "오전 10시 이후";
            case "NATURE" -> "이른 아침 또는 석양 무렵";
            case "LANDMARK" -> "오전 또는 야경 시간";
            default -> "언제든지";
        };
    }

    private String estimateDuration(CollectibleLocation location) {
        String category = location.getCategory() != null ? location.getCategory().name() : "";
        return switch (category) {
            case "RESTAURANT" -> "1-2시간";
            case "MUSEUM" -> "2-3시간";
            case "NATURE" -> "3-4시간";
            case "LANDMARK" -> "1-2시간";
            case "SHOPPING" -> "2-3시간";
            default -> "1-2시간";
        };
    }

    public double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return 999;
        }

        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
