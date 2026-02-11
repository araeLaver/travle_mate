package com.travelmate.service;

import com.travelmate.dto.MatchingDto;
import com.travelmate.dto.MatchingDto.*;
import com.travelmate.entity.MatchRequest;
import com.travelmate.entity.MatchRequest.MatchStatus;
import com.travelmate.entity.Notification;
import com.travelmate.entity.TravelItinerary;
import com.travelmate.entity.User;
import com.travelmate.entity.User.BudgetPreference;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.MatchRequestRepository;
import com.travelmate.repository.TravelItineraryRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.util.TravelStyleMatcher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanionMatchingService {

    private static final int DEFAULT_MATCH_EXPIRY_DAYS = 7;

    private final UserRepository userRepository;
    private final MatchRequestRepository matchRequestRepository;
    private final TravelItineraryRepository travelItineraryRepository;
    private final NotificationService notificationService;

    // ===== 추천 =====

    @Transactional(readOnly = true)
    @Cacheable(value = "matchRecommendations", key = "#userId + '-' + #limit", unless = "#result.isEmpty()")
    public List<MatchRecommendation> getMatchRecommendations(Long userId, int limit) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        if (!Boolean.TRUE.equals(currentUser.getIsMatchingEnabled())) {
            throw BusinessException.matchingNotEnabled();
        }

        List<Long> excludeIds = matchRequestRepository.findMatchedOrRequestedUserIds(userId);
        excludeIds.add(userId);

        List<User> candidates = getCandidates(currentUser, excludeIds);

        List<TravelItinerary> myItineraries = travelItineraryRepository
                .findByOwnerOrderByStartDateDesc(currentUser);

        return candidates.stream()
                .map(candidate -> buildRecommendation(currentUser, candidate, myItineraries))
                .sorted(Comparator.comparing(MatchRecommendation::getTotalScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    // ===== 매칭 요청 =====

    @Transactional
    @CacheEvict(value = "matchRecommendations", allEntries = true)
    public MatchRequestResponse sendMatchRequest(Long requesterId, SendMatchRequest request) {
        if (requesterId.equals(request.getReceiverId())) {
            throw BusinessException.badRequest("자기 자신에게 매칭 요청을 보낼 수 없습니다.");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> BusinessException.userNotFound(requesterId));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> BusinessException.userNotFound(request.getReceiverId()));

        if (!Boolean.TRUE.equals(requester.getIsMatchingEnabled())) {
            throw BusinessException.matchingNotEnabled();
        }

        matchRequestRepository.findActiveRequestBetween(requesterId, request.getReceiverId())
                .ifPresent(existing -> {
                    throw BusinessException.conflict("이미 진행 중인 매칭 요청이 있습니다.");
                });

        List<TravelItinerary> requesterItineraries = travelItineraryRepository
                .findByOwnerOrderByStartDateDesc(requester);

        MatchScoreBreakdown breakdown = calculateScoreBreakdown(requester, receiver, requesterItineraries);
        BigDecimal totalScore = calculateTotalFromBreakdown(breakdown);

        MatchRequest matchRequest = MatchRequest.builder()
                .requester(requester)
                .receiver(receiver)
                .status(MatchStatus.PENDING)
                .totalScore(totalScore)
                .travelStyleScore(breakdown.getTravelStyleScore())
                .scheduleOverlapScore(breakdown.getScheduleOverlapScore())
                .budgetScore(breakdown.getBudgetScore())
                .languageScore(breakdown.getLanguageScore())
                .ratingScore(breakdown.getRatingScore())
                .message(request.getMessage())
                .expiresAt(LocalDateTime.now().plusDays(DEFAULT_MATCH_EXPIRY_DAYS))
                .build();

        matchRequest = matchRequestRepository.save(matchRequest);

        notificationService.createAndSendNotification(
                receiver.getId(),
                Notification.NotificationType.MATCH_REQUEST,
                "새 매칭 요청",
                requester.getNickname() + "님이 동행 매칭을 요청했습니다.",
                "/matching",
                matchRequest.getId(),
                "MATCH_REQUEST"
        );

        return toMatchRequestResponse(matchRequest);
    }

    // ===== 수락/거절 =====

    @Transactional
    @CacheEvict(value = "matchRecommendations", allEntries = true)
    public MatchRequestResponse respondToMatchRequest(Long userId, Long requestId, boolean accept) {
        MatchRequest matchRequest = matchRequestRepository.findById(requestId)
                .orElseThrow(() -> BusinessException.notFound("매칭 요청을 찾을 수 없습니다."));

        if (!matchRequest.getReceiver().getId().equals(userId)) {
            throw BusinessException.forbidden("해당 매칭 요청에 응답할 권한이 없습니다.");
        }

        if (matchRequest.getStatus() != MatchStatus.PENDING) {
            throw BusinessException.badRequest("이미 처리된 매칭 요청입니다.");
        }

        if (matchRequest.getExpiresAt() != null && matchRequest.getExpiresAt().isBefore(LocalDateTime.now())) {
            matchRequest.setStatus(MatchStatus.EXPIRED);
            matchRequestRepository.save(matchRequest);
            throw BusinessException.badRequest("만료된 매칭 요청입니다.");
        }

        matchRequest.setStatus(accept ? MatchStatus.ACCEPTED : MatchStatus.REJECTED);
        matchRequest.setRespondedAt(LocalDateTime.now());
        matchRequest = matchRequestRepository.save(matchRequest);

        User requester = matchRequest.getRequester();
        User receiver = matchRequest.getReceiver();

        if (accept) {
            notificationService.createAndSendNotification(
                    requester.getId(),
                    Notification.NotificationType.MATCH_ACCEPTED,
                    "매칭 수락",
                    receiver.getNickname() + "님이 동행 매칭을 수락했습니다!",
                    "/matching",
                    matchRequest.getId(),
                    "MATCH_ACCEPTED"
            );
        } else {
            notificationService.createAndSendNotification(
                    requester.getId(),
                    Notification.NotificationType.MATCH_REJECTED,
                    "매칭 거절",
                    "매칭 요청이 거절되었습니다.",
                    "/matching",
                    matchRequest.getId(),
                    "MATCH_REJECTED"
            );
        }

        return toMatchRequestResponse(matchRequest);
    }

    // ===== 요청 취소 =====

    @Transactional
    public void cancelMatchRequest(Long userId, Long requestId) {
        MatchRequest matchRequest = matchRequestRepository.findById(requestId)
                .orElseThrow(() -> BusinessException.notFound("매칭 요청을 찾을 수 없습니다."));

        if (!matchRequest.getRequester().getId().equals(userId)) {
            throw BusinessException.forbidden("본인의 매칭 요청만 취소할 수 있습니다.");
        }

        if (matchRequest.getStatus() != MatchStatus.PENDING) {
            throw BusinessException.badRequest("대기 중인 요청만 취소할 수 있습니다.");
        }

        matchRequest.setStatus(MatchStatus.CANCELLED);
        matchRequestRepository.save(matchRequest);
    }

    // ===== 조회 =====

    @Transactional(readOnly = true)
    public Page<MatchRequestResponse> getReceivedRequests(Long userId, Pageable pageable) {
        return matchRequestRepository
                .findByReceiverIdAndStatusOrderByCreatedAtDesc(userId, MatchStatus.PENDING, pageable)
                .map(this::toMatchRequestResponse);
    }

    @Transactional(readOnly = true)
    public Page<MatchRequestResponse> getSentRequests(Long userId, Pageable pageable) {
        return matchRequestRepository
                .findByRequesterIdAndStatusOrderByCreatedAtDesc(userId, MatchStatus.PENDING, pageable)
                .map(this::toMatchRequestResponse);
    }

    @Transactional(readOnly = true)
    public List<MatchHistoryResponse> getMatchHistory(Long userId) {
        return matchRequestRepository.findAcceptedMatches(userId).stream()
                .map(mr -> {
                    User partner = mr.getRequester().getId().equals(userId)
                            ? mr.getReceiver() : mr.getRequester();
                    return MatchHistoryResponse.builder()
                            .matchRequestId(mr.getId())
                            .partner(toUserSummary(partner))
                            .totalScore(mr.getTotalScore())
                            .scoreBreakdown(MatchScoreBreakdown.builder()
                                    .travelStyleScore(mr.getTravelStyleScore())
                                    .scheduleOverlapScore(mr.getScheduleOverlapScore())
                                    .budgetScore(mr.getBudgetScore())
                                    .languageScore(mr.getLanguageScore())
                                    .ratingScore(mr.getRatingScore())
                                    .build())
                            .matchedAt(mr.getRespondedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getPendingRequestCount(Long userId) {
        return matchRequestRepository.countByReceiverIdAndStatus(userId, MatchStatus.PENDING);
    }

    // ===== 호환성 점수 계산 =====

    private MatchScoreBreakdown calculateScoreBreakdown(User user1, User user2,
                                                         List<TravelItinerary> user1Itineraries) {
        BigDecimal travelStyleScore = BigDecimal.valueOf(
                TravelStyleMatcher.calculateCompatibilityScore(user1.getTravelStyle(), user2.getTravelStyle())
        ).setScale(2, RoundingMode.HALF_UP);

        BigDecimal scheduleScore = calculateScheduleOverlapScore(user1Itineraries, user2);
        BigDecimal budgetScore = calculateBudgetScore(user1.getBudgetPreference(), user2.getBudgetPreference());
        BigDecimal languageScore = calculateLanguageScore(user1.getLanguages(), user2.getLanguages());
        BigDecimal ratingScore = calculateRatingScore(user2);

        return MatchScoreBreakdown.builder()
                .travelStyleScore(travelStyleScore)
                .scheduleOverlapScore(scheduleScore)
                .budgetScore(budgetScore)
                .languageScore(languageScore)
                .ratingScore(ratingScore)
                .build();
    }

    private BigDecimal calculateScheduleOverlapScore(List<TravelItinerary> user1Itineraries, User user2) {
        if (user1Itineraries == null || user1Itineraries.isEmpty()) {
            return BigDecimal.valueOf(12.5); // 중립점수
        }

        List<TravelItinerary> user2Itineraries = travelItineraryRepository
                .findByOwnerOrderByStartDateDesc(user2);

        if (user2Itineraries.isEmpty()) {
            return BigDecimal.valueOf(12.5);
        }

        long maxOverlapDays = 0;
        for (TravelItinerary it1 : user1Itineraries) {
            for (TravelItinerary it2 : user2Itineraries) {
                long overlap = calculateOverlapDays(it1.getStartDate(), it1.getEndDate(),
                        it2.getStartDate(), it2.getEndDate());
                maxOverlapDays = Math.max(maxOverlapDays, overlap);
            }
        }

        double score = Math.min(25.0, maxOverlapDays * 2.5);
        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
    }

    private long calculateOverlapDays(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        LocalDate overlapStart = start1.isAfter(start2) ? start1 : start2;
        LocalDate overlapEnd = end1.isBefore(end2) ? end1 : end2;
        long days = ChronoUnit.DAYS.between(overlapStart, overlapEnd) + 1;
        return Math.max(0, days);
    }

    private BigDecimal calculateBudgetScore(BudgetPreference bp1, BudgetPreference bp2) {
        if (bp1 == null || bp2 == null) {
            return BigDecimal.valueOf(10); // 중립점수
        }
        int distance = Math.abs(bp1.ordinal() - bp2.ordinal());
        double score = switch (distance) {
            case 0 -> 20.0;
            case 1 -> 14.0;
            case 2 -> 8.0;
            default -> 2.0;
        };
        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateLanguageScore(List<String> langs1, List<String> langs2) {
        if (langs1 == null || langs1.isEmpty() || langs2 == null || langs2.isEmpty()) {
            return BigDecimal.valueOf(7.5); // 중립점수
        }

        Set<String> set1 = new HashSet<>(langs1);
        Set<String> set2 = new HashSet<>(langs2);

        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        if (union.isEmpty()) {
            return BigDecimal.valueOf(3);
        }

        double jaccard = (double) intersection.size() / union.size();

        if (intersection.isEmpty()) {
            return BigDecimal.valueOf(3).setScale(2, RoundingMode.HALF_UP);
        }

        double score = jaccard * 12.0 + 3.0;
        return BigDecimal.valueOf(Math.min(15.0, score)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateRatingScore(User user) {
        Double rating = user.getRating();
        Integer reviewCount = user.getReviewCount();

        if (rating == null || reviewCount == null || reviewCount == 0) {
            return BigDecimal.valueOf(5); // 중립점수
        }

        double ratingPart = (rating / 5.0) * 8.0;
        double reviewPart = Math.min(2.0, reviewCount * 0.2);
        double score = ratingPart + reviewPart;

        return BigDecimal.valueOf(Math.min(10.0, score)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTotalFromBreakdown(MatchScoreBreakdown breakdown) {
        return breakdown.getTravelStyleScore()
                .add(breakdown.getScheduleOverlapScore())
                .add(breakdown.getBudgetScore())
                .add(breakdown.getLanguageScore())
                .add(breakdown.getRatingScore());
    }

    // ===== 후보 조회 =====

    private List<User> getCandidates(User currentUser, List<Long> excludeIds) {
        if (Boolean.TRUE.equals(currentUser.getIsLocationEnabled())
                && currentUser.getCurrentLatitude() != null
                && currentUser.getCurrentLongitude() != null) {
            List<User> nearbyUsers = userRepository.findNearbyUsers(
                    currentUser.getId(),
                    currentUser.getCurrentLatitude(),
                    currentUser.getCurrentLongitude(),
                    50.0
            );
            return nearbyUsers.stream()
                    .filter(u -> !excludeIds.contains(u.getId()))
                    .collect(Collectors.toList());
        }

        // 위치 비활성화 시 매칭 활성화된 전체 사용자 중 선택
        return userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsMatchingEnabled()))
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> !excludeIds.contains(u.getId()))
                .limit(100)
                .collect(Collectors.toList());
    }

    // ===== 매칭 이유 생성 =====

    private List<String> generateMatchReasons(MatchScoreBreakdown breakdown, User candidate) {
        List<String> reasons = new ArrayList<>();

        if (breakdown.getTravelStyleScore().compareTo(BigDecimal.valueOf(25)) >= 0) {
            reasons.add("여행 스타일이 잘 맞아요!");
        }
        if (breakdown.getScheduleOverlapScore().compareTo(BigDecimal.valueOf(15)) >= 0) {
            reasons.add("일정이 겹치는 기간이 있어요!");
        }
        if (breakdown.getBudgetScore().compareTo(BigDecimal.valueOf(15)) >= 0) {
            reasons.add("예산 수준이 비슷해요!");
        }
        if (breakdown.getLanguageScore().compareTo(BigDecimal.valueOf(10)) >= 0) {
            reasons.add("공통 언어가 있어요!");
        }
        if (breakdown.getRatingScore().compareTo(BigDecimal.valueOf(7)) >= 0) {
            reasons.add("높은 사용자 평점을 가지고 있어요!");
        }

        if (reasons.isEmpty()) {
            reasons.add("새로운 여행 동반자를 만나보세요!");
        }

        return reasons;
    }

    // ===== DTO 변환 =====

    private MatchRecommendation buildRecommendation(User currentUser, User candidate,
                                                     List<TravelItinerary> myItineraries) {
        MatchScoreBreakdown breakdown = calculateScoreBreakdown(currentUser, candidate, myItineraries);
        BigDecimal totalScore = calculateTotalFromBreakdown(breakdown);

        return MatchRecommendation.builder()
                .user(toUserSummary(candidate))
                .totalScore(totalScore)
                .scoreBreakdown(breakdown)
                .matchReasons(generateMatchReasons(breakdown, candidate))
                .build();
    }

    private MatchUserSummary toUserSummary(User user) {
        return MatchUserSummary.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .travelStyle(user.getTravelStyle() != null ? user.getTravelStyle().name() : null)
                .bio(user.getBio())
                .age(user.getAge())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .languages(user.getLanguages())
                .interests(user.getInterests())
                .rating(user.getRating())
                .reviewCount(user.getReviewCount())
                .budgetPreference(user.getBudgetPreference() != null ? user.getBudgetPreference().name() : null)
                .build();
    }

    private MatchRequestResponse toMatchRequestResponse(MatchRequest mr) {
        return MatchRequestResponse.builder()
                .id(mr.getId())
                .requester(toUserSummary(mr.getRequester()))
                .receiver(toUserSummary(mr.getReceiver()))
                .status(mr.getStatus())
                .totalScore(mr.getTotalScore())
                .scoreBreakdown(MatchScoreBreakdown.builder()
                        .travelStyleScore(mr.getTravelStyleScore())
                        .scheduleOverlapScore(mr.getScheduleOverlapScore())
                        .budgetScore(mr.getBudgetScore())
                        .languageScore(mr.getLanguageScore())
                        .ratingScore(mr.getRatingScore())
                        .build())
                .message(mr.getMessage())
                .expiresAt(mr.getExpiresAt())
                .respondedAt(mr.getRespondedAt())
                .createdAt(mr.getCreatedAt())
                .build();
    }
}
