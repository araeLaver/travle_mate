package com.travelmate.service;

import com.travelmate.config.CacheConfig;
import com.travelmate.dto.FollowDto;
import com.travelmate.entity.User;
import com.travelmate.entity.UserFollow;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserFollowRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowService {

    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 팔로우하기
     */
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheConfig.FOLLOW_STATS, key = "#followerId"),
        @CacheEvict(value = CacheConfig.FOLLOW_STATS, key = "#followingId")
    })
    public FollowDto.FollowResponse follow(Long followerId, Long followingId) {
        // 자기 자신을 팔로우 불가
        if (followerId.equals(followingId)) {
            throw BusinessException.badRequest("자기 자신을 팔로우할 수 없습니다.");
        }

        // 이미 팔로우 중인지 확인
        if (userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw BusinessException.conflict("이미 팔로우 중입니다.");
        }

        // 사용자 조회
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> BusinessException.userNotFound(followerId));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> BusinessException.userNotFound(followingId));

        // 팔로우 생성
        UserFollow userFollow = UserFollow.builder()
                .follower(follower)
                .following(following)
                .build();

        userFollowRepository.save(userFollow);

        // 맞팔 여부 확인
        boolean isMutual = userFollowRepository.existsByFollowerIdAndFollowingId(followingId, followerId);

        // 팔로우 알림 발송
        notificationService.notifyFollow(followingId, follower.getId(), follower.getNickname());

        log.info("팔로우 완료: {} -> {}", followerId, followingId);

        // 통계 조회
        FollowDto.FollowStatsResponse stats = getFollowStats(followingId);

        return FollowDto.FollowResponse.builder()
                .success(true)
                .message(following.getNickname() + "님을 팔로우합니다.")
                .isFollowing(true)
                .isMutual(isMutual)
                .stats(stats)
                .build();
    }

    /**
     * 언팔로우하기
     */
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheConfig.FOLLOW_STATS, key = "#followerId"),
        @CacheEvict(value = CacheConfig.FOLLOW_STATS, key = "#followingId")
    })
    public FollowDto.FollowResponse unfollow(Long followerId, Long followingId) {
        // 팔로우 관계 확인
        if (!userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw BusinessException.notFound("팔로우 관계가 존재하지 않습니다.");
        }

        // 언팔로우
        userFollowRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);

        User following = userRepository.findById(followingId)
                .orElseThrow(() -> BusinessException.userNotFound(followingId));

        log.info("언팔로우 완료: {} -> {}", followerId, followingId);

        // 통계 조회
        FollowDto.FollowStatsResponse stats = getFollowStats(followingId);

        return FollowDto.FollowResponse.builder()
                .success(true)
                .message(following.getNickname() + "님을 언팔로우했습니다.")
                .isFollowing(false)
                .isMutual(false)
                .stats(stats)
                .build();
    }

    /**
     * 팔로워 목록 조회 (나를 팔로우하는 사람들)
     */
    @Transactional(readOnly = true)
    public Page<FollowDto.FollowUserResponse> getFollowers(Long userId, Long viewerId, Pageable pageable) {
        Page<UserFollow> follows = userFollowRepository.findByFollowingId(userId, pageable);

        // 뷰어가 팔로우하는 사용자 ID 조회 (맞팔 여부 확인용)
        Set<Long> viewerFollowingIds = viewerId != null
                ? Set.copyOf(userFollowRepository.findFollowingIdsInUserIds(
                        viewerId,
                        follows.getContent().stream().map(f -> f.getFollower().getId()).toList()))
                : Set.of();

        return follows.map(f -> toFollowUserResponse(f.getFollower(), f.getCreatedAt(), viewerFollowingIds));
    }

    /**
     * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
     */
    @Transactional(readOnly = true)
    public Page<FollowDto.FollowUserResponse> getFollowing(Long userId, Long viewerId, Pageable pageable) {
        Page<UserFollow> follows = userFollowRepository.findByFollowerId(userId, pageable);

        // 해당 사용자들이 userId를 팔로우하는지 확인 (맞팔 여부)
        List<Long> followingUserIds = follows.getContent().stream()
                .map(f -> f.getFollowing().getId())
                .toList();

        Set<Long> mutualFollowIds = followingUserIds.isEmpty() ? Set.of()
                : Set.copyOf(userFollowRepository.findFollowingIdsInUserIds(userId, followingUserIds)
                        .stream()
                        .filter(id -> userFollowRepository.existsByFollowerIdAndFollowingId(id, userId))
                        .toList());

        return follows.map(f -> {
            User user = f.getFollowing();
            boolean isMutual = userFollowRepository.existsByFollowerIdAndFollowingId(user.getId(), userId);
            return FollowDto.FollowUserResponse.builder()
                    .id(user.getId())
                    .nickname(user.getNickname())
                    .profileImageUrl(user.getProfileImageUrl())
                    .bio(user.getBio())
                    .followedAt(f.getCreatedAt())
                    .isMutual(isMutual)
                    .build();
        });
    }

    /**
     * 팔로우 통계 조회
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.FOLLOW_STATS, key = "#userId")
    public FollowDto.FollowStatsResponse getFollowStats(Long userId) {
        long followerCount = userFollowRepository.countByFollowingId(userId);
        long followingCount = userFollowRepository.countByFollowerId(userId);

        return FollowDto.FollowStatsResponse.builder()
                .userId(userId)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .build();
    }

    /**
     * 팔로우 여부 확인
     */
    @Transactional(readOnly = true)
    public boolean isFollowing(Long followerId, Long followingId) {
        return userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    /**
     * 팔로우 상태 조회 (양방향)
     */
    @Transactional(readOnly = true)
    public FollowDto.FollowStatusResponse getFollowStatus(Long viewerId, Long targetUserId) {
        boolean isFollowing = userFollowRepository.existsByFollowerIdAndFollowingId(viewerId, targetUserId);
        boolean isFollowedBy = userFollowRepository.existsByFollowerIdAndFollowingId(targetUserId, viewerId);

        return FollowDto.FollowStatusResponse.builder()
                .userId(targetUserId)
                .isFollowing(isFollowing)
                .isFollowedBy(isFollowedBy)
                .isMutual(isFollowing && isFollowedBy)
                .build();
    }

    /**
     * 맞팔로우 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<FollowDto.FollowUserResponse> getMutualFollowers(Long userId, Pageable pageable) {
        Page<User> mutualUsers = userFollowRepository.findMutualFollowers(userId, pageable);

        return mutualUsers.map(user -> FollowDto.FollowUserResponse.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .bio(user.getBio())
                .isMutual(true)
                .build());
    }

    /**
     * 사용자들의 팔로우 상태 배치 조회
     */
    @Transactional(readOnly = true)
    public List<FollowDto.UserWithFollowStatus> getUsersWithFollowStatus(Long viewerId, List<Long> userIds) {
        List<User> users = userRepository.findAllById(userIds);

        // 뷰어가 팔로우하는 사용자 ID
        Set<Long> followingIds = userIds.isEmpty() ? Set.of()
                : Set.copyOf(userFollowRepository.findFollowingIdsInUserIds(viewerId, userIds));

        // 뷰어를 팔로우하는 사용자 ID (userIds 중에서)
        Set<Long> followedByIds = userIds.stream()
                .filter(id -> userFollowRepository.existsByFollowerIdAndFollowingId(id, viewerId))
                .collect(Collectors.toSet());

        return users.stream().map(user -> {
            boolean isFollowing = followingIds.contains(user.getId());
            boolean isFollowedBy = followedByIds.contains(user.getId());

            return FollowDto.UserWithFollowStatus.builder()
                    .id(user.getId())
                    .nickname(user.getNickname())
                    .profileImageUrl(user.getProfileImageUrl())
                    .bio(user.getBio())
                    .rating(user.getRating())
                    .totalNftsCollected(user.getTotalNftsCollected())
                    .isFollowing(isFollowing)
                    .isFollowedBy(isFollowedBy)
                    .isMutual(isFollowing && isFollowedBy)
                    .build();
        }).toList();
    }

    // ===== Helper Methods =====

    private FollowDto.FollowUserResponse toFollowUserResponse(
            User user,
            java.time.LocalDateTime followedAt,
            Set<Long> viewerFollowingIds) {

        return FollowDto.FollowUserResponse.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .bio(user.getBio())
                .followedAt(followedAt)
                .isMutual(viewerFollowingIds.contains(user.getId()))
                .build();
    }
}
