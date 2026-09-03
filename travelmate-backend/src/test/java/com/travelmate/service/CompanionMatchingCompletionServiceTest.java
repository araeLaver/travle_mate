package com.travelmate.service;

import com.travelmate.dto.MatchingDto.MatchHistoryResponse;
import com.travelmate.dto.MatchingDto.MatchRequestResponse;
import com.travelmate.entity.MatchRequest;
import com.travelmate.entity.MatchRequest.MatchStatus;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.MatchRequestRepository;
import com.travelmate.repository.TravelItineraryRepository;
import com.travelmate.repository.UserBlockRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CompanionMatchingService 완료 플로우 테스트")
class CompanionMatchingCompletionServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private MatchRequestRepository matchRequestRepository;
    @Mock private TravelItineraryRepository travelItineraryRepository;
    @Mock private NotificationService notificationService;
    @Mock private UserBlockRepository userBlockRepository;

    private CompanionMatchingService service;
    private User requester;
    private User receiver;

    @BeforeEach
    void setUp() {
        service = new CompanionMatchingService(
                userRepository,
                matchRequestRepository,
                travelItineraryRepository,
                notificationService,
                userBlockRepository,
                new MatchingStateGuard());

        requester = buildUser(1L, "requester");
        receiver = buildUser(2L, "receiver");
    }

    @Test
    @DisplayName("수락된 매칭 참여자는 동행 완료 처리할 수 있다")
    void completeMatchRequest_AcceptedParticipant_Completes() {
        MatchRequest accepted = buildRequest(MatchStatus.ACCEPTED);
        when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(accepted));
        when(matchRequestRepository.save(any(MatchRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MatchRequestResponse response = service.completeMatchRequest(1L, 10L);

        assertThat(accepted.getStatus()).isEqualTo(MatchStatus.COMPLETED);
        assertThat(response.getStatus()).isEqualTo(MatchStatus.COMPLETED);
        verify(matchRequestRepository).save(accepted);
    }

    @Test
    @DisplayName("참여자가 아니면 동행 완료 처리할 수 없다")
    void completeMatchRequest_NonParticipant_ThrowsForbidden() {
        MatchRequest accepted = buildRequest(MatchStatus.ACCEPTED);
        when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(accepted));

        assertThatThrownBy(() -> service.completeMatchRequest(99L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("참여자");
    }

    @Test
    @DisplayName("대기 중인 매칭은 동행 완료 처리할 수 없다")
    void completeMatchRequest_Pending_ThrowsBadRequest() {
        MatchRequest pending = buildRequest(MatchStatus.PENDING);
        when(matchRequestRepository.findById(10L)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> service.completeMatchRequest(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("수락된 매칭");
    }

    @Test
    @DisplayName("매칭 히스토리는 수락/완료 상태를 그대로 반환한다")
    void getMatchHistory_IncludesStatus() {
        MatchRequest accepted = buildRequest(MatchStatus.ACCEPTED);
        MatchRequest completed = buildRequest(MatchStatus.COMPLETED);
        completed.setId(11L);
        when(matchRequestRepository.findMatchHistory(1L)).thenReturn(List.of(accepted, completed));

        List<MatchHistoryResponse> history = service.getMatchHistory(1L);

        assertThat(history).extracting(MatchHistoryResponse::getStatus)
                .containsExactly(MatchStatus.ACCEPTED, MatchStatus.COMPLETED);
    }

    private MatchRequest buildRequest(MatchStatus status) {
        return MatchRequest.builder()
                .id(10L)
                .requester(requester)
                .receiver(receiver)
                .status(status)
                .totalScore(BigDecimal.valueOf(87))
                .travelStyleScore(BigDecimal.valueOf(25))
                .scheduleOverlapScore(BigDecimal.valueOf(20))
                .budgetScore(BigDecimal.valueOf(17))
                .languageScore(BigDecimal.valueOf(15))
                .ratingScore(BigDecimal.valueOf(10))
                .respondedAt(LocalDateTime.now().minusDays(1))
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();
    }

    private User buildUser(Long id, String nickname) {
        User user = new User();
        user.setId(id);
        user.setNickname(nickname);
        return user;
    }
}
