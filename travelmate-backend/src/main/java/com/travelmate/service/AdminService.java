package com.travelmate.service;

import com.travelmate.dto.AdminDto;
import com.travelmate.entity.RecommendationFeedback;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.LocationCategory;
import com.travelmate.entity.nft.Rarity;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.RecommendationFeedbackRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.nft.LocationReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin Service for dashboard and management operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final CollectibleLocationRepository locationRepository;
    private final UserNftCollectionRepository collectionRepository;
    private final TravelGroupRepository groupRepository;
    private final LocationReviewRepository reviewRepository;
    private final RecommendationFeedbackRepository recommendationFeedbackRepository;

    /**
     * Get dashboard statistics
     */
    @Transactional(readOnly = true)
    public AdminDto.DashboardStats getDashboardStats() {
        LocalDateTime today = LocalDate.now().atStartOfDay();
        LocalDateTime weekAgo = today.minusDays(7);

        // User stats
        long totalUsers = userRepository.count();
        long newUsersToday = userRepository.countByCreatedAtAfter(today);
        long newUsersThisWeek = userRepository.countByCreatedAtAfter(weekAgo);
        long activeUsersToday = userRepository.countActiveUsersSince(today);

        // NFT stats
        long totalNfts = collectionRepository.count();
        long mintedNfts = collectionRepository.countByMintStatusMinted();
        long collectionsToday = collectionRepository.countByCollectedAtAfter(today);

        // Group stats
        long totalGroups = groupRepository.count();
        long activeGroups = groupRepository.countActiveGroups();

        // Review stats
        long totalReviews = reviewRepository.count();
        Double averageRating = reviewRepository.getAverageRating();

        // Daily stats for last 30 days
        List<AdminDto.DailyStats> dailyStats = getDailyStats(30);

        // NFTs by rarity
        Map<String, Long> nftsByRarity = new LinkedHashMap<>();
        for (Rarity rarity : Rarity.values()) {
            long count = collectionRepository.countByLocationRarity(rarity);
            nftsByRarity.put(rarity.name(), count);
        }

        return AdminDto.DashboardStats.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .newUsersThisWeek(newUsersThisWeek)
                .activeUsersToday(activeUsersToday)
                .totalNfts(totalNfts)
                .mintedNfts(mintedNfts)
                .collectionsToday(collectionsToday)
                .totalGroups(totalGroups)
                .activeGroups(activeGroups)
                .totalReviews(totalReviews)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .dailyStats(dailyStats)
                .nftsByRarity(nftsByRarity)
                .build();
    }

    /**
     * Get daily statistics
     */
    private List<AdminDto.DailyStats> getDailyStats(int days) {
        List<AdminDto.DailyStats> stats = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

            stats.add(AdminDto.DailyStats.builder()
                    .date(date)
                    .newUsers(userRepository.countByCreatedAtBetween(startOfDay, endOfDay))
                    .nftCollections(collectionRepository.countByCollectedAtBetween(startOfDay, endOfDay))
                    .build());
        }

        return stats;
    }

    /**
     * Get users with management info
     */
    @Transactional(readOnly = true)
    public Page<AdminDto.UserManagement> getUsers(String search, String role, Boolean isActive, Pageable pageable) {
        return userRepository.findUsersForAdmin(search, role, isActive, pageable)
                .map(this::toUserManagement);
    }

    private AdminDto.UserManagement toUserManagement(User user) {
        return AdminDto.UserManagement.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastActivityAt())
                .nftCount(collectionRepository.countByUserId(user.getId()))
                .build();
    }

    /**
     * Get user detail for admin
     */
    @Transactional(readOnly = true)
    public AdminDto.UserDetailResponse getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        int nftCount = collectionRepository.countByUserId(userId);
        int mintedNftCount = collectionRepository.countMintedByUserId(userId);

        return AdminDto.UserDetailResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .bio(user.getBio())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastActivityAt())
                .nftCount(nftCount)
                .mintedNftCount(mintedNftCount)
                .build();
    }

    /**
     * Update user (admin action)
     */
    @Transactional
    public AdminDto.UserManagement updateUser(Long userId, AdminDto.UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        if (request.getRole() != null) {
            user.setRole(User.Role.valueOf(request.getRole()));
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }

        user = userRepository.save(user);
        log.info("Admin updated user {}: role={}, active={}", userId, request.getRole(), request.getIsActive());

        return toUserManagement(user);
    }

    /**
     * Get locations for management
     */
    @Transactional(readOnly = true)
    public Page<AdminDto.LocationManagement> getLocations(
            String search, String category, String rarity, Boolean isActive, Pageable pageable) {

        return locationRepository.findLocationsForAdmin(search, category, rarity, isActive, pageable)
                .map(this::toLocationManagement);
    }

    private AdminDto.LocationManagement toLocationManagement(CollectibleLocation location) {
        int totalCollections = (int) collectionRepository.countByLocationId(location.getId());
        int totalReviews = (int) reviewRepository.countByLocationId(location.getId());
        Double averageRating = reviewRepository.getAverageRatingByLocationId(location.getId());

        return AdminDto.LocationManagement.builder()
                .id(location.getId())
                .name(location.getName())
                .description(location.getDescription())
                .region(location.getRegion())
                .country(location.getCountry())
                .category(location.getCategory().name())
                .rarity(location.getRarity().name())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .collectRadius(location.getCollectRadius().intValue())
                .isActive(location.getIsActive())
                .createdAt(location.getCreatedAt())
                .totalCollections(totalCollections)
                .totalReviews(totalReviews)
                .averageRating(averageRating)
                .build();
    }

    /**
     * Get recommendation feedback for quality monitoring.
     */
    @Transactional(readOnly = true)
    public Page<AdminDto.RecommendationFeedbackResponse> getRecommendationFeedback(
            Long userId, Integer rating, String feedbackType, String targetType, Pageable pageable) {

        validateRatingFilter(rating);

        return recommendationFeedbackRepository
                .findForAdmin(userId, rating, normalizeFilter(feedbackType), normalizeFilter(targetType), pageable)
                .map(this::toRecommendationFeedbackResponse);
    }

    /**
     * Get aggregate recommendation feedback health metrics.
     */
    @Transactional(readOnly = true)
    public AdminDto.RecommendationFeedbackStats getRecommendationFeedbackStats() {
        Map<Integer, Long> ratingDistribution = new LinkedHashMap<>();
        for (int rating = 1; rating <= 5; rating++) {
            ratingDistribution.put(rating, recommendationFeedbackRepository.countByRating(rating));
        }

        return AdminDto.RecommendationFeedbackStats.builder()
                .totalFeedback(recommendationFeedbackRepository.count())
                .averageRating(Optional.ofNullable(recommendationFeedbackRepository.getAverageRating()).orElse(0.0))
                .lowRatingCount(recommendationFeedbackRepository.countByRatingLessThanEqual(2))
                .feedbackLast7Days(recommendationFeedbackRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7)))
                .ratingDistribution(ratingDistribution)
                .feedbackTypeDistribution(toCountMap(recommendationFeedbackRepository.countByFeedbackType()))
                .targetTypeDistribution(toCountMap(recommendationFeedbackRepository.countByTargetType()))
                .build();
    }

    private AdminDto.RecommendationFeedbackResponse toRecommendationFeedbackResponse(
            RecommendationFeedback feedback) {
        User user = feedback.getUser();

        return AdminDto.RecommendationFeedbackResponse.builder()
                .id(feedback.getId())
                .userId(user.getId())
                .userNickname(user.getNickname())
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .feedbackType(feedback.getFeedbackType())
                .targetType(feedback.getTargetType())
                .targetId(feedback.getTargetId())
                .metadata(feedback.getMetadata())
                .createdAt(feedback.getCreatedAt())
                .build();
    }

    private void validateRatingFilter(Integer rating) {
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new IllegalArgumentException("rating은 1부터 5 사이여야 합니다.");
        }
    }

    private String normalizeFilter(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private Map<String, Long> toCountMap(List<Object[]> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            counts.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        return counts;
    }

    /**
     * Create new location
     */
    @Transactional
    public AdminDto.LocationManagement createLocation(AdminDto.CreateLocationRequest request) {
        CollectibleLocation location = CollectibleLocation.builder()
                .name(request.getName())
                .description(request.getDescription())
                .region(request.getRegion())
                .country(request.getCountry())
                .category(LocationCategory.valueOf(request.getCategory()))
                .rarity(Rarity.valueOf(request.getRarity()))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .collectRadius(request.getCollectRadius() != null ? request.getCollectRadius().doubleValue() : 50.0)
                .imageUrl(request.getImageUrl())
                .pointReward(request.getBasePoints() != null ? request.getBasePoints() : 100)
                .isActive(true)
                .build();

        location = locationRepository.save(location);
        log.info("Admin created location: {}", location.getId());

        return toLocationManagement(location);
    }

    /**
     * Update location
     */
    @Transactional
    public AdminDto.LocationManagement updateLocation(Long locationId, AdminDto.UpdateLocationRequest request) {
        CollectibleLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> BusinessException.notFound("장소를 찾을 수 없습니다."));

        if (request.getName() != null) {
            location.setName(request.getName());
        }
        if (request.getDescription() != null) {
            location.setDescription(request.getDescription());
        }
        if (request.getRarity() != null) {
            location.setRarity(Rarity.valueOf(request.getRarity()));
        }
        if (request.getCollectRadius() != null) {
            location.setCollectRadius(request.getCollectRadius().doubleValue());
        }
        if (request.getIsActive() != null) {
            location.setIsActive(request.getIsActive());
        }
        if (request.getBasePoints() != null) {
            location.setPointReward(request.getBasePoints());
        }

        location = locationRepository.save(location);
        log.info("Admin updated location: {}", locationId);

        return toLocationManagement(location);
    }

    /**
     * Delete location (soft delete)
     */
    @Transactional
    public void deleteLocation(Long locationId) {
        CollectibleLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> BusinessException.notFound("장소를 찾을 수 없습니다."));

        location.setIsActive(false);
        locationRepository.save(location);
        log.info("Admin soft-deleted location: {}", locationId);
    }

    /**
     * Bulk action on users
     */
    @Transactional
    public AdminDto.BulkActionResponse bulkUserAction(AdminDto.BulkActionRequest request) {
        int success = 0;
        int failure = 0;
        List<Long> failedIds = new ArrayList<>();

        for (Long userId : request.getIds()) {
            try {
                User user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    failedIds.add(userId);
                    failure++;
                    continue;
                }

                switch (request.getAction()) {
                    case "ACTIVATE":
                        user.setIsActive(true);
                        break;
                    case "DEACTIVATE":
                        user.setIsActive(false);
                        break;
                    default:
                        throw new IllegalArgumentException("Unknown action: " + request.getAction());
                }

                userRepository.save(user);
                success++;
            } catch (Exception e) {
                failedIds.add(userId);
                failure++;
                log.error("Failed bulk action for user {}: {}", userId, e.getMessage());
            }
        }

        return AdminDto.BulkActionResponse.builder()
                .successCount(success)
                .failureCount(failure)
                .failedIds(failedIds)
                .message(String.format("%d 성공, %d 실패", success, failure))
                .build();
    }

    /**
     * Get system health
     */
    public AdminDto.SystemHealth getSystemHealth() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long usedMemory = runtime.totalMemory() - runtime.freeMemory();
        double memoryUsage = (double) usedMemory / maxMemory * 100;

        Map<String, AdminDto.ServiceStatus> services = new LinkedHashMap<>();
        services.put("database", checkDatabaseHealth());
        services.put("cache", AdminDto.ServiceStatus.builder()
                .name("Cache")
                .status("UP")
                .responseTime(1)
                .message("Cache is healthy")
                .build());

        return AdminDto.SystemHealth.builder()
                .status("UP")
                .uptime(System.currentTimeMillis() - getApplicationStartTime())
                .memoryUsage(memoryUsage)
                .services(services)
                .build();
    }

    private AdminDto.ServiceStatus checkDatabaseHealth() {
        long startTime = System.currentTimeMillis();
        try {
            userRepository.count();
            return AdminDto.ServiceStatus.builder()
                    .name("Database")
                    .status("UP")
                    .responseTime(System.currentTimeMillis() - startTime)
                    .message("Database is healthy")
                    .build();
        } catch (Exception e) {
            return AdminDto.ServiceStatus.builder()
                    .name("Database")
                    .status("DOWN")
                    .responseTime(System.currentTimeMillis() - startTime)
                    .message(e.getMessage())
                    .build();
        }
    }

    private long getApplicationStartTime() {
        return java.lang.management.ManagementFactory.getRuntimeMXBean().getStartTime();
    }
}
