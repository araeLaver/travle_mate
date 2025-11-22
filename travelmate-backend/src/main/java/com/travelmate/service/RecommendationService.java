package com.travelmate.service;

import com.travelmate.dto.RecommendationDto;
import com.travelmate.dto.UserDto;
import com.travelmate.dto.UserPreferenceDto;
import com.travelmate.entity.TravelGroup;
import com.travelmate.entity.User;
import com.travelmate.entity.UserGroupMembership;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserGroupMembershipRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserRepository userRepository;
    private final TravelGroupRepository travelGroupRepository;
    private final UserGroupMembershipRepository membershipRepository;

    // 가중치 설정
    private static final double TRAVEL_STYLE_WEIGHT = 0.25;
    private static final double INTEREST_WEIGHT = 0.20;
    private static final double REGION_WEIGHT = 0.15;
    private static final double GROUP_SIZE_WEIGHT = 0.10;
    private static final double BUDGET_WEIGHT = 0.10;
    private static final double POPULARITY_WEIGHT = 0.10;
    private static final double RECENT_ACTIVITY_WEIGHT = 0.05;
    private static final double COLLABORATIVE_WEIGHT = 0.05;

    public List<UserDto.Response> getRecommendedUsers(Long userId) {
        // 현재 사용자 조회
        User currentUser = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (currentUser.getCurrentLatitude() == null || currentUser.getCurrentLongitude() == null) {
            return Collections.emptyList();
        }
        
        // 모든 활성 사용자 중에서 현재 사용자 제외하고 추천
        List<User> allUsers = userRepository.findAll()
            .stream()
            .filter(user -> !user.getId().equals(userId))
            .filter(User::getIsActive)
            .limit(10) // 성능을 위해 제한
            .collect(Collectors.toList());
        
        return allUsers.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public List<UserDto.Response> findNearbyTravelers(Long userId, Integer radiusKm) {
        // 기본 반경을 10km로 설정
        int radius = radiusKm != null ? radiusKm : 10;
        
        User currentUser = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (currentUser.getCurrentLatitude() == null || currentUser.getCurrentLongitude() == null) {
            return Collections.emptyList();
        }
        
        // 간단한 구현으로 모든 사용자를 반환 (실제로는 지리적 쿼리 필요)
        List<User> nearbyUsers = userRepository.findAll()
            .stream()
            .filter(user -> !user.getId().equals(userId))
            .filter(User::getIsActive)
            .filter(User::getIsMatchingEnabled)
            .limit(radius) // 임시로 radius를 개수 제한으로 사용
            .collect(Collectors.toList());
        
        return nearbyUsers.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    private UserDto.Response convertToDto(User user) {
        return UserDto.Response.builder()
            .id(user.getId())
            .email(user.getEmail())
            .nickname(user.getNickname())
            .fullName(user.getFullName())
            .age(user.getAge())
            .gender(user.getGender())
            .profileImageUrl(user.getProfileImageUrl())
            .bio(user.getBio())
            .travelStyle(user.getTravelStyle())
            .interests(user.getInterests())
            .languages(user.getLanguages())
            .rating(user.getRating())
            .reviewCount(user.getReviewCount())
            .isEmailVerified(user.getIsEmailVerified())
            .phoneVerified(user.getPhoneVerified())
            .lastActivityAt(user.getLastActivityAt())
            .createdAt(user.getCreatedAt())
            .build();
    }

    public List<Map<String, Object>> getTravelTips(String destination, String travelStyle) {
        // 간단한 여행 팁 제공 (실제로는 외부 API 연동 필요)
        List<Map<String, Object>> tips = new ArrayList<>();

        if (destination != null && !destination.isEmpty()) {
            tips.add(createTip("교통", destination + "에서는 현지 교통카드를 미리 구매하는 것이 좋습니다."));
            tips.add(createTip("날씨", destination + " 여행 시 날씨를 확인하고 적절한 옷을 준비하세요."));
            tips.add(createTip("음식", destination + "의 유명한 현지 음식을 꼭 체험해보세요."));
        }

        if (travelStyle != null) {
            switch (travelStyle.toUpperCase()) {
                case "BACKPACKER":
                    tips.add(createTip("숙소", "배낭여행객을 위한 저렴한 숙소 정보를 미리 조사하세요."));
                    tips.add(createTip("교통", "현지 대중교통 이용법을 숙지하세요."));
                    break;
                case "LUXURY":
                    tips.add(createTip("숙소", "고급 호텔과 미슐랭 레스토랑 예약을 미리 해두세요."));
                    tips.add(createTip("투어", "프라이빗 투어나 가이드 서비스를 고려해보세요."));
                    break;
                case "CULTURAL":
                    tips.add(createTip("문화", "현지 박물관과 문화유적지의 운영시간을 확인하세요."));
                    tips.add(createTip("에티켓", "현지 문화 예절과 매너를 미리 학습하세요."));
                    break;
                case "ADVENTURE":
                    tips.add(createTip("안전", "모험 활동을 위한 안전 장비를 준비하세요."));
                    tips.add(createTip("보험", "여행자 보험에 모험 활동이 포함되어 있는지 확인하세요."));
                    break;
            }
        }

        if (tips.isEmpty()) {
            tips.add(createTip("준비", "여행 계획을 세우고 필수 물품을 체크리스트로 만들어보세요."));
            tips.add(createTip("안전", "현지 긴급연락처와 대사관 정보를 미리 저장해두세요."));
        }

        return tips;
    }

    private Map<String, Object> createTip(String category, String content) {
        Map<String, Object> tip = new HashMap<>();
        tip.put("category", category);
        tip.put("content", content);
        tip.put("timestamp", new Date());
        return tip;
    }

    public List<Map<String, Object>> getNearbyAttractions(Double latitude, Double longitude, Double radius) {
        // 간단한 근처 관광지 정보 제공 (실제로는 외부 API 연동 필요)
        List<Map<String, Object>> attractions = new ArrayList<>();

        // 샘플 데이터
        attractions.add(createAttraction("남산타워", "서울의 랜드마크", latitude + 0.01, longitude + 0.01, 1.2));
        attractions.add(createAttraction("경복궁", "조선시대 왕궁", latitude - 0.02, longitude + 0.02, 2.5));
        attractions.add(createAttraction("명동", "쇼핑과 맛집의 거리", latitude + 0.015, longitude - 0.01, 1.8));

        // radius 기준으로 필터링
        return attractions.stream()
            .filter(attr -> (Double) attr.get("distance") <= radius)
            .collect(Collectors.toList());
    }

    private Map<String, Object> createAttraction(String name, String description, Double lat, Double lng, Double distance) {
        Map<String, Object> attraction = new HashMap<>();
        attraction.put("name", name);
        attraction.put("description", description);
        attraction.put("latitude", lat);
        attraction.put("longitude", lng);
        attraction.put("distance", distance);
        attraction.put("rating", 4.5);
        return attraction;
    }

    public void processFeedback(Map<String, Object> feedbackData) {
        // 피드백 처리 로직 (실제로는 DB 저장 필요)
        log.info("Processing feedback: {}", feedbackData);

        // 피드백 데이터 검증
        if (feedbackData == null || feedbackData.isEmpty()) {
            throw new IllegalArgumentException("피드백 데이터가 비어있습니다.");
        }

        // 필수 필드 확인
        if (!feedbackData.containsKey("userId") || !feedbackData.containsKey("rating")) {
            throw new IllegalArgumentException("필수 필드가 누락되었습니다.");
        }

        // 피드백 저장 로직 (추후 구현)
        Long userId = Long.valueOf(feedbackData.get("userId").toString());
        Integer rating = Integer.valueOf(feedbackData.get("rating").toString());
        String comment = feedbackData.getOrDefault("comment", "").toString();

        log.info("Feedback received from user {}: rating={}, comment={}", userId, rating, comment);
    }

    // ===== 고급 추천 알고리즘 =====

    /**
     * 사용자에게 그룹 추천
     * 하이브리드 방식: 콘텐츠 기반 + 협업 필터링
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "groupRecommendations", key = "#userId + '_' + #limit")
    public List<RecommendationDto.GroupRecommendation> recommendGroups(Long userId, int limit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 사용자의 선호도 추출
        UserPreferenceDto userPreference = extractUserPreferences(user);

        // 모든 활성 그룹 조회 (사용자가 이미 가입한 그룹 제외)
        List<TravelGroup> allGroups = travelGroupRepository.findAll();
        Set<Long> joinedGroupIds = membershipRepository.findByUserId(userId).stream()
                .map(m -> m.getTravelGroup().getId())
                .collect(Collectors.toSet());

        List<RecommendationDto.GroupRecommendation> recommendations = allGroups.stream()
                .filter(group -> !joinedGroupIds.contains(group.getId()))
                .filter(group -> group.getCurrentMembers() < group.getMaxMembers())
                .map(group -> {
                    // 콘텐츠 기반 점수 계산
                    RecommendationDto.ScoreBreakdown breakdown = calculateContentBasedScore(userPreference, group);

                    // 협업 필터링 점수 계산
                    double collaborativeScore = calculateCollaborativeScore(userId, group);
                    breakdown.setCollaborativeScore(collaborativeScore);

                    // 최종 점수 계산
                    double finalScore = calculateFinalScore(breakdown);

                    // 추천 이유 생성
                    List<String> reasons = generateGroupReasons(breakdown, userPreference, group);

                    return RecommendationDto.GroupRecommendation.builder()
                            .groupId(group.getId())
                            .groupName(group.getTitle())
                            .destination(group.getDestination())
                            .description(group.getDescription())
                            .currentMembers(group.getCurrentMembers())
                            .maxMembers(group.getMaxMembers())
                            .travelStyle(group.getTravelStyle() != null ? group.getTravelStyle().name() : null)
                            .tags(parseGroupTags(group))
                            .recommendationScore(finalScore)
                            .reasons(reasons)
                            .scoreBreakdown(breakdown)
                            .build();
                })
                .sorted((r1, r2) -> Double.compare(r2.getRecommendationScore(), r1.getRecommendationScore()))
                .limit(limit)
                .collect(Collectors.toList());

        log.info("Generated {} group recommendations for user {}", recommendations.size(), userId);
        return recommendations;
    }

    /**
     * 사용자에게 동행자 추천 (고급 버전)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "userRecommendations", key = "#userId + '_' + #limit")
    public List<RecommendationDto.UserRecommendation> recommendTravelMates(Long userId, int limit) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserPreferenceDto currentUserPref = extractUserPreferences(currentUser);

        List<User> allUsers = userRepository.findAll();

        List<RecommendationDto.UserRecommendation> recommendations = allUsers.stream()
                .filter(user -> !user.getId().equals(userId))
                .filter(User::getIsActive)
                .map(user -> {
                    UserPreferenceDto otherUserPref = extractUserPreferences(user);

                    // 사용자 유사도 계산
                    double similarityScore = calculateUserSimilarity(currentUserPref, otherUserPref);

                    // 공통 관심사 찾기
                    List<String> commonInterests = findCommonInterests(currentUserPref, otherUserPref);

                    // 추천 이유 생성
                    List<String> reasons = generateUserRecommendationReasons(
                            currentUserPref, otherUserPref, commonInterests, similarityScore);

                    return RecommendationDto.UserRecommendation.builder()
                            .userId(user.getId())
                            .nickname(user.getNickname())
                            .profileImage(user.getProfileImageUrl())
                            .travelStyles(otherUserPref.getTravelStyles())
                            .interests(otherUserPref.getInterests())
                            .ageGroup(otherUserPref.getAgeGroup() != null ? otherUserPref.getAgeGroup() + "대" : null)
                            .recommendationScore(similarityScore * 100)
                            .reasons(reasons)
                            .commonInterests(commonInterests)
                            .similarityScore(similarityScore)
                            .build();
                })
                .filter(rec -> rec.getRecommendationScore() > 30) // 최소 30점 이상만
                .sorted((a, b) -> Double.compare(b.getRecommendationScore(), a.getRecommendationScore()))
                .limit(limit)
                .collect(Collectors.toList());

        log.info("Generated {} user recommendations for user {}", recommendations.size(), userId);
        return recommendations;
    }

    /**
     * 콘텐츠 기반 점수 계산
     */
    private RecommendationDto.ScoreBreakdown calculateContentBasedScore(
            UserPreferenceDto userPref, TravelGroup group) {

        // 여행 스타일 유사도
        String groupTravelStyle = group.getTravelStyle() != null ? group.getTravelStyle().name() : null;
        double travelStyleScore = calculateTravelStyleSimilarity(userPref.getTravelStyles(), groupTravelStyle);

        // 관심사 유사도
        double interestScore = calculateInterestSimilarity(userPref.getInterests(), parseGroupTags(group));

        // 지역 선호도
        double regionScore = calculateRegionSimilarity(userPref.getPreferredRegions(), group.getDestination());

        // 그룹 크기 적합도
        double groupSizeScore = calculateGroupSizeFit(
                userPref.getPreferredGroupSizeMin(),
                userPref.getPreferredGroupSizeMax(),
                group.getMaxMembers());

        // 예산 범위
        double budgetScore = 0.5;

        // 인기도 (멤버 수 기반)
        double popularityScore = (double) group.getCurrentMembers() / group.getMaxMembers();

        // 최근 활동 점수
        double recentActivityScore = calculateRecentActivityScore(group);

        return RecommendationDto.ScoreBreakdown.builder()
                .travelStyleScore(travelStyleScore)
                .interestScore(interestScore)
                .regionScore(regionScore)
                .groupSizeScore(groupSizeScore)
                .budgetScore(budgetScore)
                .popularityScore(popularityScore)
                .recentActivityScore(recentActivityScore)
                .collaborativeScore(0.0)
                .build();
    }

    /**
     * 협업 필터링 점수 계산
     */
    private double calculateCollaborativeScore(Long userId, TravelGroup group) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return 0.0;

            UserPreferenceDto currentUserPref = extractUserPreferences(user);

            // 해당 그룹의 멤버들 조회
            List<UserGroupMembership> groupMembers = membershipRepository.findByTravelGroupId(group.getId());

            if (groupMembers.isEmpty()) return 0.0;

            // 그룹 멤버들과 현재 사용자의 유사도 평균 계산
            double totalSimilarity = 0.0;
            int count = 0;

            for (UserGroupMembership membership : groupMembers) {
                User member = membership.getUser();
                if (!member.getId().equals(userId)) {
                    UserPreferenceDto memberPref = extractUserPreferences(member);
                    double similarity = calculateUserSimilarity(currentUserPref, memberPref);
                    totalSimilarity += similarity;
                    count++;
                }
            }

            return count > 0 ? totalSimilarity / count : 0.0;
        } catch (Exception e) {
            log.error("Error calculating collaborative score", e);
            return 0.0;
        }
    }

    /**
     * 최종 점수 계산 (가중 평균)
     */
    private double calculateFinalScore(RecommendationDto.ScoreBreakdown breakdown) {
        return (breakdown.getTravelStyleScore() * TRAVEL_STYLE_WEIGHT +
                breakdown.getInterestScore() * INTEREST_WEIGHT +
                breakdown.getRegionScore() * REGION_WEIGHT +
                breakdown.getGroupSizeScore() * GROUP_SIZE_WEIGHT +
                breakdown.getBudgetScore() * BUDGET_WEIGHT +
                breakdown.getPopularityScore() * POPULARITY_WEIGHT +
                breakdown.getRecentActivityScore() * RECENT_ACTIVITY_WEIGHT +
                breakdown.getCollaborativeScore() * COLLABORATIVE_WEIGHT) * 100;
    }

    /**
     * 여행 스타일 유사도 계산
     */
    private double calculateTravelStyleSimilarity(List<String> userStyles, String groupStyle) {
        if (userStyles == null || userStyles.isEmpty() || groupStyle == null) {
            return 0.5;
        }
        return userStyles.contains(groupStyle) ? 1.0 : 0.3;
    }

    /**
     * 관심사 유사도 계산 (Jaccard Similarity)
     */
    private double calculateInterestSimilarity(List<String> userInterests, List<String> groupTags) {
        if (userInterests == null || groupTags == null || userInterests.isEmpty() || groupTags.isEmpty()) {
            return 0.5;
        }

        Set<String> set1 = new HashSet<>(userInterests);
        Set<String> set2 = new HashSet<>(groupTags);

        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    /**
     * 지역 유사도 계산
     */
    private double calculateRegionSimilarity(List<String> preferredRegions, String destination) {
        if (preferredRegions == null || preferredRegions.isEmpty() || destination == null) {
            return 0.5;
        }

        for (String region : preferredRegions) {
            if (destination.toUpperCase().contains(region.toUpperCase())) {
                return 1.0;
            }
        }
        return 0.3;
    }

    /**
     * 그룹 크기 적합도 계산
     */
    private double calculateGroupSizeFit(Integer prefMin, Integer prefMax, Integer groupMax) {
        if (prefMin == null || prefMax == null || groupMax == null) {
            return 0.5;
        }

        if (groupMax >= prefMin && groupMax <= prefMax) {
            return 1.0;
        } else if (groupMax < prefMin) {
            double diff = prefMin - groupMax;
            return Math.max(0, 1.0 - (diff / 10.0));
        } else {
            double diff = groupMax - prefMax;
            return Math.max(0, 1.0 - (diff / 10.0));
        }
    }

    /**
     * 최근 활동 점수 계산
     */
    private double calculateRecentActivityScore(TravelGroup group) {
        if (group.getCreatedAt() == null) return 0.5;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime createdAt = group.getCreatedAt();
        long daysSinceCreation = java.time.Duration.between(createdAt, now).toDays();

        if (daysSinceCreation <= 7) return 1.0;
        if (daysSinceCreation <= 30) return 0.8;
        if (daysSinceCreation <= 90) return 0.5;
        return 0.3;
    }

    /**
     * 사용자 간 유사도 계산
     */
    private double calculateUserSimilarity(UserPreferenceDto user1, UserPreferenceDto user2) {
        double styleScore = calculateInterestSimilarity(user1.getTravelStyles(), user2.getTravelStyles());
        double interestScore = calculateInterestSimilarity(user1.getInterests(), user2.getInterests());
        double regionScore = calculateInterestSimilarity(user1.getPreferredRegions(), user2.getPreferredRegions());

        double ageScore = 0.5;
        if (user1.getAgeGroup() != null && user2.getAgeGroup() != null) {
            int ageDiff = Math.abs(user1.getAgeGroup() - user2.getAgeGroup());
            ageScore = ageDiff == 0 ? 1.0 : (ageDiff <= 10 ? 0.7 : 0.3);
        }

        return (styleScore * 0.3 + interestScore * 0.4 + regionScore * 0.2 + ageScore * 0.1);
    }

    /**
     * 공통 관심사 찾기
     */
    private List<String> findCommonInterests(UserPreferenceDto user1, UserPreferenceDto user2) {
        if (user1.getInterests() == null || user2.getInterests() == null) {
            return new ArrayList<>();
        }

        Set<String> interests1 = new HashSet<>(user1.getInterests());
        Set<String> interests2 = new HashSet<>(user2.getInterests());
        interests1.retainAll(interests2);

        return new ArrayList<>(interests1);
    }

    /**
     * 그룹 추천 이유 생성
     */
    private List<String> generateGroupReasons(
            RecommendationDto.ScoreBreakdown breakdown,
            UserPreferenceDto userPref,
            TravelGroup group) {

        List<String> reasons = new ArrayList<>();

        if (breakdown.getTravelStyleScore() > 0.7) {
            reasons.add("회원님의 여행 스타일과 일치합니다");
        }

        if (breakdown.getInterestScore() > 0.5) {
            reasons.add("공통 관심사가 많습니다");
        }

        if (breakdown.getPopularityScore() > 0.6) {
            reasons.add("인기있는 그룹입니다");
        }

        if (breakdown.getRecentActivityScore() > 0.8) {
            reasons.add("최근 생성된 활발한 그룹입니다");
        }

        if (breakdown.getCollaborativeScore() > 0.6) {
            reasons.add("비슷한 성향의 사용자들이 참여하고 있습니다");
        }

        if (reasons.isEmpty()) {
            reasons.add("새로운 여행 경험을 찾고 계신가요?");
        }

        return reasons;
    }

    /**
     * 사용자 추천 이유 생성
     */
    private List<String> generateUserRecommendationReasons(
            UserPreferenceDto currentUser,
            UserPreferenceDto otherUser,
            List<String> commonInterests,
            double similarityScore) {

        List<String> reasons = new ArrayList<>();

        if (!commonInterests.isEmpty()) {
            reasons.add("공통 관심사: " + String.join(", ", commonInterests));
        }

        if (currentUser.getTravelStyles() != null && otherUser.getTravelStyles() != null) {
            Set<String> commonStyles = new HashSet<>(currentUser.getTravelStyles());
            commonStyles.retainAll(otherUser.getTravelStyles());
            if (!commonStyles.isEmpty()) {
                reasons.add("비슷한 여행 스타일을 선호합니다");
            }
        }

        if (currentUser.getAgeGroup() != null && otherUser.getAgeGroup() != null) {
            int ageDiff = Math.abs(currentUser.getAgeGroup() - otherUser.getAgeGroup());
            if (ageDiff <= 10) {
                reasons.add("비슷한 연령대입니다");
            }
        }

        if (similarityScore > 0.7) {
            reasons.add("매우 높은 유사도를 보입니다");
        }

        return reasons;
    }

    /**
     * 사용자 선호도 추출
     */
    private UserPreferenceDto extractUserPreferences(User user) {
        // User 엔티티에서 선호도 정보 추출
        List<String> travelStyles = new ArrayList<>();
        if (user.getTravelStyle() != null) {
            travelStyles.add(user.getTravelStyle().name());
        } else {
            travelStyles.addAll(Arrays.asList("CULTURAL", "ADVENTURE"));
        }

        List<String> interests = user.getInterests() != null && !user.getInterests().isEmpty()
                ? new ArrayList<>(user.getInterests())
                : Arrays.asList("FOOD", "HISTORY", "PHOTOGRAPHY");

        List<String> languages = user.getLanguages() != null && !user.getLanguages().isEmpty()
                ? new ArrayList<>(user.getLanguages())
                : Arrays.asList("KOREAN", "ENGLISH");

        return UserPreferenceDto.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .travelStyles(travelStyles)
                .preferredRegions(Arrays.asList("ASIA", "EUROPE"))
                .interests(interests)
                .travelFrequency("OCCASIONAL")
                .preferredGroupSizeMin(3)
                .preferredGroupSizeMax(8)
                .ageGroup(user.getAge() != null ? (user.getAge() / 10) * 10 : 30)
                .gender(user.getGender() != null ? user.getGender().name() : "ANY")
                .languages(languages)
                .budgetRange("MEDIUM")
                .build();
    }

    /**
     * 그룹 태그 파싱
     */
    private List<String> parseGroupTags(TravelGroup group) {
        // 그룹의 description, travelStyle 등에서 태그 추출
        List<String> tags = new ArrayList<>();

        if (group.getTravelStyle() != null) {
            tags.add(group.getTravelStyle().name());
        }

        // description에서 키워드 추출 (간단한 버전)
        if (group.getDescription() != null) {
            String desc = group.getDescription().toUpperCase();
            if (desc.contains("음식") || desc.contains("FOOD")) tags.add("FOOD");
            if (desc.contains("문화") || desc.contains("CULTURE")) tags.add("CULTURE");
            if (desc.contains("모험") || desc.contains("ADVENTURE")) tags.add("ADVENTURE");
            if (desc.contains("자연") || desc.contains("NATURE")) tags.add("NATURE");
            if (desc.contains("쇼핑") || desc.contains("SHOPPING")) tags.add("SHOPPING");
        }

        return tags;
    }
}