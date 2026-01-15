package com.travelmate.security.audit;

/**
 * 보안 이벤트 타입
 */
public enum SecurityEventType {
    // 인증 관련
    AUTH_SUCCESS("인증 성공"),
    AUTH_FAILURE("인증 실패"),
    LOGOUT("로그아웃"),
    TOKEN_REFRESH("토큰 갱신"),
    TOKEN_INVALIDATED("토큰 무효화"),

    // 접근 제어
    ACCESS_DENIED("접근 거부"),
    PERMISSION_CHANGED("권한 변경"),

    // 공격 탐지
    RATE_LIMIT_EXCEEDED("요청 제한 초과"),
    XSS_ATTEMPT("XSS 시도"),
    SQL_INJECTION_ATTEMPT("SQL 인젝션 시도"),
    CSRF_VIOLATION("CSRF 위반"),
    SUSPICIOUS_ACTIVITY("의심스러운 활동"),

    // 계정 관련
    PASSWORD_CHANGED("비밀번호 변경"),
    PASSWORD_RESET_REQUESTED("비밀번호 재설정 요청"),
    ACCOUNT_LOCKED("계정 잠금"),
    ACCOUNT_UNLOCKED("계정 잠금 해제"),

    // 데이터 접근
    SENSITIVE_DATA_ACCESS("민감 데이터 접근"),
    DATA_EXPORT("데이터 내보내기"),
    DATA_DELETE("데이터 삭제");

    private final String description;

    SecurityEventType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
