package com.travelmate.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.ActivityDto;
import com.travelmate.entity.Activity;
import com.travelmate.entity.Post;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.ActivityRepository;
import com.travelmate.repository.PostRepository;
import com.travelmate.repository.UserFollowRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final PostRepository postRepository;
    private final ObjectMapper objectMapper;

    /**
     * 활동 기록 (비동기)
     */
    @Async
    @Transactional
    public void recordActivity(Long actorId, Activity.ActivityType type,
                               String targetType, Long targetId, Map<String, Object> metadata) {
        try {
            User actor = userRepository.findById(actorId).orElse(null);
            if (actor == null) {
                log.warn("Activity recording failed: User not found - {}", actorId);
                return;
            }

            // 중복 체크 (같은 대상에 같은 활동이 최근에 있는지)
            if (targetType != null && targetId != null &&
                activityRepository.existsByActorAndTypeAndTarget(actorId, type, targetType, targetId)) {
                log.debug("Duplicate activity skipped: {} - {} - {} - {}", actorId, type, targetType, targetId);
                return;
            }

            Activity activity = Activity.builder()
                    .actor(actor)
                    .type(type)
                    .targetType(targetType)
                    .targetId(targetId)
                    .metadata(serializeMetadata(metadata))
                    .isPublic(true)
                    .build();

            activityRepository.save(activity);
            log.debug("Activity recorded: {} - {}", type, actorId);
        } catch (Exception e) {
            log.error("Failed to record activity: {}", e.getMessage(), e);
        }
    }

    /**
     * 활동 기록 (동기)
     */
    @Transactional
    public void recordActivitySync(Long actorId, Activity.ActivityType type,
                                   String targetType, Long targetId, Map<String, Object> metadata) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> BusinessException.userNotFound(actorId));

        Activity activity = Activity.builder()
                .actor(actor)
                .type(type)
                .targetType(targetType)
                .targetId(targetId)
                .metadata(serializeMetadata(metadata))
                .isPublic(true)
                .build();

        activityRepository.save(activity);
    }

    /**
     * 내 타임라인 피드 조회 (팔로잉 + 내 활동)
     */
    @Transactional(readOnly = true)
    public ActivityDto.TimelineResponse getMyTimeline(Long userId, Pageable pageable) {
        // 팔로잉 목록 조회
        List<Long> followingIds = getFollowingIds(userId);

        Page<Activity> activities = activityRepository.findTimelineFeed(userId, followingIds, pageable);

        List<ActivityDto.Response> responses = activities.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ActivityDto.TimelineResponse.builder()
                .userId(userId)
                .activities(responses)
                .totalCount(activities.getTotalElements())
                .hasMore(activities.hasNext())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build();
    }

    /**
     * 특정 사용자의 활동 피드 조회
     */
    @Transactional(readOnly = true)
    public ActivityDto.FeedResponse getUserActivities(Long userId, Long viewerId, Pageable pageable) {
        Page<Activity> activities;

        // 본인이면 모든 활동, 아니면 공개 활동만
        if (userId.equals(viewerId)) {
            activities = activityRepository.findByActorId(userId, pageable);
        } else {
            activities = activityRepository.findPublicByActorId(userId, pageable);
        }

        List<ActivityDto.Response> responses = activities.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ActivityDto.FeedResponse.builder()
                .activities(responses)
                .totalCount(activities.getTotalElements())
                .hasMore(activities.hasNext())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build();
    }

    /**
     * 탐색 피드 (전체 공개 활동)
     */
    @Transactional(readOnly = true)
    public ActivityDto.FeedResponse getExploreFeed(Pageable pageable) {
        Page<Activity> activities = activityRepository.findPublicFeed(pageable);

        List<ActivityDto.Response> responses = activities.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ActivityDto.FeedResponse.builder()
                .activities(responses)
                .totalCount(activities.getTotalElements())
                .hasMore(activities.hasNext())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build();
    }

    /**
     * 특정 타입 활동 조회
     */
    @Transactional(readOnly = true)
    public ActivityDto.FeedResponse getActivitiesByType(Activity.ActivityType type, Pageable pageable) {
        Page<Activity> activities = activityRepository.findByType(type, pageable);

        List<ActivityDto.Response> responses = activities.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ActivityDto.FeedResponse.builder()
                .activities(responses)
                .totalCount(activities.getTotalElements())
                .hasMore(activities.hasNext())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build();
    }

    /**
     * 사용자 활동 통계 조회
     */
    @Transactional(readOnly = true)
    public ActivityDto.StatsResponse getUserActivityStats(Long userId) {
        List<Object[]> stats = activityRepository.getActivityStatsByUser(userId);

        Map<String, Long> activityByType = new HashMap<>();
        long totalActivities = 0;

        for (Object[] stat : stats) {
            Activity.ActivityType type = (Activity.ActivityType) stat[0];
            Long count = (Long) stat[1];
            activityByType.put(type.name(), count);
            totalActivities += count;
        }

        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long recentActivities = activityRepository.countRecentActivities(userId, weekAgo);

        // 마지막 활동 시간
        Page<Activity> lastActivity = activityRepository.findByActorId(userId, PageRequest.of(0, 1));
        LocalDateTime lastActivityAt = lastActivity.hasContent() ?
                lastActivity.getContent().get(0).getCreatedAt() : null;

        return ActivityDto.StatsResponse.builder()
                .userId(userId)
                .totalActivities(totalActivities)
                .recentActivities(recentActivities)
                .activityByType(activityByType)
                .lastActivityAt(lastActivityAt)
                .build();
    }

    // === Helper Methods ===

    private List<Long> getFollowingIds(Long userId) {
        Page<com.travelmate.entity.UserFollow> followings = userFollowRepository.findByFollowerId(
                userId, PageRequest.of(0, 1000));

        return followings.getContent().stream()
                .map(f -> f.getFollowing().getId())
                .collect(Collectors.toList());
    }

    private ActivityDto.Response toResponse(Activity activity) {
        return ActivityDto.Response.builder()
                .id(activity.getId())
                .actor(toActorInfo(activity.getActor()))
                .type(activity.getType().name())
                .typeDisplayName(activity.getType().getDisplayName())
                .target(toTargetInfo(activity))
                .metadata(deserializeMetadata(activity.getMetadata()))
                .createdAt(activity.getCreatedAt())
                .relativeTime(getRelativeTime(activity.getCreatedAt()))
                .build();
    }

    private ActivityDto.ActorInfo toActorInfo(User user) {
        return ActivityDto.ActorInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    private ActivityDto.TargetInfo toTargetInfo(Activity activity) {
        if (activity.getTargetType() == null || activity.getTargetId() == null) {
            return null;
        }

        ActivityDto.TargetInfo targetInfo = ActivityDto.TargetInfo.builder()
                .type(activity.getTargetType())
                .id(activity.getTargetId())
                .build();

        // 대상 타입에 따라 추가 정보 로드
        try {
            switch (activity.getTargetType()) {
                case "POST":
                    postRepository.findById(activity.getTargetId()).ifPresent(post -> {
                        targetInfo.setTitle(post.getTitle());
                        targetInfo.setDescription(truncate(post.getContent(), 100));
                        if (post.getImages() != null && !post.getImages().isEmpty()) {
                            targetInfo.setImageUrl(post.getImages().get(0).getImageUrl());
                        }
                    });
                    break;
                case "USER":
                    userRepository.findById(activity.getTargetId()).ifPresent(user -> {
                        targetInfo.setTitle(user.getNickname());
                        targetInfo.setDescription("@" + user.getUsername());
                        targetInfo.setImageUrl(user.getProfileImageUrl());
                    });
                    break;
                // 다른 타입들은 metadata에서 정보를 가져오도록 함
            }
        } catch (Exception e) {
            log.warn("Failed to load target info: {}", e.getMessage());
        }

        return targetInfo;
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize metadata: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Object> deserializeMetadata(String metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(metadata, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to deserialize metadata: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private String getRelativeTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }

        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(dateTime, now);

        if (minutes < 1) {
            return "방금 전";
        } else if (minutes < 60) {
            return minutes + "분 전";
        } else if (minutes < 60 * 24) {
            return (minutes / 60) + "시간 전";
        } else if (minutes < 60 * 24 * 7) {
            return (minutes / (60 * 24)) + "일 전";
        } else if (minutes < 60 * 24 * 30) {
            return (minutes / (60 * 24 * 7)) + "주 전";
        } else if (minutes < 60 * 24 * 365) {
            return (minutes / (60 * 24 * 30)) + "개월 전";
        } else {
            return (minutes / (60 * 24 * 365)) + "년 전";
        }
    }

    private String truncate(String text, int maxLength) {
        if (text == null) {
            return null;
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }
}
