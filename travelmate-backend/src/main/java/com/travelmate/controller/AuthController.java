package com.travelmate.controller;

import com.travelmate.dto.AuthDto;
import com.travelmate.dto.UserDto;
import com.travelmate.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final Environment environment;

    @Value("${app.jwt.refresh-expiration:604800000}")
    private Long refreshTokenExpiration;

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

    /**
     * 로그인 - Access Token + Refresh Token 발급
     * Refresh Token은 httpOnly 쿠키로 전송하여 XSS 공격 방지
     */
    @PostMapping("/login")
    public ResponseEntity<AuthDto.LoginResponse> login(
            @Valid @RequestBody UserDto.LoginRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            @RequestHeader(value = "X-Device-Name", required = false) String deviceName,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AuthDto.LoginResponse response = authService.login(request, deviceId, deviceName, ipAddress, userAgent);

        // Refresh Token을 httpOnly 쿠키로 설정
        setRefreshTokenCookie(httpResponse, response.getRefreshToken());

        // 응답에서 refresh token 제거 (쿠키로만 전송)
        response.setRefreshToken(null);

        return ResponseEntity.ok(response);
    }

    /**
     * 토큰 갱신 - Refresh Token으로 새 Access Token 발급
     * Refresh Token은 httpOnly 쿠키에서 읽음
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthDto.TokenResponse> refreshToken(
            @CookieValue(value = REFRESH_TOKEN_COOKIE_NAME, required = false) String cookieRefreshToken,
            @RequestBody(required = false) AuthDto.RefreshTokenRequest request,
            HttpServletResponse httpResponse) {

        // 쿠키에서 우선 읽고, 없으면 요청 본문에서 읽음 (하위 호환성)
        String refreshToken = cookieRefreshToken;
        String deviceId = null;

        if (refreshToken == null && request != null) {
            refreshToken = request.getRefreshToken();
            deviceId = request.getDeviceId();
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).build();
        }

        AuthDto.TokenResponse response = authService.refreshToken(refreshToken, deviceId);

        // 새로운 refresh token이 발급되었다면 쿠키 갱신
        if (response.getRefreshToken() != null) {
            setRefreshTokenCookie(httpResponse, response.getRefreshToken());
            response.setRefreshToken(null);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 로그아웃 - Refresh Token 무효화 및 쿠키 삭제
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @AuthenticationPrincipal String userId,
            @CookieValue(value = REFRESH_TOKEN_COOKIE_NAME, required = false) String cookieRefreshToken,
            @RequestBody(required = false) AuthDto.LogoutRequest request,
            HttpServletResponse httpResponse) {

        Long userIdLong = Long.parseLong(userId);

        // 쿠키에서 우선 읽고, 없으면 요청 본문에서 읽음
        String refreshToken = cookieRefreshToken;
        if (refreshToken == null && request != null) {
            refreshToken = request.getRefreshToken();
        }

        boolean logoutAll = request != null && request.isLogoutAll();

        authService.logout(userIdLong, refreshToken, logoutAll);

        // Refresh Token 쿠키 삭제
        clearRefreshTokenCookie(httpResponse);

        return ResponseEntity.ok(Map.of("message", "로그아웃되었습니다."));
    }

    /**
     * OAuth 소셜 로그인
     * Refresh Token은 httpOnly 쿠키로 전송
     */
    @PostMapping("/oauth/login")
    public ResponseEntity<AuthDto.LoginResponse> oauthLogin(
            @Valid @RequestBody AuthDto.OAuthLoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AuthDto.LoginResponse response = authService.oauthLogin(request, ipAddress, userAgent);

        // Refresh Token을 httpOnly 쿠키로 설정
        setRefreshTokenCookie(httpResponse, response.getRefreshToken());

        // 응답에서 refresh token 제거
        response.setRefreshToken(null);

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
     * 신뢰할 수 있는 프록시 헤더에서 실제 클라이언트 IP 추출
     */
    private String getClientIpAddress(HttpServletRequest request) {
        // X-Forwarded-For 헤더에서 첫 번째 IP가 실제 클라이언트 IP
        // 단, 신뢰할 수 있는 프록시 뒤에서만 이 헤더를 신뢰해야 함
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // 첫 번째 IP만 사용 (클라이언트 IP)
            String clientIp = xForwardedFor.split(",")[0].trim();
            // 기본적인 IP 형식 검증
            if (isValidIpAddress(clientIp)) {
                return clientIp;
            }
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && isValidIpAddress(xRealIp)) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * IP 주소 형식 검증 (기본적인 검증)
     */
    private boolean isValidIpAddress(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }
        // IPv4 또는 IPv6 기본 형식 검증
        return ip.matches("^[0-9a-fA-F.:]+$") && ip.length() <= 45;
    }

    /**
     * Refresh Token을 httpOnly 쿠키로 설정
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        if (refreshToken == null) {
            return;
        }

        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
        cookie.setHttpOnly(true);  // JavaScript 접근 불가 (XSS 방지)
        cookie.setSecure(isProd);  // 프로덕션에서는 HTTPS만 허용
        cookie.setPath("/api/auth");  // 인증 관련 경로에서만 전송
        cookie.setMaxAge((int) (refreshTokenExpiration / 1000));  // 밀리초를 초로 변환

        // SameSite 속성 설정 (CSRF 방지)
        // Spring에서 Cookie 객체는 SameSite를 직접 지원하지 않으므로 헤더로 설정
        String cookieValue = String.format(
            "%s=%s; HttpOnly; Path=/api/auth; Max-Age=%d; SameSite=Strict%s",
            REFRESH_TOKEN_COOKIE_NAME,
            refreshToken,
            refreshTokenExpiration / 1000,
            isProd ? "; Secure" : ""
        );
        response.addHeader("Set-Cookie", cookieValue);
    }

    /**
     * Refresh Token 쿠키 삭제
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        String cookieValue = String.format(
            "%s=; HttpOnly; Path=/api/auth; Max-Age=0; SameSite=Strict%s",
            REFRESH_TOKEN_COOKIE_NAME,
            isProd ? "; Secure" : ""
        );
        response.addHeader("Set-Cookie", cookieValue);
    }
}
