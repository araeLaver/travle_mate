package com.travelmate.service;

import com.travelmate.entity.MatchRequest.MatchStatus;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * BE-101: 매칭 상태전이 가드
 *
 * <p>허용된 상태전이만 통과시키고, 그 외의 전이는 {@link IllegalStateException}을 던집니다.
 *
 * <h3>허용 전이표</h3>
 * <pre>
 *   PENDING  → ACCEPTED
 *   PENDING  → REJECTED
 *   PENDING  → CANCELLED
 *   ACCEPTED → CANCELLED
 *   ACCEPTED → COMPLETED
 *   MATCHED  → COMPLETED
 *   그 외    → IllegalStateException
 * </pre>
 *
 * <p>이 가드는 {@link CompanionMatchingService}에서 상태 변경 전 호출됩니다.
 */
@Component
public class MatchingStateGuard {

    /**
     * 각 상태에서 허용되는 다음 상태 집합.
     *
     * <ul>
     *   <li>PENDING: ACCEPTED, REJECTED, CANCELLED 로 전이 가능</li>
     *   <li>ACCEPTED: COMPLETED, CANCELLED 로 전이 가능</li>
     *   <li>MATCHED: COMPLETED 로 전이 가능 (레거시 상태 호환)</li>
     *   <li>COMPLETED, REJECTED, CANCELLED, EXPIRED: 종료 상태 — 추가 전이 불가</li>
     * </ul>
     */
    private static final Map<MatchStatus, Set<MatchStatus>> ALLOWED_TRANSITIONS = Map.of(
            MatchStatus.PENDING, EnumSet.of(
                    MatchStatus.ACCEPTED,
                    MatchStatus.REJECTED,
                    MatchStatus.CANCELLED),
            MatchStatus.ACCEPTED, EnumSet.of(
                    MatchStatus.COMPLETED,
                    MatchStatus.CANCELLED),
            MatchStatus.MATCHED, EnumSet.of(
                    MatchStatus.COMPLETED)
    );

    /**
     * 주어진 상태전이({@code from} → {@code to})가 허용되는지 검증합니다.
     *
     * @param from      현재 상태
     * @param to        전이할 상태
     * @param requestId 로그/예외 메시지에 포함할 매칭 요청 ID
     * @throws IllegalStateException 허용되지 않는 전이인 경우
     */
    public void validate(MatchStatus from, MatchStatus to, Long requestId) {
        Set<MatchStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(from, Set.of());
        if (!allowed.contains(to)) {
            throw new IllegalStateException(
                    String.format("허용되지 않는 매칭 상태전이: %s → %s (requestId=%d). 허용 전이: %s",
                            from, to, requestId, allowed.isEmpty() ? "없음(종료 상태)" : allowed));
        }
    }

    /**
     * 주어진 상태전이가 허용되는지 여부를 반환합니다 (예외 없이).
     *
     * @param from 현재 상태
     * @param to   전이할 상태
     * @return 허용 여부
     */
    public boolean isAllowed(MatchStatus from, MatchStatus to) {
        return ALLOWED_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
    }
}
