package com.travelmate.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

@DisplayName("InMemoryTokenStorageService 테스트")
class InMemoryTokenStorageServiceTest {

    private InMemoryTokenStorageService tokenStorageService;

    @BeforeEach
    void setUp() {
        tokenStorageService = new InMemoryTokenStorageService();
        ReflectionTestUtils.setField(tokenStorageService, "activeProfiles", "");
    }

    @Test
    @DisplayName("실패 - prod에서 in-memory token storage 사용")
    void validateProductionConfiguration_InMemoryStorageInProd() {
        // Given
        ReflectionTestUtils.setField(tokenStorageService, "activeProfiles", "prod");

        // When & Then
        assertThatThrownBy(() -> tokenStorageService.validateProductionConfiguration())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Redis token storage");
    }

    @Test
    @DisplayName("성공 - prod가 아니면 in-memory token storage 허용")
    void validateProductionConfiguration_InMemoryStorageOutsideProd() {
        // When & Then
        assertThatCode(() -> tokenStorageService.validateProductionConfiguration())
                .doesNotThrowAnyException();
    }
}
