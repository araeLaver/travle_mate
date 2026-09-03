package com.travelmate.controller;

import com.travelmate.service.AdvancedRecommendationService;
import com.travelmate.service.LocationService;
import com.travelmate.service.RecommendationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecommendationController 테스트")
class RecommendationControllerTest {

    @Mock
    private RecommendationService recommendationService;

    @Mock
    private LocationService locationService;

    @Mock
    private AdvancedRecommendationService advancedRecommendationService;

    @InjectMocks
    private RecommendationController recommendationController;

    @Test
    @DisplayName("feedback - 본문 userId가 있어도 인증 사용자 ID로 처리")
    void submitFeedback_UsesPrincipalUserId() {
        // Given
        Map<String, Object> feedback = new HashMap<>();
        feedback.put("userId", 999L);
        feedback.put("rating", 5);
        feedback.put("comment", "좋은 추천입니다");

        // When
        ResponseEntity<Void> response = recommendationController.submitFeedback("1", feedback);

        // Then
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        verify(recommendationService).processFeedback(1L, feedback);
    }

    @Test
    @DisplayName("feedback - 인증 principal이 없으면 거부")
    void submitFeedback_MissingPrincipalRejected() {
        // Given
        Map<String, Object> feedback = new HashMap<>();
        feedback.put("rating", 5);

        // When & Then
        assertThatThrownBy(() -> recommendationController.submitFeedback(null, feedback))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Authenticated user principal is required");
        verifyNoInteractions(recommendationService);
    }

    @Test
    @DisplayName("feedback - 인증 principal이 숫자가 아니면 거부")
    void submitFeedback_InvalidPrincipalRejected() {
        // Given
        Map<String, Object> feedback = new HashMap<>();
        feedback.put("rating", 5);

        // When & Then
        assertThatThrownBy(() -> recommendationController.submitFeedback("abc", feedback))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Invalid authenticated user principal");
        verifyNoInteractions(recommendationService);
    }

    @Test
    @DisplayName("groups - 인증 principal이 숫자가 아니면 거부")
    void getGroupRecommendations_InvalidPrincipalRejected() {
        // When & Then
        assertThatThrownBy(() -> recommendationController.getGroupRecommendations("abc", 10))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Invalid authenticated user principal");
        verifyNoInteractions(recommendationService);
    }
}
