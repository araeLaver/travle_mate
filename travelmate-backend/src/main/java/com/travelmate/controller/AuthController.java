package com.travelmate.controller;

import com.travelmate.dto.AuthDto;
import com.travelmate.dto.UserDto;
import com.travelmate.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    /**
     * 로그인 - Access Token + Refresh Token 발급
     */
    @PostMapping("/login")
    public ResponseEntity<AuthDto.LoginResponse> login(
            @Valid @RequestBody UserDto.LoginRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            @RequestHeader(value = "X-Device-Name", required = false) String deviceName,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AuthDto.LoginResponse response = authService.login(request, deviceId, deviceName, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * 토큰 갱신 - Refresh Token으로 새 Access Token 발급
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthDto.TokenResponse> refreshToken(
            @Valid @RequestBody AuthDto.RefreshTokenRequest request) {

        AuthDto.TokenResponse response = authService.refreshToken(
            request.getRefreshToken(), request.getDeviceId());
        return ResponseEntity.ok(response);
    }

    /**
     * 로그아웃 - Refresh Token 무효화
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @AuthenticationPrincipal String userId,
            @RequestBody(required = false) AuthDto.LogoutRequest request) {

        Long userIdLong = Long.parseLong(userId);

        String refreshToken = request != null ? request.getRefreshToken() : null;
        boolean logoutAll = request != null && request.isLogoutAll();

        authService.logout(userIdLong, refreshToken, logoutAll);

        return ResponseEntity.ok(Map.of("message", "로그아웃되었습니다."));
    }

    /**
     * OAuth 소셜 로그인
     */
    @PostMapping("/oauth/login")
    public ResponseEntity<AuthDto.LoginResponse> oauthLogin(
            @Valid @RequestBody AuthDto.OAuthLoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AuthDto.LoginResponse response = authService.oauthLogin(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * 현재 사용자 세션 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(Map.of(
            "userId", Long.parseLong(userId),
            "authenticated", true
        ));
    }

    /**
     * 클라이언트 IP 주소 가져오기
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
