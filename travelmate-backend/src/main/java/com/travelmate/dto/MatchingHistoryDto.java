package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 동반자 매칭 히스토리 응답 DTO
 * - ACCEPTED 상태의 매칭 요청을 파트너 기준으로 표현
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingHistoryDto {

    /** 매칭 요청 ID */
    private Long matchingRequestId;

    /** 매칭된 파트너 요약 정보 */
    private UserSummaryDto partner;

    /** 매칭 방향 (SENT: 내가 보낸 요청, RECEIVED: 내가 받은 요청) */
    private MatchDirection direction;

    /** 호환성 점수 (0~100) */
    private Double compatibilityScore;

    /** 매칭 수락 시각 */
    private LocalDateTime matchedAt;

    /** 매칭 요청 생성 시각 */
    private LocalDateTime createdAt;

    /**
     * 매칭 방향 열거형
     */
    public enum MatchDirection {
        SENT,       // 내가 요청을 보낸 매칭
        RECEIVED    // 내가 요청을 받은 매칭
    }
}
