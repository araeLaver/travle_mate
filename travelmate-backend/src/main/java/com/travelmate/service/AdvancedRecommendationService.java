package com.travelmate.service;

import com.travelmate.dto.UserDto;
import com.travelmate.entity.User;
import com.travelmate.entity.TravelGroup;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserReviewRepository;
import com.travelmate.util.GeoUtils;
import com.travelmate.util.TravelStyleMatcher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AdvancedRecommendationService {
    
    private final UserRepository userRepository;
    private final TravelGroupRepository travelGroupRepository;
    private final UserReviewRepository userReviewRepository;
    private final NotificationService notificationService;
    
    /**
     * 고급 사용자 추천 시스템
     */
    public List<UserDto.Response> getPersonalizedRecommendations(Long userId) {
        User currentUser = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.userNotFound(userId));
        
        if (currentUser.getCurrentLatitude() == null || currentUser.getCurrentLongitude() == null) {
            return Collections.emptyList();
        }
        
        // 1. 기본 위치 기반 필터링 (10km 반경)
        List<User> candidates = userRepository.findNearbyUsers(
            userId, 
            currentUser.getCurrentLatitude(), 
            currentUser.getCurrentLongitude(), 
            10.0
        );
        
        // 2. 다중 요인 점수 계산 및 정렬
        List<UserScore> scoredUsers = candidates.stream()
            .map(user -> calculateCompatibilityScore(currentUser, user))
            .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
            .limit(10)
            .collect(Collectors.toList());
        
        log.info("개인화 추천: 사용자 {} - {}명 추천", userId, scoredUsers.size());
        
        return scoredUsers.stream()
            .map(userScore -> convertToDto(userScore.getUser()))
            .collect(Collectors.toList());
    }
    
    /**
     * 실시간 활동 기반 추천
     */
    public List<UserDto.Response> getActivityBasedRecommendations(Long userId, String currentActivity) {
        User currentUser = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.userNotFound(userId));
        
        // 같은 활동을 하고 있는 근처 사용자들 찾기
        List<User> nearbyUsers = userRepository.findNearbyUsers(
            userId,
            currentUser.getCurrentLatitude(),
            currentUser.getCurrentLongitude(),
            2.0  // 2km 반경
        );
        
        // 활동별 매칭 로직
        List<User> activityMatches = nearbyUsers.stream()
            .filter(user -> isActivityCompatible(currentActivity, user))
            .limit(5)
            .collect(Collectors.toList());
        
        log.info("활동 기반 추천: {} - {}명 매칭", currentActivity, activityMatches.size());
        
        return activityMatches.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    /**
     * 지능형 매칭 알고리즘
     */
    public void performIntelligentMatching(Long userId) {
        User currentUser = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.userNotFound(userId));
        
        // 1. 즉시 매칭 가능한 사용자들
        List<User> immediateMatches = findImmediateMatches(currentUser);
        
        // 2. 잠재적 매칭 사용자들
        List<User> potentialMatches = findPotentialMatches(currentUser);
        
        // 3. 매칭 알림 발송
        if (!immediateMatches.isEmpty()) {
            for (User match : immediateMatches) {
                notificationService.sendMatchingNotification(
                    userId, match.getId(), match.getNickname()
                );
                notificationService.sendMatchingNotification(
                    match.getId(), userId, currentUser.getNickname()
                );
            }
            log.info("즉시 매칭 완료: 사용자 {} - {}명", userId, immediateMatches.size());
        }
        
        // 4. 잠재적 매칭에 대한 추천 알림
        if (!potentialMatches.isEmpty()) {
            String message = String.format("근처에 %d명의 관심사가 비슷한 여행자가 있습니다!", 
                potentialMatches.size());
            notificationService.sendNotification(userId, message);
        }
    }
    
    /**
     * 호환성 점수 계산 (0~100점)
     */
    private UserScore calculateCompatibilityScore(User currentUser, User targetUser) {
        double score = 0.0;

        // 1. 거리 점수 (40점 배점) - 가까울수록 높은 점수
        double distance = GeoUtils.calculateDistance(
            currentUser.getCurrentLatitude(), currentUser.getCurrentLongitude(),
            targetUser.getCurrentLatitude(), targetUser.getCurrentLongitude()
        );
        double distanceScore = GeoUtils.calculateDistanceScore(distance, 10.0, 40.0);
        score += distanceScore;

        // 2. 여행 스타일 호환성 (30점 배점)
        double styleScore = TravelStyleMatcher.calculateCompatibilityScore(
            currentUser.getTravelStyle(), targetUser.getTravelStyle()
        );
        score += styleScore;

        // 3. 평점 점수 (20점 배점)
        double ratingScore = (targetUser.getRatingAverage() != null ?
            targetUser.getRatingAverage() / 5.0 * 20 : 10); // 기본 10점
        score += ratingScore;

        // 4. 활동성 점수 (10점 배점)
        double activityScore = calculateActivityScore(targetUser);
        score += activityScore;

        return new UserScore(targetUser, Math.min(100.0, score));
    }
    
    private double calculateActivityScore(User user) {
        if (user.getLastActivityAt() == null) return 5.0;
        
        long hoursInactive = java.time.Duration.between(user.getLastActivityAt(), LocalDateTime.now()).toHours();
        
        if (hoursInactive <= 1) return 10.0;  // 매우 활성
        if (hoursInactive <= 6) return 8.0;   // 활성
        if (hoursInactive <= 24) return 6.0;  // 보통
        return 3.0; // 비활성
    }
    
    private boolean isActivityCompatible(String activity, User user) {
        return TravelStyleMatcher.isActivityMatchingStyle(activity, user.getTravelStyle());
    }
    
    private List<User> findImmediateMatches(User currentUser) {
        return userRepository.findNearbyUsers(
            currentUser.getId(),
            currentUser.getCurrentLatitude(),
            currentUser.getCurrentLongitude(),
            1.0  // 1km 이내
        ).stream()
            .filter(user -> user.getIsMatchingEnabled())
            .filter(user -> user.getTravelStyle() == currentUser.getTravelStyle()) // 같은 스타일
            .limit(3)
            .collect(Collectors.toList());
    }
    
    private List<User> findPotentialMatches(User currentUser) {
        return userRepository.findNearbyUsers(
            currentUser.getId(),
            currentUser.getCurrentLatitude(),
            currentUser.getCurrentLongitude(),
            5.0  // 5km 이내
        ).stream()
            .filter(user -> user.getIsMatchingEnabled())
            .filter(user -> calculateCompatibilityScore(currentUser, user).getScore() >= 60.0)
            .limit(5)
            .collect(Collectors.toList());
    }
    
    private UserDto.Response convertToDto(User user) {
        return UserDto.Response.builder()
            .id(user.getId())
            .nickname(user.getNickname())
            .profileImageUrl(user.getProfileImageUrl())
            .travelStyle(user.getTravelStyle())
            .currentLatitude(user.getCurrentLatitude())
            .currentLongitude(user.getCurrentLongitude())
            .bio(user.getBio())
            .build();
    }
    
    // 내부 클래스들
    private static class UserScore {
        private final User user;
        private final double score;
        
        public UserScore(User user, double score) {
            this.user = user;
            this.score = score;
        }
        
        public User getUser() { return user; }
        public double getScore() { return score; }
    }
}
