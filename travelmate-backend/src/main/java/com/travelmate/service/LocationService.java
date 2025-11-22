package com.travelmate.service;

import com.travelmate.dto.UserDto;
import com.travelmate.entity.User;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LocationService {
    
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    @Async
    public void processShakeEvent(UserDto.ShakeRequest request) {
        // 흔들기 강도 계산
        double shakeIntensity = calculateShakeIntensity(
            request.getAccelerationX(),
            request.getAccelerationY(), 
            request.getAccelerationZ()
        );
        
        log.info("폰 흔들기 감지: 사용자 {} - 강도 {}", request.getUserId(), shakeIntensity);
        
        if (shakeIntensity < 15.0) {
            log.debug("흔들기 강도 부족: {}", shakeIntensity);
            return;
        }
        
        // 강도에 따른 검색 반경 조정
        double searchRadius = calculateSearchRadius(shakeIntensity);
        
        List<User> nearbyUsers = userRepository.findUsersForShake(
            request.getLatitude(), 
            request.getLongitude(), 
            searchRadius
        );
        
        if (!nearbyUsers.isEmpty()) {
            // 매칭된 사용자들에게 알림
            User shaker = userRepository.findById(request.getUserId()).orElse(null);
            if (shaker != null) {
                for (User nearbyUser : nearbyUsers) {
                    notificationService.sendMatchingNotification(
                        nearbyUser.getId(),
                        shaker.getId(),
                        shaker.getNickname()
                    );
                }
                
                // 흔든 사용자에게도 결과 알림
                String message = String.format("주변에서 %d명의 여행자를 발견했습니다!", nearbyUsers.size());
                notificationService.sendNotification(request.getUserId(), message);
            }
        }
        
        log.info("폰 흔들기 결과: {}명 발견, 검색반경 {}km", nearbyUsers.size(), searchRadius);
    }
    
    public List<UserDto.Response> getSmartRecommendations(Long userId, Double latitude, Double longitude) {
        User currentUser = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 1차: 위치 기반 필터링 (5km 반경)
        List<User> nearbyUsers = userRepository.findNearbyUsers(userId, latitude, longitude, 5.0);
        
        // 2차: 여행 스타일 기반 필터링
        List<User> compatibleUsers = nearbyUsers.stream()
            .filter(user -> isCompatibleTravelStyle(currentUser.getTravelStyle(), user.getTravelStyle()))
            .limit(20)
            .collect(Collectors.toList());
        
        log.info("스마트 추천: 사용자 {} - {}명 추천", userId, compatibleUsers.size());
        
        return compatibleUsers.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public void updateLocationWithContext(Long userId, Double latitude, Double longitude, String context) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        user.setCurrentLatitude(latitude);
        user.setCurrentLongitude(longitude);
        user.setIsLocationEnabled(true);
        userRepository.save(user);
        
        // 컨텍스트 기반 자동 매칭 (예: 공항, 역, 관광지)
        if (isHotspot(context)) {
            triggerHotspotMatching(user, context);
        }
        
        log.debug("위치 업데이트: 사용자 {} - ({}, {}) 컨텍스트: {}", 
            userId, latitude, longitude, context);
    }
    
    private double calculateShakeIntensity(Double x, Double y, Double z) {
        return Math.sqrt(x * x + y * y + z * z);
    }
    
    private double calculateSearchRadius(double shakeIntensity) {
        // 흔들기 강도에 따라 1km ~ 10km 범위로 조정
        double baseRadius = 1.0;
        double intensityFactor = Math.min(shakeIntensity / 20.0, 5.0); // 최대 5배
        return Math.min(baseRadius * intensityFactor, 10.0);
    }
    
    private boolean isCompatibleTravelStyle(User.TravelStyle style1, User.TravelStyle style2) {
        if (style1 == null || style2 == null) return true;
        
        // 호환 가능한 여행 스타일 매트릭스
        return switch (style1) {
            case ADVENTURE -> style2 == User.TravelStyle.ADVENTURE || style2 == User.TravelStyle.NATURE;
            case RELAXATION -> style2 == User.TravelStyle.RELAXATION || style2 == User.TravelStyle.CULTURE;
            case CULTURE -> style2 == User.TravelStyle.CULTURE || style2 == User.TravelStyle.RELAXATION;
            case FOOD -> true; // 음식은 모든 스타일과 호환
            case SHOPPING -> style2 == User.TravelStyle.SHOPPING || style2 == User.TravelStyle.CULTURE;
            case NATURE -> style2 == User.TravelStyle.NATURE || style2 == User.TravelStyle.ADVENTURE;
        };
    }
    
    private boolean isHotspot(String context) {
        if (context == null) return false;
        
        String[] hotspotKeywords = {"공항", "역", "터미널", "관광지", "명소", "박물관", "궁궐", "타워"};
        String lowerContext = context.toLowerCase();
        
        for (String keyword : hotspotKeywords) {
            if (lowerContext.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
    
    private void triggerHotspotMatching(User user, String context) {
        // 같은 핫스팟에 있는 다른 사용자들 찾기
        List<User> hotspotUsers = userRepository.findNearbyUsers(
            user.getId(), 
            user.getCurrentLatitude(), 
            user.getCurrentLongitude(), 
            0.5 // 500m 반경
        );
        
        if (!hotspotUsers.isEmpty()) {
            String message = String.format("%s 근처에서 %d명의 여행자가 있습니다!", 
                context, hotspotUsers.size());
            notificationService.sendNotification(user.getId(), message);
            
            // 위치 공유 알림
            notificationService.sendLocationShareNotification(
                user.getId(),
                user.getCurrentLatitude(),
                user.getCurrentLongitude(),
                context
            );
        }
    }
    
    private UserDto.Response convertToDto(User user) {
        return UserDto.Response.builder()
            .id(user.getId())
            .nickname(user.getNickname())
            .profileImageUrl(user.getProfileImageUrl())
            .travelStyle(user.getTravelStyle())
            .currentLatitude(user.getCurrentLatitude())
            .currentLongitude(user.getCurrentLongitude())
            .build();
    }
}