package com.travelmate.dto;

import com.travelmate.entity.MatchingRequest.MatchingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 동반자 매칭 요청 관련 DTO
 *
 * - Request: 매칭 요청 전송 시 사용
 * - Response: 매칭 요청 정보 응답 시 사용
 */
public class MatchingRequestDto {

    /**
     * 매칭 요청 전송 Request DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {

        @NotNull(message = "상대방 사용자 ID는 필수입니다.")
        private Long toUserId;
    }

    /**
     * 매칭 요청 Response DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {

        /** 매칭 요청 ID */
        private Long id;

        /** 요청 보낸 사용자 */
        private UserSummaryDto fromUser;

        /** 요청 받은 사용자 */
        private UserSummaryDto toUser;

        /** 매칭 상태 (PENDING, ACCEPTED, REJECTED) */
        private MatchingStatus status;

        /** 호환성 점수 (0~100) */
        private Double compatibilityScore;

        /** 요청 생성 시각 */
        private LocalDateTime createdAt;

        /** 응답 시각 (수락/거절 시 설정) */
        private LocalDateTime respondedAt;
    }
}
