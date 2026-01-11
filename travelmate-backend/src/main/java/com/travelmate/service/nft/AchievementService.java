package com.travelmate.service.nft;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.NftDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.AchievementRepository;
import com.travelmate.repository.nft.UserAchievementRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserNftCollectionRepository userNftCollectionRepository;
    private final UserRepository userRepository;
    private final PointService pointService;
    private final ObjectMapper objectMapper;

    /**
     * 모든 업적 목록 조회
     */
    @Transactional(readOnly = true)
    public List<NftDto.AchievementResponse> getAllAchievements(Long userId) {
        List<Achievement> achievements = achievementRepository.findByIsActiveTrueOrderByDisplayOrderAsc();

        // N+1 방지: 모든 업적 ID를 한 번에 조회
        List<Long> achievementIds = achievements.stream()
                .map(Achievement::getId)
                .toList();

        Map<Long, UserAchievement> userAchievementMap = userAchievementRepository
                .findByUserIdAndAchievementIds(userId, achievementIds)
                .stream()
                .collect(Collectors.toMap(
                        ua -> ua.getAchievement().getId(),
                        ua -> ua
                ));

        return achievements.stream()
                .map(achievement -> toAchievementResponseWithMap(achievement, userAchievementMap))
                .toList();
    }

    /**
     * 타입별 업적 조회
     */
    @Transactional(readOnly = true)
    public List<NftDto.AchievementResponse> getAchievementsByType(Long userId, AchievementType type) {
        List<Achievement> achievements = achievementRepository
                .findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(type);

        // N+1 방지: 배치 조회
        List<Long> achievementIds = achievements.stream()
                .map(Achievement::getId)
                .toList();

        Map<Long, UserAchievement> userAchievementMap = userAchievementRepository
                .findByUserIdAndAchievementIds(userId, achievementIds)
                .stream()
                .collect(Collectors.toMap(
                        ua -> ua.getAchievement().getId(),
                        ua -> ua
                ));

        return achievements.stream()
                .map(achievement -> toAchievementResponseWithMap(achievement, userAchievementMap))
                .toList();
    }

    /**
     * 내 업적 현황 조회
     */
    @Transactional(readOnly = true)
    public List<NftDto.AchievementResponse> getMyAchievements(Long userId) {
        List<UserAchievement> userAchievements = userAchievementRepository.findByUserId(userId);

        return userAchievements.stream()
                .map(ua -> toAchievementResponseFromUserAchievement(ua))
                .toList();
    }

    /**
     * 완료된 업적만 조회
     */
    @Transactional(readOnly = true)
    public List<NftDto.AchievementResponse> getCompletedAchievements(Long userId) {
        List<UserAchievement> userAchievements = userAchievementRepository.findByUserIdAndIsCompletedTrue(userId);

        return userAchievements.stream()
                .map(ua -> toAchievementResponseFromUserAchievement(ua))
                .toList();
    }

    /**
     * 업적 통계 조회
     */
    @Transactional(readOnly = true)
    public NftDto.AchievementStatsResponse getAchievementStats(Long userId) {
        int totalAchievements = (int) achievementRepository.count();
        int completedAchievements = userAchievementRepository.countByUserIdAndIsCompletedTrue(userId);

        // 업적에서 획득한 총 포인트
        List<UserAchievement> completed = userAchievementRepository.findByUserIdAndIsCompletedTrue(userId);
        long totalPoints = completed.stream()
                .mapToLong(ua -> ua.getAchievement().getPointReward())
                .sum();

        // 배지 NFT 획득 수
        int badgeNfts = (int) completed.stream()
                .filter(ua -> ua.getAchievement().getGrantsBadgeNft() && ua.getBadgeTokenId() != null)
                .count();

        return NftDto.AchievementStatsResponse.builder()
                .totalAchievements(totalAchievements)
                .completedAchievements(completedAchievements)
                .totalPointsFromAchievements(totalPoints)
                .badgeNftsEarned(badgeNfts)
                .build();
    }

    /**
     * NFT 수집 후 업적 체크
     */
    @Transactional
    public List<NftDto.AchievementUnlocked> checkAchievementsOnCollect(Long userId) {
        List<NftDto.AchievementUnlocked> unlockedList = new ArrayList<>();

        // 수집 관련 업적들 조회
        List<Achievement> collectionAchievements = achievementRepository
                .findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType.COLLECTION);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        for (Achievement achievement : collectionAchievements) {
            // 이미 완료된 업적인지 확인
            Optional<UserAchievement> existingOpt = userAchievementRepository
                    .findByUserIdAndAchievementId(userId, achievement.getId());

            if (existingOpt.isPresent() && existingOpt.get().getIsCompleted()) {
                continue; // 이미 완료됨
            }

            // 조건 파싱 및 확인
            AchievementCondition condition = parseCondition(achievement.getConditionJson());
            int currentProgress = calculateProgress(userId, condition);
            int targetProgress = condition.getTarget();

            UserAchievement userAchievement;
            if (existingOpt.isPresent()) {
                userAchievement = existingOpt.get();
                userAchievement.setCurrentProgress(currentProgress);
            } else {
                userAchievement = UserAchievement.builder()
                        .user(user)
                        .achievement(achievement)
                        .currentProgress(currentProgress)
                        .targetProgress(targetProgress)
                        .isCompleted(false)
                        .build();
            }

            // 업적 완료 체크
            if (currentProgress >= targetProgress && !userAchievement.getIsCompleted()) {
                userAchievement.setIsCompleted(true);
                userAchievement.setCompletedAt(LocalDateTime.now());

                // 포인트 보상
                Long achievementPointReward = achievement.getPointReward() != null ? achievement.getPointReward().longValue() : 0L;
                pointService.earnPoints(
                        userId,
                        achievementPointReward,
                        PointSource.ACHIEVEMENT,
                        achievement.getName() + " 업적 달성",
                        achievement.getId(),
                        "ACHIEVEMENT"
                );

                unlockedList.add(NftDto.AchievementUnlocked.builder()
                        .achievementId(achievement.getId())
                        .name(achievement.getName())
                        .description(achievement.getDescription())
                        .iconUrl(achievement.getIconUrl())
                        .rarity(achievement.getRarity())
                        .pointReward(achievementPointReward)
                        .build());

                log.info("업적 달성: userId={}, achievement={}", userId, achievement.getName());
            }

            userAchievementRepository.save(userAchievement);
        }

        return unlockedList;
    }

    /**
     * 특정 업적 진행도 업데이트
     */
    @Transactional
    public void updateAchievementProgress(Long userId, String achievementCode, int progress) {
        Achievement achievement = achievementRepository.findByCode(achievementCode)
                .orElseThrow(() -> new RuntimeException("업적을 찾을 수 없습니다: " + achievementCode));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        UserAchievement userAchievement = userAchievementRepository
                .findByUserIdAndAchievementId(userId, achievement.getId())
                .orElseGet(() -> UserAchievement.builder()
                        .user(user)
                        .achievement(achievement)
                        .currentProgress(0)
                        .targetProgress(parseCondition(achievement.getConditionJson()).getTarget())
                        .isCompleted(false)
                        .build());

        if (userAchievement.getIsCompleted()) {
            return; // 이미 완료됨
        }

        userAchievement.setCurrentProgress(progress);

        // 업적 완료 체크
        if (progress >= userAchievement.getTargetProgress()) {
            userAchievement.setIsCompleted(true);
            userAchievement.setCompletedAt(LocalDateTime.now());

            // 포인트 보상
            Long progressPointReward = achievement.getPointReward() != null ? achievement.getPointReward().longValue() : 0L;
            pointService.earnPoints(
                    userId,
                    progressPointReward,
                    PointSource.ACHIEVEMENT,
                    achievement.getName() + " 업적 달성",
                    achievement.getId(),
                    "ACHIEVEMENT"
            );

            log.info("업적 달성: userId={}, achievement={}", userId, achievement.getName());
        }

        userAchievementRepository.save(userAchievement);
    }

    // ===== Helper Methods =====

    private AchievementCondition parseCondition(String conditionJson) {
        try {
            Map<String, Object> conditionMap = objectMapper.readValue(
                    conditionJson,
                    new TypeReference<Map<String, Object>>() {}
            );

            return new AchievementCondition(
                    (String) conditionMap.get("type"),
                    ((Number) conditionMap.getOrDefault("target", 1)).intValue(),
                    (String) conditionMap.get("category"),
                    (String) conditionMap.get("rarity"),
                    (String) conditionMap.get("region")
            );
        } catch (Exception e) {
            log.error("업적 조건 파싱 실패: {}", conditionJson, e);
            return new AchievementCondition("TOTAL_COLLECT", 1, null, null, null);
        }
    }

    private int calculateProgress(Long userId, AchievementCondition condition) {
        return switch (condition.getType()) {
            case "TOTAL_COLLECT" -> userNftCollectionRepository.countByUserId(userId);
            case "RARITY_COLLECT" -> {
                Rarity rarity = Rarity.valueOf(condition.getRarity());
                yield userNftCollectionRepository.countByUserIdAndRarity(userId, rarity);
            }
            case "CATEGORY_COLLECT" -> {
                LocationCategory category = LocationCategory.valueOf(condition.getCategory());
                yield userNftCollectionRepository.countByUserIdAndCategory(userId, category);
            }
            case "REGION_COLLECT" -> userNftCollectionRepository
                    .countByUserIdAndRegion(userId, condition.getRegion());
            default -> 0;
        };
    }

    private NftDto.AchievementResponse toAchievementResponse(Achievement achievement, Long userId) {
        Optional<UserAchievement> userAchievementOpt = userAchievementRepository
                .findByUserIdAndAchievementId(userId, achievement.getId());

        int currentProgress = 0;
        int targetProgress = 1;
        boolean isCompleted = false;
        LocalDateTime completedAt = null;

        if (userAchievementOpt.isPresent()) {
            UserAchievement ua = userAchievementOpt.get();
            currentProgress = ua.getCurrentProgress();
            targetProgress = ua.getTargetProgress();
            isCompleted = ua.getIsCompleted();
            completedAt = ua.getCompletedAt();
        } else {
            targetProgress = parseCondition(achievement.getConditionJson()).getTarget();
        }

        return NftDto.AchievementResponse.builder()
                .id(achievement.getId())
                .code(achievement.getCode())
                .name(achievement.getName())
                .description(achievement.getDescription())
                .iconUrl(achievement.getIconUrl())
                .badgeImageUrl(achievement.getBadgeImageUrl())
                .type(achievement.getType())
                .rarity(achievement.getRarity())
                .pointReward(achievement.getPointReward() != null ? achievement.getPointReward().longValue() : 0L)
                .grantsBadgeNft(achievement.getGrantsBadgeNft())
                .currentProgress(currentProgress)
                .targetProgress(targetProgress)
                .isCompleted(isCompleted)
                .completedAt(completedAt)
                .build();
    }

    /**
     * 배치 조회된 UserAchievement Map을 사용하여 응답 생성 (N+1 방지)
     */
    private NftDto.AchievementResponse toAchievementResponseWithMap(
            Achievement achievement, Map<Long, UserAchievement> userAchievementMap) {

        int currentProgress = 0;
        int targetProgress = 1;
        boolean isCompleted = false;
        LocalDateTime completedAt = null;

        UserAchievement ua = userAchievementMap.get(achievement.getId());
        if (ua != null) {
            currentProgress = ua.getCurrentProgress();
            targetProgress = ua.getTargetProgress();
            isCompleted = ua.getIsCompleted();
            completedAt = ua.getCompletedAt();
        } else {
            targetProgress = parseCondition(achievement.getConditionJson()).getTarget();
        }

        return NftDto.AchievementResponse.builder()
                .id(achievement.getId())
                .code(achievement.getCode())
                .name(achievement.getName())
                .description(achievement.getDescription())
                .iconUrl(achievement.getIconUrl())
                .badgeImageUrl(achievement.getBadgeImageUrl())
                .type(achievement.getType())
                .rarity(achievement.getRarity())
                .pointReward(achievement.getPointReward() != null ? achievement.getPointReward().longValue() : 0L)
                .grantsBadgeNft(achievement.getGrantsBadgeNft())
                .currentProgress(currentProgress)
                .targetProgress(targetProgress)
                .isCompleted(isCompleted)
                .completedAt(completedAt)
                .build();
    }

    private NftDto.AchievementResponse toAchievementResponseFromUserAchievement(UserAchievement ua) {
        Achievement achievement = ua.getAchievement();

        return NftDto.AchievementResponse.builder()
                .id(achievement.getId())
                .code(achievement.getCode())
                .name(achievement.getName())
                .description(achievement.getDescription())
                .iconUrl(achievement.getIconUrl())
                .badgeImageUrl(achievement.getBadgeImageUrl())
                .type(achievement.getType())
                .rarity(achievement.getRarity())
                .pointReward(achievement.getPointReward() != null ? achievement.getPointReward().longValue() : 0L)
                .grantsBadgeNft(achievement.getGrantsBadgeNft())
                .currentProgress(ua.getCurrentProgress())
                .targetProgress(ua.getTargetProgress())
                .isCompleted(ua.getIsCompleted())
                .completedAt(ua.getCompletedAt())
                .build();
    }

    private record AchievementCondition(
            String type,
            int target,
            String category,
            String rarity,
            String region
    ) {
        public String getType() { return type; }
        public int getTarget() { return target; }
        public String getCategory() { return category; }
        public String getRarity() { return rarity; }
        public String getRegion() { return region; }
    }
}
