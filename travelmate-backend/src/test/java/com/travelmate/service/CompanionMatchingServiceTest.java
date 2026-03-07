package com.travelmate.service;

import com.travelmate.dto.MatchingDto.*;
import com.travelmate.entity.MatchRequest;
import com.travelmate.entity.MatchRequest.MatchStatus;
import com.travelmate.entity.TravelItinerary;
import com.travelmate.entity.User;
import com.travelmate.entity.User.BudgetPreference;
import com.travelmate.entity.User.TravelStyle;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.MatchRequestRepository;
import com.travelmate.repository.TravelItineraryRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CompanionMatchingService 테스트")
class CompanionMatchingServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private MatchRequestRepository matchRequestRepository;
    @Mock private TravelItineraryRepository travelItineraryRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private CompanionMatchingService matchingService;

    private User requester;
    private User receiver;

    @BeforeEach
    void setUp() {
        requester = new User();
        requester.setId(1L);
        requester.setNickname("requester");
        requester.setIsMatchingEnabled(true);
        requester.setIsActive(true);
        requester.setTravelStyle(TravelStyle.ADVENTURE);
        requester.setBudgetPreference(BudgetPreference.MEDIUM);
        requester.setLanguages(Arrays.asList("Korean", "English"));
        requester.setRating(4.5);
        requester.setReviewCount(10);

        receiver = new User();
        receiver.setId(2L);
        receiver.setNickname("receiver");
        receiver.setIsMatchingEnabled(true);
        receiver.setIsActive(true);
        receiver.setTravelStyle(TravelStyle.NATURE);
        receiver.setBudgetPreference(BudgetPreference.MEDIUM);
        receiver.setLanguages(Arrays.asList("Korean", "Japanese"));
        receiver.setRating(4.0);
        receiver.setReviewCount(5);
    }

    @Nested
    @DisplayName("매칭 추천 조회 - getMatchRecommendations")
    class GetMatchRecommendationsTest {

        @Test
        @DisplayName("성공 - 추천 목록 반환")
        void getMatchRecommendations_Success() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(matchRequestRepository.findMatchedOrRequestedUserIds(1L))
                    .thenReturn(Collections.emptyList());
            when(userRepository.findAll()).thenReturn(List.of(receiver));
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(Collections.emptyList());
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(receiver))
                    .thenReturn(Collections.emptyList());

            List<MatchRecommendation> result = matchingService.getMatchRecommendations(1L, 10);

            assertThat(result).isNotEmpty();
            assertThat(result.get(0).getTotalScore()).isNotNull();
            assertThat(result.get(0).getScoreBreakdown()).isNotNull();
            assertThat(result.get(0).getMatchReasons()).isNotEmpty();
        }

        @Test
        @DisplayName("실패 - 매칭 비활성화 사용자")
        void getMatchRecommendations_MatchingDisabled() {
            requester.setIsMatchingEnabled(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));

            assertThatThrownBy(() -> matchingService.getMatchRecommendations(1L, 10))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 사용자")
        void getMatchRecommendations_UserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> matchingService.getMatchRecommendations(999L, 10))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("성공 - 이미 요청한 사용자 제외")
        void getMatchRecommendations_ExcludesAlreadyRequested() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(matchRequestRepository.findMatchedOrRequestedUserIds(1L))
                    .thenReturn(List.of(2L));
            when(userRepository.findAll()).thenReturn(List.of(receiver));
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(Collections.emptyList());

            List<MatchRecommendation> result = matchingService.getMatchRecommendations(1L, 10);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("성공 - 위치 기반 추천 (위치 활성화)")
        void getMatchRecommendations_WithLocation() {
            requester.setIsLocationEnabled(true);
            requester.setCurrentLatitude(37.5665);
            requester.setCurrentLongitude(126.9780);

            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(matchRequestRepository.findMatchedOrRequestedUserIds(1L))
                    .thenReturn(Collections.emptyList());
            when(userRepository.findNearbyUsers(eq(1L), anyDouble(), anyDouble(), anyDouble()))
                    .thenReturn(List.of(receiver));
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(Collections.emptyList());
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(receiver))
                    .thenReturn(Collections.emptyList());

            List<MatchRecommendation> result = matchingService.getMatchRecommendations(1L, 10);

            assertThat(result).isNotEmpty();
            verify(userRepository).findNearbyUsers(eq(1L), anyDouble(), anyDouble(), anyDouble());
        }
    }

    @Nested
    @DisplayName("매칭 요청 전송 - sendMatchRequest")
    class SendMatchRequestTest {

        @Test
        @DisplayName("성공 - 매칭 요청 전송")
        void sendMatchRequest_Success() {
            SendMatchRequest request = new SendMatchRequest(2L, "같이 여행가요!");
            MatchRequest savedMatchRequest = buildMatchRequest(1L, requester, receiver);

            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(matchRequestRepository.findActiveRequestBetween(1L, 2L))
                    .thenReturn(Optional.empty());
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(Collections.emptyList());
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(receiver))
                    .thenReturn(Collections.emptyList());
            when(matchRequestRepository.save(any(MatchRequest.class)))
                    .thenReturn(savedMatchRequest);
            doNothing().when(notificationService).createAndSendNotification(
                    anyLong(), any(), anyString(), anyString(), anyString(), anyLong(), anyString());

            MatchRequestResponse response = matchingService.sendMatchRequest(1L, request);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(MatchStatus.PENDING);
            verify(matchRequestRepository).save(any(MatchRequest.class));
            verify(notificationService).createAndSendNotification(
                    eq(2L), any(), anyString(), anyString(), anyString(), anyLong(), anyString());
        }

        @Test
        @DisplayName("실패 - 자기 자신에게 요청")
        void sendMatchRequest_SelfMatch() {
            SendMatchRequest request = new SendMatchRequest(1L, "자기 자신에게");

            assertThatThrownBy(() -> matchingService.sendMatchRequest(1L, request))
                    .isInstanceOf(BusinessException.class);
            verify(userRepository, never()).findById(anyLong());
        }

        @Test
        @DisplayName("실패 - 매칭 비활성화 요청자")
        void sendMatchRequest_RequesterMatchingDisabled() {
            requester.setIsMatchingEnabled(false);
            SendMatchRequest request = new SendMatchRequest(2L, "메시지");

            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));

            assertThatThrownBy(() -> matchingService.sendMatchRequest(1L, request))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("실패 - 이미 진행 중인 매칭 요청")
        void sendMatchRequest_DuplicateRequest() {
            SendMatchRequest request = new SendMatchRequest(2L, "중복 요청");
            MatchRequest existingRequest = buildMatchRequest(10L, requester, receiver);

            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(matchRequestRepository.findActiveRequestBetween(1L, 2L))
                    .thenReturn(Optional.of(existingRequest));

            assertThatThrownBy(() -> matchingService.sendMatchRequest(1L, request))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("성공 - 일정 겹침 있으면 schedule 점수 > 12.5")
        void sendMatchRequest_WithScheduleOverlap() {
            LocalDate today = LocalDate.now();
            TravelItinerary it1 = TravelItinerary.builder()
                    .startDate(today).endDate(today.plusDays(5))
                    .owner(requester).title("제주 여행").build();
            TravelItinerary it2 = TravelItinerary.builder()
                    .startDate(today.plusDays(2)).endDate(today.plusDays(7))
                    .owner(receiver).title("제주 여행2").build();

            SendMatchRequest request = new SendMatchRequest(2L, null);
            MatchRequest savedRequest = buildMatchRequest(1L, requester, receiver);

            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(matchRequestRepository.findActiveRequestBetween(1L, 2L))
                    .thenReturn(Optional.empty());
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(List.of(it1));
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(receiver))
                    .thenReturn(List.of(it2));
            when(matchRequestRepository.save(any(MatchRequest.class))).thenReturn(savedRequest);
            doNothing().when(notificationService).createAndSendNotification(
                    anyLong(), any(), anyString(), anyString(), anyString(), anyLong(), anyString());

            matchingService.sendMatchRequest(1L, request);

            verify(matchRequestRepository).save(argThat(mr ->
                    mr.getScheduleOverlapScore() != null
                            && mr.getScheduleOverlapScore().compareTo(BigDecimal.valueOf(12.5)) > 0));
        }
    }

    @Nested
    @DisplayName("매칭 요청 응답 - respondToMatchRequest")
    class RespondToMatchRequestTest {

        @Test
        @DisplayName("성공 - 매칭 수락")
        void respondToMatchRequest_Accept() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);

            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(matchRequest));
            when(matchRequestRepository.save(any(MatchRequest.class))).thenReturn(matchRequest);
            doNothing().when(notificationService).createAndSendNotification(
                    anyLong(), any(), anyString(), anyString(), anyString(), anyLong(), anyString());

            MatchRequestResponse response = matchingService.respondToMatchRequest(2L, 10L, true);

            assertThat(response).isNotNull();
            verify(matchRequestRepository).save(argThat(mr ->
                    mr.getStatus() == MatchStatus.ACCEPTED));
            verify(notificationService).createAndSendNotification(
                    eq(1L), any(), anyString(), anyString(), anyString(), anyLong(), anyString());
        }

        @Test
        @DisplayName("성공 - 매칭 거절")
        void respondToMatchRequest_Reject() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);

            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(matchRequest));
            when(matchRequestRepository.save(any(MatchRequest.class))).thenReturn(matchRequest);
            doNothing().when(notificationService).createAndSendNotification(
                    anyLong(), any(), anyString(), anyString(), anyString(), anyLong(), anyString());

            matchingService.respondToMatchRequest(2L, 10L, false);

            verify(matchRequestRepository).save(argThat(mr ->
                    mr.getStatus() == MatchStatus.REJECTED));
        }

        @Test
        @DisplayName("실패 - 응답 권한 없음")
        void respondToMatchRequest_NoPermission() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(matchRequest));

            assertThatThrownBy(() -> matchingService.respondToMatchRequest(99L, 10L, true))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("실패 - 이미 처리된 요청")
        void respondToMatchRequest_AlreadyProcessed() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            matchRequest.setStatus(MatchStatus.ACCEPTED);
            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(matchRequest));

            assertThatThrownBy(() -> matchingService.respondToMatchRequest(2L, 10L, true))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("실패 - 만료된 매칭 요청")
        void respondToMatchRequest_Expired() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            matchRequest.setExpiresAt(LocalDateTime.now().minusDays(1));
            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(matchRequest));
            when(matchRequestRepository.save(any(MatchRequest.class))).thenReturn(matchRequest);

            assertThatThrownBy(() -> matchingService.respondToMatchRequest(2L, 10L, true))
                    .isInstanceOf(BusinessException.class);
            verify(matchRequestRepository).save(argThat(mr ->
                    mr.getStatus() == MatchStatus.EXPIRED));
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 요청")
        void respondToMatchRequest_NotFound() {
            when(matchRequestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> matchingService.respondToMatchRequest(2L, 999L, true))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("매칭 요청 취소 - cancelMatchRequest")
    class CancelMatchRequestTest {

        @Test
        @DisplayName("성공 - 요청 취소")
        void cancelMatchRequest_Success() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(matchRequest));
            when(matchRequestRepository.save(any(MatchRequest.class))).thenReturn(matchRequest);

            matchingService.cancelMatchRequest(1L, 10L);

            verify(matchRequestRepository).save(argThat(mr ->
                    mr.getStatus() == MatchStatus.CANCELLED));
        }

        @Test
        @DisplayName("실패 - 본인이 아닌 요청 취소")
        void cancelMatchRequest_NotOwner() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(matchRequest));

            assertThatThrownBy(() -> matchingService.cancelMatchRequest(2L, 10L))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("실패 - 대기 중이 아닌 요청 취소")
        void cancelMatchRequest_NotPending() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            matchRequest.setStatus(MatchStatus.ACCEPTED);
            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(matchRequest));

            assertThatThrownBy(() -> matchingService.cancelMatchRequest(1L, 10L))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("조회 메서드")
    class QueryMethodsTest {

        @Test
        @DisplayName("받은 매칭 요청 조회")
        void getReceivedRequests() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            Page<MatchRequest> page = new PageImpl<>(List.of(matchRequest));
            when(matchRequestRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(
                    eq(2L), eq(MatchStatus.PENDING), any())).thenReturn(page);

            Page<MatchRequestResponse> result = matchingService
                    .getReceivedRequests(2L, PageRequest.of(0, 10));

            assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("보낸 매칭 요청 조회")
        void getSentRequests() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            Page<MatchRequest> page = new PageImpl<>(List.of(matchRequest));
            when(matchRequestRepository.findByRequesterIdAndStatusOrderByCreatedAtDesc(
                    eq(1L), eq(MatchStatus.PENDING), any())).thenReturn(page);

            Page<MatchRequestResponse> result = matchingService
                    .getSentRequests(1L, PageRequest.of(0, 10));

            assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("매칭 히스토리 조회")
        void getMatchHistory() {
            MatchRequest matchRequest = buildMatchRequest(10L, requester, receiver);
            matchRequest.setStatus(MatchStatus.ACCEPTED);
            matchRequest.setRespondedAt(LocalDateTime.now());
            when(matchRequestRepository.findAcceptedMatches(1L)).thenReturn(List.of(matchRequest));

            List<MatchHistoryResponse> result = matchingService.getMatchHistory(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getMatchRequestId()).isEqualTo(10L);
            assertThat(result.get(0).getPartner().getNickname()).isEqualTo("receiver");
        }

        @Test
        @DisplayName("대기 중인 매칭 요청 수 조회")
        void getPendingRequestCount() {
            when(matchRequestRepository.countByReceiverIdAndStatus(2L, MatchStatus.PENDING))
                    .thenReturn(3L);

            assertThat(matchingService.getPendingRequestCount(2L)).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("점수 계산 검증")
    class ScoreCalculationTest {

        @Test
        @DisplayName("동일 예산 수준 - 최대 예산 점수(20)")
        void sameBudget_MaxScore() {
            requester.setBudgetPreference(BudgetPreference.MEDIUM);
            receiver.setBudgetPreference(BudgetPreference.MEDIUM);
            setupAndVerifySave(argThat(mr ->
                    mr.getBudgetScore() != null
                            && mr.getBudgetScore().compareTo(BigDecimal.valueOf(20.0)) == 0));
        }

        @Test
        @DisplayName("공통 언어 있음 - 언어 점수 > 최소점수(3)")
        void commonLanguages_AboveMin() {
            setupAndVerifySave(argThat(mr ->
                    mr.getLanguageScore() != null
                            && mr.getLanguageScore().compareTo(BigDecimal.valueOf(3.0)) > 0));
        }

        @Test
        @DisplayName("공통 언어 없음 - 최소 언어 점수(3)")
        void noCommonLanguages_MinScore() {
            requester.setLanguages(List.of("English"));
            receiver.setLanguages(List.of("Japanese"));
            setupAndVerifySave(argThat(mr ->
                    mr.getLanguageScore() != null
                            && mr.getLanguageScore().compareTo(BigDecimal.valueOf(3.0)) == 0));
        }

        @Test
        @DisplayName("높은 평점 - 평점 점수 > 중립점수(5)")
        void highRating_AboveNeutral() {
            receiver.setRating(5.0);
            receiver.setReviewCount(10);
            setupAndVerifySave(argThat(mr ->
                    mr.getRatingScore() != null
                            && mr.getRatingScore().compareTo(BigDecimal.valueOf(5.0)) > 0));
        }

        @Test
        @DisplayName("동일 여행 스타일 - 최대 스타일 점수(30)")
        void sameTravelStyle_MaxScore() {
            requester.setTravelStyle(TravelStyle.CULTURE);
            receiver.setTravelStyle(TravelStyle.CULTURE);
            setupAndVerifySave(argThat(mr ->
                    mr.getTravelStyleScore() != null
                            && mr.getTravelStyleScore().compareTo(BigDecimal.valueOf(30.0)) == 0));
        }

        @Test
        @DisplayName("총점은 0~100 범위")
        void totalScore_WithinRange() {
            setupAndVerifySave(argThat(mr ->
                    mr.getTotalScore() != null
                            && mr.getTotalScore().compareTo(BigDecimal.ZERO) >= 0
                            && mr.getTotalScore().compareTo(BigDecimal.valueOf(100)) <= 0));
        }

        private void setupAndVerifySave(org.mockito.ArgumentMatcher<MatchRequest> matcher) {
            MatchRequest saved = buildMatchRequest(1L, requester, receiver);
            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(matchRequestRepository.findActiveRequestBetween(1L, 2L))
                    .thenReturn(Optional.empty());
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(Collections.emptyList());
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(receiver))
                    .thenReturn(Collections.emptyList());
            when(matchRequestRepository.save(any(MatchRequest.class))).thenReturn(saved);
            doNothing().when(notificationService).createAndSendNotification(
                    anyLong(), any(), anyString(), anyString(), anyString(), anyLong(), anyString());

            matchingService.sendMatchRequest(1L, new SendMatchRequest(2L, null));
            verify(matchRequestRepository).save(argThat(matcher));
        }
    }

    private MatchRequest buildMatchRequest(Long id, User req, User rec) {
        return MatchRequest.builder()
                .id(id)
                .requester(req)
                .receiver(rec)
                .status(MatchStatus.PENDING)
                .totalScore(BigDecimal.valueOf(65))
                .travelStyleScore(BigDecimal.valueOf(20))
                .scheduleOverlapScore(BigDecimal.valueOf(12.5))
                .budgetScore(BigDecimal.valueOf(20))
                .languageScore(BigDecimal.valueOf(7))
                .ratingScore(BigDecimal.valueOf(5.5))
                .expiresAt(LocalDateTime.now().plusDays(7))
                .createdAt(LocalDateTime.now())
                .build();
    }
}
