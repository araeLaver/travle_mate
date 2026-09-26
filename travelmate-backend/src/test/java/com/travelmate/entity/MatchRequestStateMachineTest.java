package com.travelmate.entity;

import com.travelmate.entity.MatchRequest.MatchStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

/**
 * MatchRequest entity state helper tests.
 *
 * <p>State transition policy is owned by {@code MatchingStateGuard}; this suite
 * only verifies entity-local invariants and status helper methods.
 */
@DisplayName("MatchRequest 상태 헬퍼 테스트")
class MatchRequestStateMachineTest {

    private User requester;
    private User receiver;

    @BeforeEach
    void setUp() {
        requester = new User();
        requester.setId(1L);
        requester.setNickname("requester");

        receiver = new User();
        receiver.setId(2L);
        receiver.setNickname("receiver");
    }

    private MatchRequest buildRequest(MatchStatus status, LocalDateTime expiresAt) {
        return MatchRequest.builder()
                .id(10L)
                .requester(requester)
                .receiver(receiver)
                .status(status)
                .expiresAt(expiresAt)
                .build();
    }

    @Nested
    @DisplayName("만료 상태 헬퍼")
    class ExpiryHelperTests {

        @Test
        @DisplayName("expiresAt 이 미래이고 PENDING 상태면 응답 대기 상태다")
        void notExpiredPending_awaitingResponse() {
            MatchRequest request = buildRequest(MatchStatus.PENDING, LocalDateTime.now().plusHours(1));

            assertThat(request.isAwaitingResponse()).isTrue();
            assertThat(request.isExpiredAndPending()).isFalse();
        }

        @Test
        @DisplayName("expiresAt 이 과거이고 PENDING 상태면 만료된 대기 상태다")
        void expiredPending_isExpiredAndPending() {
            MatchRequest request = buildRequest(MatchStatus.PENDING, LocalDateTime.now().minusHours(1));

            assertThat(request.isExpiredAndPending()).isTrue();
            assertThat(request.isAwaitingResponse()).isFalse();
        }

        @Test
        @DisplayName("expiresAt 이 없고 PENDING 상태면 응답 대기 상태다")
        void nullExpiresAt_pendingStatus_awaitingResponse() {
            MatchRequest request = buildRequest(MatchStatus.PENDING, null);

            assertThat(request.isAwaitingResponse()).isTrue();
            assertThat(request.isExpiredAndPending()).isFalse();
        }

        @Test
        @DisplayName("종료 상태는 만료 여부와 관계없이 응답 대기가 아니다")
        void terminalStatus_notAwaiting() {
            MatchRequest request = buildRequest(MatchStatus.REJECTED, LocalDateTime.now().plusHours(1));

            assertThat(request.isAwaitingResponse()).isFalse();
            assertThat(request.isExpiredAndPending()).isFalse();
        }
    }

    @Nested
    @DisplayName("자기 자신 매칭 방지")
    class SelfMatchPrevention {

        @Test
        @DisplayName("requester == receiver 이면 IllegalStateException")
        void selfMatch_throwsException() {
            User same = new User();
            same.setId(99L);

            MatchRequest request = MatchRequest.builder()
                    .requester(same)
                    .receiver(same)
                    .status(MatchStatus.PENDING)
                    .build();

            assertThatThrownBy(() -> invokePrePersist(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("자기 자신");
        }

        @Test
        @DisplayName("requester != receiver 이면 @PrePersist 통과")
        void differentUsers_noException() {
            MatchRequest request = buildRequest(MatchStatus.PENDING, LocalDateTime.now().plusHours(1));

            assertThatCode(() -> invokePrePersist(request)).doesNotThrowAnyException();
        }
    }

    private void invokePrePersist(MatchRequest request) throws Throwable {
        try {
            var method = MatchRequest.class.getDeclaredMethod("validateNotSelfMatch");
            method.setAccessible(true);
            method.invoke(request);
        } catch (java.lang.reflect.InvocationTargetException e) {
            throw e.getCause();
        }
    }
}
