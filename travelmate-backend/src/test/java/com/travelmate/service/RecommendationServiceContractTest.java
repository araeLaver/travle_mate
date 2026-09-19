package com.travelmate.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.RecommendationFeedbackRepository;
import com.travelmate.repository.TravelGroupRepository;
import com.travelmate.repository.UserGroupMembershipRepository;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.UserTrustScoreRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecommendationService 계약 테스트")
class RecommendationServiceContractTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TravelGroupRepository travelGroupRepository;

    @Mock
    private UserGroupMembershipRepository membershipRepository;

    @Mock
    private UserTrustScoreRepository trustScoreRepository;

    @Mock
    private RecommendationFeedbackRepository recommendationFeedbackRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private RecommendationService recommendationService;

    @Test
    @DisplayName("processFeedback - 사용자 ID 누락은 BAD_REQUEST")
    void processFeedback_MissingUserId_ReturnsBadRequestContract() {
        assertThatThrownBy(() -> recommendationService.processFeedback(null, Map.of("rating", 5)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("사용자 ID가 필요합니다.")
                .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));

        verify(recommendationFeedbackRepository, never()).save(any());
    }

    @Test
    @DisplayName("processFeedback - rating 타입 오류는 BAD_REQUEST")
    void processFeedback_InvalidRatingType_ReturnsBadRequestContract() {
        assertThatThrownBy(() -> recommendationService.processFeedback(1L, Map.of("rating", "bad-rating")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("rating은 숫자여야 합니다.")
                .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));

        verify(recommendationFeedbackRepository, never()).save(any());
    }

    @Test
    @DisplayName("processFeedback - targetId 타입 오류는 BAD_REQUEST")
    void processFeedback_InvalidTargetId_ReturnsBadRequestContract() {
        Map<String, Object> feedback = Map.of(
                "rating", 5,
                "targetId", "bad-target-id"
        );

        assertThatThrownBy(() -> recommendationService.processFeedback(1L, feedback))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("targetId은 숫자여야 합니다.")
                .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));

        verify(recommendationFeedbackRepository, never()).save(any());
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
