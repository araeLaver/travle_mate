package com.travelmate.entity;

import com.travelmate.entity.MatchRequest.MatchStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

/**
 * MatchRequest 상태머신 단위 테스트 (v0.2)
 *
 * <p>검증 항목:</p>
 * <ul>
 *   <li>REQUESTED → MATCHED / REJECTED / CANCELLED 허용 전이</li>
 *   <li>MATCHED / REJECTED / CANCELLED → 모든 전이 불가 (종료 상태)</li>
 *   <li>transitionTo 호출 시 respondedAt 자동 설정 검증</li>
 *   <li>isExpiredAndPending / isAwaitingResponse 헬퍼 메서드 검증</li>
 *   <li>자기 자신 매칭 @PrePersist 검증</li>
 * </ul>
 */
@DisplayName("MatchRequest 상태머신 테스트")
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

    private MatchRequest buildRequest(MatchStatus status) {
        return MatchRequest.builder()
                .id(10L)
                .requester(requester)
                .receiver(receiver)
                .status(status)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
    }

    // -----------------------------------------------------------------------
    // REQUESTED 출발 — 허용 전이
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("REQUESTED 상태에서 허용 전이")
    class AllowedTransitions {

        @Test
        @DisplayName("REQUESTED → MATCHED 전이 성공")
        void requested_to_matched() {
            MatchRequest mr = buildRequest(MatchStatus.REQUESTED);

            mr.transitionTo(MatchStatus.MATCHED);

            assertThat(mr.getStatus()).isEqualTo(MatchStatus.MATCHED);
            assertThat(mr.getRespondedAt()).isNotNull();
        }

        @Test
        @DisplayName("REQUESTED → REJECTED 전이 성공")
        void requested_to_rejected() {
            MatchRequest mr = buildRequest(MatchStatus.REQUESTED);

            mr.transitionTo(MatchStatus.REJECTED);

            assertThat(mr.getStatus()).isEqualTo(MatchStatus.REJECTED);
            assertThat(mr.getRespondedAt()).isNotNull();
        }

        @Test
        @DisplayName("REQUESTED → CANCELLED 전이 성공 (취소/자동만료)")
        void requested_to_cancelled() {
            MatchRequest mr = buildRequest(MatchStatus.REQUESTED);

            mr.transitionTo(MatchStatus.CANCELLED);

            assertThat(mr.getStatus()).isEqualTo(MatchStatus.CANCELLED);
            // CANCELLED는 respondedAt 설정하지 않음
            assertThat(mr.getRespondedAt()).isNull();
        }
    }

    // -----------------------------------------------------------------------
    // 종료 상태에서 모든 전이 불가
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("종료 상태에서 전이 불가 검증")
    class TerminalStateTransitions {

        @Test
        @DisplayName("MATCHED → CANCELLED 전이 불가")
        void matched_to_cancelled_fails() {
            MatchRequest mr = buildRequest(MatchStatus.MATCHED);

            assertThatThrownBy(() -> mr.transitionTo(MatchStatus.CANCELLED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("MATCHED")
                    .hasMessageContaining("CANCELLED");
        }

        @Test
        @DisplayName("MATCHED → REJECTED 전이 불가")
        void matched_to_rejected_fails() {
            MatchRequest mr = buildRequest(MatchStatus.MATCHED);

            assertThatThrownBy(() -> mr.transitionTo(MatchStatus.REJECTED))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("REJECTED → MATCHED 전이 불가")
        void rejected_to_matched_fails() {
            MatchRequest mr = buildRequest(MatchStatus.REJECTED);

            assertThatThrownBy(() -> mr.transitionTo(MatchStatus.MATCHED))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("CANCELLED → REQUESTED 전이 불가")
        void cancelled_to_requested_fails() {
            MatchRequest mr = buildRequest(MatchStatus.CANCELLED);

            assertThatThrownBy(() -> mr.transitionTo(MatchStatus.REQUESTED))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("CANCELLED → MATCHED 전이 불가")
        void cancelled_to_matched_fails() {
            MatchRequest mr = buildRequest(MatchStatus.CANCELLED);

            assertThatThrownBy(() -> mr.transitionTo(MatchStatus.MATCHED))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("EXPIRED → MATCHED 전이 불가")
        void expired_to_matched_fails() {
            MatchRequest mr = buildRequest(MatchStatus.EXPIRED);

            assertThatThrownBy(() -> mr.transitionTo(MatchStatus.MATCHED))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // -----------------------------------------------------------------------
    // REQUESTED → MATCHED: respondedAt 자동 설정
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("respondedAt 자동 설정")
    class RespondedAtTests {

        @Test
        @DisplayName("MATCHED 전이 시 respondedAt 현재 시각으로 설정됨")
        void matched_setsRespondedAt() {
            MatchRequest mr = buildRequest(MatchStatus.REQUESTED);
            assertThat(mr.getRespondedAt()).isNull();

            LocalDateTime before = LocalDateTime.now().minusSeconds(1);
            mr.transitionTo(MatchStatus.MATCHED);
            LocalDateTime after = LocalDateTime.now().plusSeconds(1);

            assertThat(mr.getRespondedAt())
                    .isAfter(before)
                    .isBefore(after);
        }

        @Test
        @DisplayName("REJECTED 전이 시 respondedAt 현재 시각으로 설정됨")
        void rejected_setsRespondedAt() {
            MatchRequest mr = buildRequest(MatchStatus.REQUESTED);

            mr.transitionTo(MatchStatus.REJECTED);

            assertThat(mr.getRespondedAt()).isNotNull();
        }

        @Test
        @DisplayName("CANCELLED 전이 시 respondedAt 은 null 유지")
        void cancelled_doesNotSetRespondedAt() {
            MatchRequest mr = buildRequest(MatchStatus.REQUESTED);

            mr.transitionTo(MatchStatus.CANCELLED);

            assertThat(mr.getRespondedAt()).isNull();
        }
    }

    // -----------------------------------------------------------------------
    // isExpiredAndPending / isAwaitingResponse 헬퍼
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("만료 상태 헬퍼 메서드 테스트")
    class ExpiryHelperTests {

        @Test
        @DisplayName("expiresAt 이 미래이고 REQUESTED 상태 → isAwaitingResponse = true")
        void notExpiredRequested_awaitingResponse() {
            MatchRequest mr = MatchRequest.builder()
                    .id(1L).requester(requester).receiver(receiver)
                    .status(MatchStatus.REQUESTED)
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build();

            assertThat(mr.isAwaitingResponse()).isTrue();
            assertThat(mr.isExpiredAndPending()).isFalse();
        }

        @Test
        @DisplayName("expiresAt 이 과거이고 REQUESTED 상태 → isExpiredAndPending = true")
        void expiredRequested_isExpiredAndPending() {
            MatchRequest mr = MatchRequest.builder()
                    .id(1L).requester(requester).receiver(receiver)
                    .status(MatchStatus.REQUESTED)
                    .expiresAt(LocalDateTime.now().minusHours(1))
                    .build();

            assertThat(mr.isExpiredAndPending()).isTrue();
            assertThat(mr.isAwaitingResponse()).isFalse();
        }

        @Test
        @DisplayName("MATCHED 상태 → isAwaitingResponse = false")
        void matchedStatus_notAwaiting() {
            MatchRequest mr = MatchRequest.builder()
                    .id(1L).requester(requester).receiver(receiver)
                    .status(MatchStatus.MATCHED)
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build();

            assertThat(mr.isAwaitingResponse()).isFalse();
            assertThat(mr.isExpiredAndPending()).isFalse();
        }

        @Test
        @DisplayName("expiresAt null + REQUESTED → isAwaitingResponse = true (만료 없음)")
        void nullExpiresAt_requestedStatus_awaitingResponse() {
            MatchRequest mr = MatchRequest.builder()
                    .id(1L).requester(requester).receiver(receiver)
                    .status(MatchStatus.REQUESTED)
                    .expiresAt(null)
                    .build();

            assertThat(mr.isAwaitingResponse()).isTrue();
            assertThat(mr.isExpiredAndPending()).isFalse();
        }
    }

    // -----------------------------------------------------------------------
    // @PrePersist 자기 자신 매칭 방지
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("자기 자신 매칭 방지 (@PrePersist)")
    class SelfMatchPrevention {

        @Test
        @DisplayName("requester == receiver 이면 IllegalStateException")
        void selfMatch_throwsException() {
            User same = new User();
            same.setId(99L);

            MatchRequest mr = MatchRequest.builder()
                    .requester(same)
                    .receiver(same)
                    .status(MatchStatus.REQUESTED)
                    .build();

            // @PrePersist 메서드를 직접 리플렉션으로 호출 (JPA 없이 단위 테스트)
            assertThatThrownBy(() -> {
                try {
                    var method = MatchRequest.class.getDeclaredMethod("validateOnPersist");
                    method.setAccessible(true);
                    method.invoke(mr);
                } catch (java.lang.reflect.InvocationTargetException e) {
                    throw e.getCause();
                }
            }).isInstanceOf(IllegalStateException.class)
              .hasMessageContaining("자기 자신");
        }

        @Test
        @DisplayName("requester != receiver 이면 @PrePersist 통과")
        void differentUsers_noException() {
            MatchRequest mr = buildRequest(MatchStatus.REQUESTED);

            assertThatCode(() -> {
                try {
                    var method = MatchRequest.class.getDeclaredMethod("validateOnPersist");
                    method.setAccessible(true);
                    method.invoke(mr);
                } catch (java.lang.reflect.InvocationTargetException e) {
                    throw e.getCause();
                }
            }).doesNotThrowAnyException();
        }
    }
}
