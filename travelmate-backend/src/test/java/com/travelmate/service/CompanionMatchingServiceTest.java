package com.travelmate.service;

import com.travelmate.dto.MatchingDto.MatchRequestResponse;
import com.travelmate.dto.MatchingDto.MatchScoreBreakdown;
import com.travelmate.dto.MatchingDto.SendMatchRequest;
import com.travelmate.entity.MatchRequest;
import com.travelmate.entity.MatchRequest.MatchStatus;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * CompanionMatchingService 단위 테스트 (v0.2)
 *
 * <p>핵심 시나리오:</p>
 * <ul>
 *   <li>48시간 재요청 방지 — 쿨다운 내 재요청 시 CONFLICT 예외</li>
 *   <li>24시간 만료 요청 응답 시 CANCELLED 전이 후 예외</li>
 *   <li>이미 처리된 요청에 응답 시 상태머신 예외 → BAD_REQUEST</li>
 *   <li>자동 취소 스케줄러 bulkCancelExpiredRequests 호출 검증</li>
 *   <li>요청 expiresAt 이 24시간으로 설정되는지 검증</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CompanionMatchingService v0.2 테스트")
class CompanionMatchingServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private MatchRequestRepository matchRequestRepository;
    @Mock private TravelItineraryRepository travelItineraryRepository;
    @Mock private NotificationService notificationService;
    @Mock private CompatibilityScoreService compatibilityScoreService;

    @InjectMocks
    private CompanionMatchingService service;

    private User requester;
    private User receiver;

    @BeforeEach
    void setUp() {
        requester = buildUser(1L, "requester", true);
        receiver  = buildUser(2L, "receiver",  true);
    }

    private User buildUser(Long id, String nickname, boolean matchingEnabled) {
        User u = new User();
        u.setId(id);
        u.setNickname(nickname);
        u.setIsMatchingEnabled(matchingEnabled);
        u.setIsActive(true);
        u.setTravelStyle(TravelStyle.ADVENTURE);
        u.setBudgetPreference(BudgetPreference.MEDIUM);
        u.setLanguages(List.of("ko"));
        u.setRating(4.0);
        u.setReviewCount(5);
        return u;
    }

    private MatchScoreBreakdown dummyBreakdown() {
        return MatchScoreBreakdown.builder()
                .travelStyleScore(BigDecimal.valueOf(30))
                .scheduleOverlapScore(BigDecimal.valueOf(25))
                .budgetScore(BigDecimal.valueOf(20))
                .languageScore(BigDecimal.valueOf(15))
                .ratingScore(BigDecimal.valueOf(10))
                .build();
    }

    private MatchRequest buildSavedRequest(Long id, MatchStatus status, LocalDateTime expiresAt) {
        return MatchRequest.builder()
                .id(id)
                .requester(requester)
                .receiver(receiver)
                .status(status)
                .expiresAt(expiresAt)
                .totalScore(BigDecimal.valueOf(100))
                .travelStyleScore(BigDecimal.valueOf(30))
                .scheduleOverlapScore(BigDecimal.valueOf(25))
                .budgetScore(BigDecimal.valueOf(20))
                .languageScore(BigDecimal.valueOf(15))
                .ratingScore(BigDecimal.valueOf(10))
                .build();
    }

    // -----------------------------------------------------------------------
    // sendMatchRequest: 48시간 재요청 방지
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("sendMatchRequest — 48시간 재요청 방지")
    class RerequestCooldownTests {

        @Test
        @DisplayName("48시간 이내에 종료된 이력 존재 시 CONFLICT 예외")
        void recentClosedRequest_throwsConflict() {
            SendMatchRequest req = new SendMatchRequest(2L, "안녕하세요");

            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(matchRequestRepository.existsActiveRequestBetween(1L, 2L)).thenReturn(false);

            MatchRequest recentClosed = buildSavedRequest(5L, MatchStatus.CANCELLED,
                    LocalDateTime.now().minusHours(10));
            recentClosed.setUpdatedAt(LocalDateTime.now().minusHours(10)); // 10시간 전 CANCELLED

            when(matchRequestRepository.findRecentClosedRequestBetween(
                    eq(1L), eq(2L), any(LocalDateTime.class)))
                    .thenReturn(Optional.of(recentClosed));

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> service.sendMatchRequest(1L, req))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("48시간")
                    .satisfies(e -> assertThat(((BusinessException) e).getStatus().value()).isEqualTo(409));
        }

        @Test
        @DisplayName("48시간 초과 후에는 재요청 가능")
        void cooldownPassed_requestSucceeds() {
            SendMatchRequest req = new SendMatchRequest(2L, "다시 요청합니다");

            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(matchRequestRepository.existsActiveRequestBetween(1L, 2L)).thenReturn(false);
            when(matchRequestRepository.findRecentClosedRequestBetween(
                    eq(1L), eq(2L), any(LocalDateTime.class)))
                    .thenReturn(Optional.empty()); // 쿨다운 없음

            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(Collections.emptyList());

            MatchScoreBreakdown breakdown = dummyBreakdown();
            when(compatibilityScoreService.calculate(any(), any(), any()))
                    .thenReturn(breakdown);
            when(compatibilityScoreService.sumBreakdown(any()))
                    .thenReturn(BigDecimal.valueOf(100));

            MatchRequest saved = buildSavedRequest(99L, MatchStatus.REQUESTED,
                    LocalDateTime.now().plusHours(24));
            when(matchRequestRepository.save(any(MatchRequest.class))).thenReturn(saved);

            MatchRequestResponse response = service.sendMatchRequest(1L, req);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(MatchStatus.REQUESTED);
        }
    }

    // -----------------------------------------------------------------------
    // sendMatchRequest: expiresAt = 24시간 검증
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("sendMatchRequest — expiresAt 24시간 설정")
    class ExpiresAtTests {

        @Test
        @DisplayName("저장되는 MatchRequest 의 expiresAt 은 현재 시각 + 24시간 이내")
        void expiresAt_set_to_24hours() {
            SendMatchRequest req = new SendMatchRequest(2L, null);

            when(userRepository.findById(1L)).thenReturn(Optional.of(requester));
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiver));
            when(matchRequestRepository.existsActiveRequestBetween(1L, 2L)).thenReturn(false);
            when(matchRequestRepository.findRecentClosedRequestBetween(
                    eq(1L), eq(2L), any())).thenReturn(Optional.empty());
            when(travelItineraryRepository.findByOwnerOrderByStartDateDesc(requester))
                    .thenReturn(Collections.emptyList());
            when(compatibilityScoreService.calculate(any(), any(), any())).thenReturn(dummyBreakdown());
            when(compatibilityScoreService.sumBreakdown(any())).thenReturn(BigDecimal.valueOf(100));

            ArgumentCaptor<MatchRequest> captor = ArgumentCaptor.forClass(MatchRequest.class);
            MatchRequest saved = buildSavedRequest(1L, MatchStatus.REQUESTED,
                    LocalDateTime.now().plusHours(24));
            when(matchRequestRepository.save(captor.capture())).thenReturn(saved);

            service.sendMatchRequest(1L, req);

            MatchRequest captured = captor.getValue();
            LocalDateTime expectedExpiry = LocalDateTime.now().plusHours(24);

            assertThat(captured.getExpiresAt())
                    .isAfter(LocalDateTime.now().plusHours(23).plusMinutes(55))
                    .isBefore(LocalDateTime.now().plusHours(24).plusMinutes(5));
        }
    }

    // -----------------------------------------------------------------------
    // respondToMatchRequest: 만료 요청 처리
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("respondToMatchRequest — 24시간 만료 처리")
    class ExpiredResponseTests {

        @Test
        @DisplayName("expiresAt 이 지난 REQUESTED 요청에 응답 시 CANCELLED 전이 후 BAD_REQUEST")
        void expiredRequest_cancelledAndThrows() {
            MatchRequest expired = buildSavedRequest(10L, MatchStatus.REQUESTED,
                    LocalDateTime.now().minusHours(1)); // 이미 만료

            when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(expired));

            assertThatThrownBy(() -> service.respondToMatchRequest(2L, 10L, true))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("24시간");

            // 상태가 CANCELLED 로 변경되었는지 확인
            assertThat(expired.getStatus()).isEqualTo(MatchStatus.CANCELLED);
            verify(matchRequestRepository).save(expired);
        }

        @Test
        @DisplayName("이미 MATCHED 된 요청에 응답 시 BAD_REQUEST (상태머신 전이 불가)")
        void alreadyMatchedRequest_throwsBadRequest() {
            MatchRequest matched = buildSavedRequest(20L, MatchStatus.MATCHED,
                    LocalDateTime.now().plusHours(10));

            when(matchRequestRepository.findById(20L)).thenReturn(Optional.of(matched));

            assertThatThrownBy(() -> service.respondToMatchRequest(2L, 20L, false))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getStatus().value()).isEqualTo(400));
        }
    }

    // -----------------------------------------------------------------------
    // respondToMatchRequest: 정상 수락/거절
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("respondToMatchRequest — 정상 수락/거절")
    class RespondTests {

        @Test
        @DisplayName("수락 시 MATCHED 상태로 전이 및 알림 발송")
        void accept_matchedStatusAndNotification() {
            MatchRequest pending = buildSavedRequest(30L, MatchStatus.REQUESTED,
                    LocalDateTime.now().plusHours(20));

            when(matchRequestRepository.findById(30L)).thenReturn(Optional.of(pending));
            when(matchRequestRepository.save(any())).thenReturn(pending);

            MatchRequestResponse response = service.respondToMatchRequest(2L, 30L, true);

            assertThat(pending.getStatus()).isEqualTo(MatchStatus.MATCHED);
            verify(notificationService).createAndSendNotification(
                    eq(1L), any(), contains("수락"), any(), any(), eq(30L), eq("MATCH_ACCEPTED"));
        }

        @Test
        @DisplayName("거절 시 REJECTED 상태로 전이 및 알림 발송")
        void reject_rejectedStatusAndNotification() {
            MatchRequest pending = buildSavedRequest(31L, MatchStatus.REQUESTED,
                    LocalDateTime.now().plusHours(20));

            when(matchRequestRepository.findById(31L)).thenReturn(Optional.of(pending));
            when(matchRequestRepository.save(any())).thenReturn(pending);

            service.respondToMatchRequest(2L, 31L, false);

            assertThat(pending.getStatus()).isEqualTo(MatchStatus.REJECTED);
            verify(notificationService).createAndSendNotification(
                    eq(1L), any(), contains("거절"), any(), any(), eq(31L), eq("MATCH_REJECTED"));
        }

        @Test
        @DisplayName("권한 없는 사용자가 응답 시 FORBIDDEN 예외")
        void wrongUser_throwsForbidden() {
            MatchRequest pending = buildSavedRequest(32L, MatchStatus.REQUESTED,
                    LocalDateTime.now().plusHours(20));

            when(matchRequestRepository.findById(32L)).thenReturn(Optional.of(pending));

            assertThatThrownBy(() -> service.respondToMatchRequest(999L, 32L, true))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getStatus().value()).isEqualTo(403));
        }
    }

    // -----------------------------------------------------------------------
    // cancelMatchRequest: 상태머신 검증
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("cancelMatchRequest — 상태머신 검증")
    class CancelTests {

        @Test
        @DisplayName("REQUESTED 상태인 본인 요청 취소 성공")
        void cancel_requestedStatus_succeeds() {
            MatchRequest pending = buildSavedRequest(40L, MatchStatus.REQUESTED,
                    LocalDateTime.now().plusHours(20));

            when(matchRequestRepository.findById(40L)).thenReturn(Optional.of(pending));

            service.cancelMatchRequest(1L, 40L);

            assertThat(pending.getStatus()).isEqualTo(MatchStatus.CANCELLED);
            verify(matchRequestRepository).save(pending);
        }

        @Test
        @DisplayName("이미 MATCHED 된 요청 취소 시 BAD_REQUEST")
        void cancel_alreadyMatched_throwsBadRequest() {
            MatchRequest matched = buildSavedRequest(41L, MatchStatus.MATCHED,
                    LocalDateTime.now().plusHours(10));

            when(matchRequestRepository.findById(41L)).thenReturn(Optional.of(matched));

            assertThatThrownBy(() -> service.cancelMatchRequest(1L, 41L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getStatus().value()).isEqualTo(400));
        }

        @Test
        @DisplayName("타인의 요청 취소 시 FORBIDDEN 예외")
        void cancel_notOwner_throwsForbidden() {
            MatchRequest pending = buildSavedRequest(42L, MatchStatus.REQUESTED,
                    LocalDateTime.now().plusHours(20));

            when(matchRequestRepository.findById(42L)).thenReturn(Optional.of(pending));

            assertThatThrownBy(() -> service.cancelMatchRequest(999L, 42L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getStatus().value()).isEqualTo(403));
        }
    }

    // -----------------------------------------------------------------------
    // autoCancelExpiredRequests: 스케줄러 검증
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("autoCancelExpiredRequests — 스케줄러")
    class SchedulerTests {

        @Test
        @DisplayName("스케줄러 실행 시 bulkCancelExpiredRequests 호출됨")
        void scheduler_callsBulkCancel() {
            when(matchRequestRepository.bulkCancelExpiredRequests(any(LocalDateTime.class)))
                    .thenReturn(3);

            service.autoCancelExpiredRequests();

            verify(matchRequestRepository).bulkCancelExpiredRequests(any(LocalDateTime.class));
        }

        @Test
        @DisplayName("취소 건수 0 이면 로그만 출력 (예외 없음)")
        void scheduler_zeroCancelled_noException() {
            when(matchRequestRepository.bulkCancelExpiredRequests(any(LocalDateTime.class)))
                    .thenReturn(0);

            assertThatCode(() -> service.autoCancelExpiredRequests())
                    .doesNotThrowAnyException();
        }
    }
}
