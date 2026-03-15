package com.travelmate.service;

import com.travelmate.entity.MatchRequest.MatchStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.*;

/**
 * BE-101: MatchingStateGuard 단위 테스트
 *
 * <h3>검증 항목</h3>
 * <ul>
 *   <li>PENDING → ACCEPTED 허용</li>
 *   <li>PENDING → REJECTED 허용</li>
 *   <li>PENDING → CANCELLED 허용</li>
 *   <li>ACCEPTED → CANCELLED 허용</li>
 *   <li>REJECTED, CANCELLED, EXPIRED(종료상태) → 모든 전이 거부</li>
 *   <li>ACCEPTED → ACCEPTED / REJECTED / PENDING 등 허용되지 않는 전이 거부</li>
 *   <li>isAllowed() 헬퍼 메서드 검증</li>
 *   <li>예외 메시지에 requestId 포함 여부 검증</li>
 * </ul>
 */
@DisplayName("MatchingStateGuard 단위 테스트")
class MatchingStateGuardTest {

    private MatchingStateGuard guard;
    private static final Long REQUEST_ID = 42L;

    @BeforeEach
    void setUp() {
        guard = new MatchingStateGuard();
    }

    // =========================================================================
    // 허용 전이 검증
    // =========================================================================

    @Nested
    @DisplayName("허용 전이")
    class AllowedTransitions {

        @Test
        @DisplayName("PENDING → ACCEPTED 허용")
        void pendingToAccepted() {
            assertThatNoException()
                    .isThrownBy(() -> guard.validate(MatchStatus.PENDING, MatchStatus.ACCEPTED, REQUEST_ID));
        }

        @Test
        @DisplayName("PENDING → REJECTED 허용")
        void pendingToRejected() {
            assertThatNoException()
                    .isThrownBy(() -> guard.validate(MatchStatus.PENDING, MatchStatus.REJECTED, REQUEST_ID));
        }

        @Test
        @DisplayName("PENDING → CANCELLED 허용")
        void pendingToCancelled() {
            assertThatNoException()
                    .isThrownBy(() -> guard.validate(MatchStatus.PENDING, MatchStatus.CANCELLED, REQUEST_ID));
        }

        @Test
        @DisplayName("ACCEPTED → CANCELLED 허용")
        void acceptedToCancelled() {
            assertThatNoException()
                    .isThrownBy(() -> guard.validate(MatchStatus.ACCEPTED, MatchStatus.CANCELLED, REQUEST_ID));
        }
    }

    // =========================================================================
    // 거부 전이 검증
    // =========================================================================

    @Nested
    @DisplayName("거부 전이 — PENDING 이외의 상태로 전이 시도")
    class RejectedTransitionsFromPending {

