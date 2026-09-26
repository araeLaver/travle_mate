package com.travelmate.service;

import com.travelmate.entity.BetaInvite;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.BetaConfigRepository;
import com.travelmate.repository.BetaInviteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BetaInviteService 테스트")
class BetaInviteServiceTest {

    @Mock
    private BetaInviteRepository betaInviteRepository;

    @Mock
    private BetaConfigRepository betaConfigRepository;

    @InjectMocks
    private BetaInviteService betaInviteService;

    @Test
    @DisplayName("실패 - 초대 코드 사용 시 유효하지 않은 코드")
    void consumeInvite_InvalidCode() {
        // Given
        when(betaInviteRepository.findByInviteCode("bad-code")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> betaInviteService.consumeInvite("bad-code", 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("유효하지 않은 초대 코드")
                .satisfies(ex -> assertBusinessException(ex, 400, "BAD_REQUEST"));
    }

    @Test
    @DisplayName("실패 - 초대 코드 취소 시 코드 없음")
    void revokeInvite_NotFound() {
        // Given
        when(betaInviteRepository.findByInviteCode("missing")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> betaInviteService.revokeInvite("missing"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("초대 코드를 찾을 수 없습니다")
                .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
    }

    @Test
    @DisplayName("실패 - 이미 사용된 초대 코드 취소")
    void revokeInvite_UsedInvite() {
        // Given
        BetaInvite invite = new BetaInvite();
        invite.setInviteCode("used-code");
        invite.setStatus(BetaInvite.InviteStatus.USED);
        when(betaInviteRepository.findByInviteCode("used-code")).thenReturn(Optional.of(invite));

        // When & Then
        assertThatThrownBy(() -> betaInviteService.revokeInvite("used-code"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("이미 사용된 초대 코드")
                .satisfies(ex -> assertBusinessException(ex, 409, "CONFLICT"));
        verify(betaInviteRepository, never()).save(any(BetaInvite.class));
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
