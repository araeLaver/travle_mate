package com.travelmate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Data
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token은 필수입니다")
        private String refreshToken;

        private String deviceId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenResponse {
        private String accessToken;
        private String refreshToken;
        private Long expiresIn;
        private String tokenType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginResponse {
        private String accessToken;
        private String refreshToken;
        private Long expiresIn;
        private String tokenType;
        private UserDto.Response user;
    }

    @Data
    public static class LogoutRequest {
        private String refreshToken;
        private String deviceId;
        private boolean logoutAll;  // 모든 기기에서 로그아웃
    }

    @Data
    public static class OAuthLoginRequest {
        @NotBlank(message = "Provider는 필수입니다")
        private String provider;  // google, kakao, naver

        @NotBlank(message = "Access token은 필수입니다")
        private String accessToken;

        private String deviceId;
        private String deviceName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OAuthUserInfo {
        private String provider;
        private String providerId;
        private String email;
        private String name;
        private String profileImageUrl;
    }
}