        @Test
        @DisplayName("PENDING → PENDING 거부 (자기 자신 전이)")
        void pendingToPending() {
            assertThatThrownBy(() -> guard.validate(MatchStatus.PENDING, MatchStatus.PENDING, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("PENDING")
                    .hasMessageContaining(String.valueOf(REQUEST_ID));
        }

        @Test
        @DisplayName("PENDING → EXPIRED 거부")
        void pendingToExpired() {
            assertThatThrownBy(() -> guard.validate(MatchStatus.PENDING, MatchStatus.EXPIRED, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("EXPIRED");
        }
    }

    @Nested
    @DisplayName("거부 전이 — ACCEPTED 상태에서 CANCELLED 외 전이 시도")
    class RejectedTransitionsFromAccepted {

        @Test
        @DisplayName("ACCEPTED → PENDING 거부")
        void acceptedToPending() {
            assertThatThrownBy(() -> guard.validate(MatchStatus.ACCEPTED, MatchStatus.PENDING, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("ACCEPTED");
        }

        @Test
        @DisplayName("ACCEPTED → REJECTED 거부")
        void acceptedToRejected() {
            assertThatThrownBy(() -> guard.validate(MatchStatus.ACCEPTED, MatchStatus.REJECTED, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("REJECTED");
        }

        @Test
        @DisplayName("ACCEPTED → ACCEPTED 거부 (자기 자신 전이)")
        void acceptedToAccepted() {
            assertThatThrownBy(() -> guard.validate(MatchStatus.ACCEPTED, MatchStatus.ACCEPTED, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("거부 전이 — 종료 상태(REJECTED, CANCELLED, EXPIRED)에서 모든 전이 거부")
    class RejectedTransitionsFromTerminalStates {

        @ParameterizedTest(name = "REJECTED → {0} 거부")
        @EnumSource(MatchStatus.class)
        @DisplayName("REJECTED 는 종료 상태 — 모든 전이 거부")
        void rejectedToAny(MatchStatus target) {
            assertThatThrownBy(() -> guard.validate(MatchStatus.REJECTED, target, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("없음(종료 상태)");
        }

        @ParameterizedTest(name = "CANCELLED → {0} 거부")
        @EnumSource(MatchStatus.class)
        @DisplayName("CANCELLED 는 종료 상태 — 모든 전이 거부")
        void cancelledToAny(MatchStatus target) {
            assertThatThrownBy(() -> guard.validate(MatchStatus.CANCELLED, target, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("없음(종료 상태)");
        }

        @ParameterizedTest(name = "EXPIRED → {0} 거부")
        @EnumSource(MatchStatus.class)
        @DisplayName("EXPIRED 는 종료 상태 — 모든 전이 거부")
        void expiredToAny(MatchStatus target) {
            assertThatThrownBy(() -> guard.validate(MatchStatus.EXPIRED, target, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("없음(종료 상태)");
        }
    }

    // =========================================================================
    // isAllowed() 헬퍼 메서드 검증
    // =========================================================================

    @Nested
    @DisplayName("isAllowed() 헬퍼 메서드")
    class IsAllowedHelper {

        @Test
        @DisplayName("허용 전이 시 true 반환")
        void returnsTrueForAllowedTransitions() {
            assertThat(guard.isAllowed(MatchStatus.PENDING, MatchStatus.ACCEPTED)).isTrue();
            assertThat(guard.isAllowed(MatchStatus.PENDING, MatchStatus.REJECTED)).isTrue();
            assertThat(guard.isAllowed(MatchStatus.PENDING, MatchStatus.CANCELLED)).isTrue();
            assertThat(guard.isAllowed(MatchStatus.ACCEPTED, MatchStatus.CANCELLED)).isTrue();
        }

        @Test
        @DisplayName("거부 전이 시 false 반환")
        void returnsFalseForDisallowedTransitions() {
            assertThat(guard.isAllowed(MatchStatus.REJECTED, MatchStatus.PENDING)).isFalse();
            assertThat(guard.isAllowed(MatchStatus.CANCELLED, MatchStatus.ACCEPTED)).isFalse();
            assertThat(guard.isAllowed(MatchStatus.EXPIRED, MatchStatus.ACCEPTED)).isFalse();
            assertThat(guard.isAllowed(MatchStatus.ACCEPTED, MatchStatus.REJECTED)).isFalse();
            assertThat(guard.isAllowed(MatchStatus.PENDING, MatchStatus.PENDING)).isFalse();
        }
    }

    // =========================================================================
    // 예외 메시지 포맷 검증
    // =========================================================================

    @Nested
    @DisplayName("예외 메시지 포맷")
    class ExceptionMessageFormat {

        @Test
        @DisplayName("예외 메시지에 from/to 상태와 requestId 가 포함되어야 함")
        void exceptionMessageContainsDetails() {
            assertThatThrownBy(() -> guard.validate(MatchStatus.CANCELLED, MatchStatus.ACCEPTED, REQUEST_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("CANCELLED")
                    .hasMessageContaining("ACCEPTED")
                    .hasMessageContaining(String.valueOf(REQUEST_ID));
        }
    }
}
