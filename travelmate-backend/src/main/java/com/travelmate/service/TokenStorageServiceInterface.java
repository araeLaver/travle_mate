package com.travelmate.service;

/**
 * 토큰 저장 서비스 인터페이스
 * Redis 또는 인메모리 구현체를 사용할 수 있음
 */
public interface TokenStorageServiceInterface {

    // 이메일 인증 토큰 저장 (24시간 유효)
    void saveEmailVerificationToken(String token, String email);

    // 이메일 인증 토큰으로 이메일 조회
    String getEmailByVerificationToken(String token);

    // 이메일 인증 토큰 삭제
    void deleteEmailVerificationToken(String token);

    // 비밀번호 재설정 토큰 저장 (1시간 유효)
    void savePasswordResetToken(String token, String email);

    // 비밀번호 재설정 토큰으로 이메일 조회
    String getEmailByPasswordResetToken(String token);

    // 비밀번호 재설정 토큰 삭제
    void deletePasswordResetToken(String token);

    // Refresh 토큰 저장 (7일 유효)
    void saveRefreshToken(String userId, String refreshToken);

    // Refresh 토큰 조회
    String getRefreshToken(String userId);

    // Refresh 토큰 검증
    boolean validateRefreshToken(String userId, String refreshToken);

    // Refresh 토큰 삭제 (로그아웃 시)
    void deleteRefreshToken(String userId);

    // 토큰 존재 여부 확인
    boolean tokenExists(String prefix, String token);
}
