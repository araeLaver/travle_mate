package com.travelmate.exception;

import lombok.Getter;

/**
 * Rate Limit 초과 시 발생하는 예외
 */
@Getter
public class RateLimitExceededException extends RuntimeException {
    
    private final int retryAfterSeconds;
    
    public RateLimitExceededException(String message) {
        super(message);
        this.retryAfterSeconds = 60; // 기본 1분
    }
    
    public RateLimitExceededException(String message, int retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }
    
    public static RateLimitExceededException forEndpoint(String endpoint, int retryAfterSeconds) {
        return new RateLimitExceededException(
            String.format("%s API 호출 한도를 초과했습니다. %d초 후에 다시 시도해 주세요.", 
                endpoint, retryAfterSeconds),
            retryAfterSeconds
        );
    }
    
    public static RateLimitExceededException forUser(int retryAfterSeconds) {
        return new RateLimitExceededException(
            String.format("사용자별 요청 한도를 초과했습니다. %d초 후에 다시 시도해 주세요.", retryAfterSeconds),
            retryAfterSeconds
        );
    }
    
    public static RateLimitExceededException forIP(int retryAfterSeconds) {
        return new RateLimitExceededException(
            String.format("IP별 요청 한도를 초과했습니다. %d초 후에 다시 시도해 주세요.", retryAfterSeconds),
            retryAfterSeconds
        );
    }
}