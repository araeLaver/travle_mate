package com.travelmate.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.travelmate.exception.ErrorCode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private String code;           // 비즈니스 에러 코드
    private int status;            // HTTP 상태 코드
    private String error;          // HTTP 상태 메시지
    private String message;        // 사용자 메시지
    private String path;           // 요청 경로
    private LocalDateTime timestamp;
    private List<ValidationError> validationErrors;
    private String traceId;        // 추적용 ID (로그 연관)
    private Integer retryAfter;    // Rate limit 시 재시도 가능 시간 (초)

    @Data
    public static class ValidationError {
        private String field;
        private String message;

        public ValidationError(String field, String message) {
            this.field = field;
            this.message = message;
        }
    }

    /**
     * ErrorCode 기반 ErrorResponse 생성
     */
    public static ErrorResponse of(ErrorCode errorCode, String path) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .status(errorCode.getHttpStatus().value())
                .error(errorCode.getHttpStatus().getReasonPhrase())
                .message(errorCode.getMessage())
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * ErrorCode 기반 + 커스텀 메시지 ErrorResponse 생성
     */
    public static ErrorResponse of(ErrorCode errorCode, String path, String customMessage) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .status(errorCode.getHttpStatus().value())
                .error(errorCode.getHttpStatus().getReasonPhrase())
                .message(customMessage)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }
}