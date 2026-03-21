package com.travelmate.service;

import com.travelmate.dto.UserBlockDto;
import com.travelmate.entity.User;
import com.travelmate.entity.UserBlock;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserBlockRepository;
import com.travelmate.repository.UserFollowRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;

    /**
     * 사용자 차단
     */
    @Transactional
    public UserBlockDto.Response blockUser(Long blockerId, UserBlockDto.BlockRequest request) {
        if (blockerId.equals(request.getUserId())) {
            throw new BusinessException("자기 자신을 차단할 수 없습니다.");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));

        User blocked = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new BusinessException("차단할 사용자를 찾을 수 없습니다."));

        // 이미 차단 여부 확인
        if (userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, request.getUserId())) {
            throw new BusinessException("이미 차단한 사용자입니다.");
        }

        // 차단 생성
        UserBlock block = UserBlock.builder()
                .blocker(blocker)
                .blocked(blocked)
                .reason(request.getReason())
                .build();

        UserBlock savedBlock = userBlockRepository.save(block);

        // 차단 시 팔로우 관계도 해제
        removeFollowRelationship(blockerId, request.getUserId());

        log.info("User {} blocked user {}", blockerId, request.getUserId());

        return toResponse(savedBlock);
    }

    /**
     * 사용자 차단 해제
     */
    @Transactional
    public void unblockUser(Long blockerId, Long blockedId) {
        if (!userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            throw new BusinessException("차단하지 않은 사용자입니다.");
        }

        userBlockRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId);
        log.info("User {} unblocked user {}", blockerId, blockedId);
    }

    /**
     * 차단 토글
     */
    @Transactional
    public UserBlockDto.ToggleResponse toggleBlock(Long blockerId, Long targetUserId) {
        if (blockerId.equals(targetUserId)) {
            throw new BusinessException("자기 자신을 차단할 수 없습니다.");
        }

        boolean isBlocked = userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, targetUserId);

        if (isBlocked) {
            // 차단 해제
            userBlockRepository.deleteByBlockerIdAndBlockedId(blockerId, targetUserId);
            return UserBlockDto.ToggleResponse.builder()
                    .userId(targetUserId)
                    .isBlocked(false)
                    .build();
        } else {
            // 차단
            User blocker = userRepository.findById(blockerId)
                    .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다."));
            User blocked = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new BusinessException("차단할 사용자를 찾을 수 없습니다."));

            UserBlock block = UserBlock.builder()
                    .blocker(blocker)
                    .blocked(blocked)
                    .build();

            userBlockRepository.save(block);
            removeFollowRelationship(blockerId, targetUserId);

            return UserBlockDto.ToggleResponse.builder()
                    .userId(targetUserId)
                    .isBlocked(true)
                    .build();
        }
    }

    /**
     * 차단 목록 조회
     */
    @Transactional(readOnly = true)
    public UserBlockDto.ListResponse getBlockedUsers(Long blockerId, Pageable pageable) {
        Page<UserBlock> blocks = userBlockRepository.findByBlockerId(blockerId, pageable);

        List<UserBlockDto.Response> responses = blocks.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return UserBlockDto.ListResponse.builder()
                .blocks(responses)
                .totalCount(blocks.getTotalElements())
                .hasMore(blocks.hasNext())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build();
    }

    /**
     * 차단 상태 조회
     */
    @Transactional(readOnly = true)
    public UserBlockDto.StatusResponse getBlockStatus(Long userId, Long targetUserId) {
        boolean isBlocked = userBlockRepository.existsByBlockerIdAndBlockedId(userId, targetUserId);
        boolean isBlockedBy = userBlockRepository.existsByBlockerIdAndBlockedId(targetUserId, userId);
        boolean isEitherBlocked = isBlocked || isBlockedBy;

        return UserBlockDto.StatusResponse.builder()
                .userId(targetUserId)
                .isBlocked(isBlocked)
                .isBlockedBy(isBlockedBy)
                .isEitherBlocked(isEitherBlocked)
                .build();
    }

    /**
     * 차단 상태 일괄 조회
     */
    @Transactional(readOnly = true)
    public UserBlockDto.BatchStatusResponse getBatchBlockStatus(Long userId, UserBlockDto.BatchStatusRequest request) {
        List<Long> blockedIds = userBlockRepository.findBlockedUserIdsInUserIds(userId, request.getUserIds());

        Set<Long> blockedSet = new HashSet<>(blockedIds);
        Map<Long, Boolean> statusMap = request.getUserIds().stream()
                .collect(Collectors.toMap(id -> id, blockedSet::contains));

        return UserBlockDto.BatchStatusResponse.builder()
                .blockStatus(statusMap)
                .build();
    }

    /**
     * 차단된 사용자 ID 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Long> getBlockedUserIds(Long userId) {
        return userBlockRepository.findBlockedUserIds(userId);
    }

    /**
     * 나를 차단한 사용자 ID 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Long> getBlockerUserIds(Long userId) {
        return userBlockRepository.findBlockerUserIds(userId);
    }

    /**
     * 양방향 차단 여부 확인
     */
    @Transactional(readOnly = true)
    public boolean isBlockedEitherWay(Long userId1, Long userId2) {
        return userBlockRepository.isBlockedEitherWay(userId1, userId2);
    }

    // === Helper Methods ===

    private void removeFollowRelationship(Long blockerId, Long blockedId) {
        // 서로의 팔로우 관계 모두 제거
        userFollowRepository.deleteByFollowerIdAndFollowingId(blockerId, blockedId);
        userFollowRepository.deleteByFollowerIdAndFollowingId(blockedId, blockerId);
    }

    private UserBlockDto.Response toResponse(UserBlock block) {
        return UserBlockDto.Response.builder()
                .id(block.getId())
                .blockedUser(toUserInfo(block.getBlocked()))
                .reason(block.getReason())
                .createdAt(block.getCreatedAt())
                .build();
    }

    private UserBlockDto.UserInfo toUserInfo(User user) {
        return UserBlockDto.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
