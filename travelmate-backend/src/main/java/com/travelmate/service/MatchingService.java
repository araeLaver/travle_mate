package com.travelmate.service;

import com.travelmate.dto.MatchingHistoryDto;
import com.travelmate.dto.MatchingHistoryDto.MatchDirection;
import com.travelmate.dto.MatchingRequestDto;
import com.travelmate.dto.UserSummaryDto;
import com.travelmate.entity.MatchingRequest;
import com.travelmate.entity.MatchingRequest.MatchingStatus;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.MatchingRequestRepository;
import com.travelmate.repository.UserBlockRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 동반자 매칭 서비스
 *
 * 주요 기능:
 *   - getRecommendations: 호환성 점수 기반 추천 목록 (차단/이미 요청한 사용자 제외)
 *   - sendMatchingRequest: PENDING 상태로 매칭 요청 저장
 *   - acceptMatchingRequest: 요청 ACCEPTED 처리 및 respondedAt 설정
 *   - rejectMatchingRequest: 요청 REJECTED 처리 및 respondedAt 설정
 *   - getMatchingHistory: ACCEPTED 된 매칭 히스토리 페이징 조회
 *   - getReceivedRequests: 받은 PENDING 요청 조회
 *   - getSentRequests: 보낸 PENDING 요청 조회
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

    private final UserRepository userRepository;
    private final MatchingRequestRepository matchingRequestRepository;
    private final UserBlockRepository userBlockRepository;
    private final CompatibilityScoreService compatibilityScoreService;

    // ===== 추천 목록 =====

    /**
     * 호환성 점수 기반 동반자 추천 목록 조회
     *
     * - 모든 활성 사용자에 대해 호환성 점수 계산
     * - 점수 내림차순 정렬
     * - 이미 요청 보낸 사용자, 차단 사용자 제외
     *
     * @param userId   기준 사용자 ID
     * @param pageable 페이지 정보
     * @return 추천 사용자 목록 (UserSummaryDto, compatibilityScore 포함)
     */
    @Transactional(readOnly = true)
    public Page<UserSummaryDto> getRecommendations(Long userId, Pageable pageable) {
        User currentUser = findUserOrThrow(userId);

        // 제외할 사용자 ID 수집: 자기 자신 + 이미 상호작용한 사용자 + 차단 관계 사용자
        List<Long> alreadyInteracted = matchingRequestRepository.findAlreadyInteractedUserIds(userId);
        List<Long> blockedByMe = userBlockRepository.findBlockedUserIds(userId);
        List<Long> blockedMe = userBlockRepository.findBlockerUserIds(userId);

        List<Long> excludeIds = new ArrayList<>();
        excludeIds.add(userId);
        excludeIds.addAll(alreadyInteracted);
        excludeIds.addAll(blockedByMe);
        excludeIds.addAll(blockedMe);

        // 매칭 활성화된 활성 사용자 전체 조회 (후보군)
        List<User> candidates = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> Boolean.TRUE.equals(u.getIsMatchingEnabled()))
                .filter(u -> !excludeIds.contains(u.getId()))
                .collect(Collectors.toList());

        // 호환성 점수 계산 후 내림차순 정렬
        List<UserSummaryDto> scored = candidates.stream()
                .map(candidate -> {
                    double score = compatibilityScoreService.calculateTotalScore(currentUser, candidate);
                    return toUserSummaryDto(candidate, score);
                })
                .sorted(Comparator.comparingDouble(UserSummaryDto::getCompatibilityScore).reversed())
                .collect(Collectors.toList());

        // 수동 페이징 처리
        return toPage(scored, pageable);
    }

    // ===== 매칭 요청 전송 =====

    /**
     * 매칭 요청 전송 (PENDING 상태로 저장)
     *
     * @param fromUserId 요청자 ID
     * @param toUserId   대상 사용자 ID
     * @return 생성된 매칭 요청 DTO
     */
    @Transactional
    public MatchingRequestDto.Response sendMatchingRequest(Long fromUserId, Long toUserId) {
        if (fromUserId.equals(toUserId)) {
            throw BusinessException.badRequest("자기 자신에게 매칭 요청을 보낼 수 없습니다.");
        }

        User fromUser = findUserOrThrow(fromUserId);
        User toUser = findUserOrThrow(toUserId);

        // 차단 관계 확인 (양방향)
        if (userBlockRepository.isBlockedEitherWay(fromUserId, toUserId)) {
            throw BusinessException.forbidden("차단 관계인 사용자에게는 매칭 요청을 보낼 수 없습니다.");
        }

        // 이미 진행 중인 요청 확인
        if (matchingRequestRepository.existsActiveRequestBetween(fromUserId, toUserId)) {
            throw BusinessException.conflict("이미 진행 중인 매칭 요청이 있습니다.");
        }

        // 호환성 점수 계산
        double compatibilityScore = compatibilityScoreService.calculateTotalScore(fromUser, toUser);

        MatchingRequest request = MatchingRequest.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .status(MatchingStatus.PENDING)
                .compatibilityScore(compatibilityScore)
                .build();

        MatchingRequest saved = matchingRequestRepository.save(request);
        log.info("매칭 요청 생성: fromUser={}, toUser={}, score={}", fromUserId, toUserId, compatibilityScore);

        return toMatchingRequestResponse(saved);
    }

    // ===== 매칭 요청 수락 =====

    /**
     * 매칭 요청 수락
     * - 대상 사용자(toUser)만 수락 가능
     * - status ACCEPTED, respondedAt 현재 시각으로 설정
     *
     * @param requestId 매칭 요청 ID
     * @param userId    수락하는 사용자 ID (toUser 여야 함)
     * @return 갱신된 매칭 요청 DTO
     */
    @Transactional
    public MatchingRequestDto.Response acceptMatchingRequest(Long requestId, Long userId) {
        MatchingRequest request = findMatchingRequestOrThrow(requestId);

        validateResponder(request, userId);
        validatePendingStatus(request);

        request.setStatus(MatchingStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        MatchingRequest updated = matchingRequestRepository.save(request);

        log.info("매칭 요청 수락: requestId={}, toUser={}", requestId, userId);
        return toMatchingRequestResponse(updated);
    }

    // ===== 매칭 요청 거절 =====

    /**
     * 매칭 요청 거절
     * - 대상 사용자(toUser)만 거절 가능
     * - status REJECTED, respondedAt 현재 시각으로 설정
     *
     * @param requestId 매칭 요청 ID
     * @param userId    거절하는 사용자 ID (toUser 여야 함)
     * @return 갱신된 매칭 요청 DTO
     */
    @Transactional
    public MatchingRequestDto.Response rejectMatchingRequest(Long requestId, Long userId) {
        MatchingRequest request = findMatchingRequestOrThrow(requestId);

        validateResponder(request, userId);
        validatePendingStatus(request);

        request.setStatus(MatchingStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        MatchingRequest updated = matchingRequestRepository.save(request);

        log.info("매칭 요청 거절: requestId={}, toUser={}", requestId, userId);
        return toMatchingRequestResponse(updated);
    }

    // ===== 받은 요청 조회 =====

    /**
     * 받은 매칭 요청 목록 조회 (PENDING 상태)
     *
     * @param userId   사용자 ID
     * @param pageable 페이지 정보
     * @return PENDING 상태의 받은 요청 목록
     */
    @Transactional(readOnly = true)
    public Page<MatchingRequestDto.Response> getReceivedRequests(Long userId, Pageable pageable) {
        return matchingRequestRepository
                .findByToUserIdAndStatusOrderByCreatedAtDesc(userId, MatchingStatus.PENDING, pageable)
                .map(this::toMatchingRequestResponse);
    }

    // ===== 보낸 요청 조회 =====

    /**
     * 보낸 매칭 요청 목록 조회 (PENDING 상태)
     *
     * @param userId   사용자 ID
     * @param pageable 페이지 정보
     * @return PENDING 상태의 보낸 요청 목록
     */
    @Transactional(readOnly = true)
    public Page<MatchingRequestDto.Response> getSentRequests(Long userId, Pageable pageable) {
        return matchingRequestRepository
                .findByFromUserIdAndStatusOrderByCreatedAtDesc(userId, MatchingStatus.PENDING, pageable)
                .map(this::toMatchingRequestResponse);
    }

    // ===== 매칭 히스토리 =====

    /**
     * 매칭 히스토리 조회 - ACCEPTED 상태이며 from 또는 to가 userId인 요청
     *
     * @param userId   사용자 ID
     * @param pageable 페이지 정보
     * @return ACCEPTED 된 매칭 히스토리 목록
     */
    @Transactional(readOnly = true)
    public Page<MatchingHistoryDto> getMatchingHistory(Long userId, Pageable pageable) {
        return matchingRequestRepository
                .findAcceptedMatchHistory(userId, pageable)
                .map(mr -> toMatchingHistoryDto(mr, userId));
    }

    // ===== 매칭 요청 취소 =====

    /**
     * 매칭 요청 취소 (요청자 본인만 가능, PENDING → CANCELLED)
     *
     * @param userId    취소하는 사용자 ID (fromUser 여야 함)
     * @param requestId 매칭 요청 ID
     */
    @Transactional
    public void cancelMatchingRequest(Long userId, Long requestId) {
        MatchingRequest request = findMatchingRequestOrThrow(requestId);

        if (!request.getFromUser().getId().equals(userId)) {
            throw BusinessException.forbidden("본인의 매칭 요청만 취소할 수 있습니다.");
        }

        validatePendingStatus(request);

        request.setStatus(MatchingStatus.CANCELLED);
        matchingRequestRepository.save(request);
        log.info("매칭 요청 취소: requestId={}, fromUser={}", requestId, userId);
    }

    // ===== 대기 요청 수 =====

    /**
     * 받은 PENDING 매칭 요청 수 조회
     *
     * @param userId 사용자 ID
     * @return PENDING 상태인 받은 요청 수
     */
    @Transactional(readOnly = true)
    public long getPendingRequestCount(Long userId) {
        return matchingRequestRepository.countByToUserIdAndStatus(userId, MatchingStatus.PENDING);
    }

    // ===== 내부 변환 메서드 =====

    private UserSummaryDto toUserSummaryDto(User user, double score) {
        return UserSummaryDto.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .travelStyle(user.getTravelStyle() != null ? user.getTravelStyle().name() : null)
                .bio(user.getBio())
                .age(user.getAge())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .languages(user.getLanguages() != null ? new ArrayList<>(user.getLanguages()) : null)
                .interests(user.getInterests() != null ? new ArrayList<>(user.getInterests()) : null)
                .rating(user.getRating())
                .reviewCount(user.getReviewCount())
                .budgetPreference(user.getBudgetPreference() != null ? user.getBudgetPreference().name() : null)
                .compatibilityScore(score)
                .build();
    }

    private UserSummaryDto toUserSummaryDto(User user) {
        return toUserSummaryDto(user, 0.0);
    }

    private MatchingRequestDto.Response toMatchingRequestResponse(MatchingRequest mr) {
        return MatchingRequestDto.Response.builder()
                .id(mr.getId())
                .fromUser(toUserSummaryDto(mr.getFromUser()))
                .toUser(toUserSummaryDto(mr.getToUser()))
                .status(mr.getStatus())
                .compatibilityScore(mr.getCompatibilityScore())
                .createdAt(mr.getCreatedAt())
                .respondedAt(mr.getRespondedAt())
                .build();
    }

    private MatchingHistoryDto toMatchingHistoryDto(MatchingRequest mr, Long userId) {
        boolean isSender = mr.getFromUser().getId().equals(userId);
        User partner = isSender ? mr.getToUser() : mr.getFromUser();

        return MatchingHistoryDto.builder()
                .matchingRequestId(mr.getId())
                .partner(toUserSummaryDto(partner))
                .direction(isSender ? MatchDirection.SENT : MatchDirection.RECEIVED)
                .compatibilityScore(mr.getCompatibilityScore())
                .matchedAt(mr.getRespondedAt())
                .createdAt(mr.getCreatedAt())
                .build();
    }

    // ===== 내부 유틸리티 =====

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));
    }

    private MatchingRequest findMatchingRequestOrThrow(Long requestId) {
        return matchingRequestRepository.findById(requestId)
                .orElseThrow(() -> BusinessException.notFound("매칭 요청을 찾을 수 없습니다. ID: " + requestId));
    }

    /**
     * 응답자가 toUser인지 검증
     */
    private void validateResponder(MatchingRequest request, Long userId) {
        if (!request.getToUser().getId().equals(userId)) {
            throw BusinessException.forbidden("해당 매칭 요청에 응답할 권한이 없습니다.");
        }
    }

    /**
     * PENDING 상태인지 검증
     */
    private void validatePendingStatus(MatchingRequest request) {
        if (request.getStatus() != MatchingStatus.PENDING) {
            throw BusinessException.badRequest("이미 처리된 매칭 요청입니다. 현재 상태: " + request.getStatus());
        }
    }

    /**
     * List를 Page로 변환 (수동 페이징)
     */
    private <T> Page<T> toPage(List<T> list, Pageable pageable) {
        int pageSize = pageable.getPageSize();
        int pageNumber = pageable.getPageNumber();
        int start = pageNumber * pageSize;
        int end = Math.min(start + pageSize, list.size());

        if (start >= list.size()) {
            return new org.springframework.data.domain.PageImpl<>(
                    List.of(), pageable, list.size());
        }

        return new org.springframework.data.domain.PageImpl<>(
                list.subList(start, end), pageable, list.size());
    }
}
