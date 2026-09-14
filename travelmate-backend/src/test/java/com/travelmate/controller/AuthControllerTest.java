package com.travelmate.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.AuthDto;
import com.travelmate.dto.UserDto;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@org.springframework.context.annotation.Import(com.travelmate.config.TestSecurityConfig.class)
@ActiveProfiles("test")
@DisplayName("인증 컨트롤러 테스트")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    @DisplayName("웹 로그인은 refresh token을 쿠키로만 전달한다")
    void login_WebClient_StripsRefreshTokenFromBody() throws Exception {
        when(authService.login(any(UserDto.LoginRequest.class), any(), any(), any(), any()))
                .thenReturn(loginResponse());

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest())))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("refreshToken=refresh-token")))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.path("refreshToken").isMissingNode() || json.path("refreshToken").isNull()).isTrue();
    }

    @Test
    @DisplayName("모바일 로그인은 refresh token을 응답 본문에도 유지한다")
    void login_MobileClient_KeepsRefreshTokenInBody() throws Exception {
        when(authService.login(any(UserDto.LoginRequest.class), any(), any(), any(), any()))
                .thenReturn(loginResponse());

        mockMvc.perform(post("/auth/login")
                        .header("X-Client-Type", "mobile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest())))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("refreshToken=refresh-token")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.refreshToken").value("refresh-token"));
    }

    @Test
    @DisplayName("웹 토큰 갱신은 새 refresh token을 쿠키로만 전달한다")
    void refresh_WebClient_StripsRefreshTokenFromBody() throws Exception {
        when(authService.refreshToken(any(), any())).thenReturn(tokenResponse());

        MvcResult result = mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest())))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("refreshToken=refresh-token")))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.path("refreshToken").isMissingNode() || json.path("refreshToken").isNull()).isTrue();
    }

    @Test
    @DisplayName("본문 기반 토큰 갱신은 refresh token과 deviceId를 서비스에 전달한다")
    void refresh_BodyToken_PassesRefreshTokenAndDeviceId() throws Exception {
        when(authService.refreshToken(any(), any())).thenReturn(tokenResponse());

        mockMvc.perform(post("/auth/refresh")
                        .header("X-Client-Type", "mobile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest("body-refresh-token", "mobile-device"))))
                .andExpect(status().isOk());

        verify(authService).refreshToken("body-refresh-token", "mobile-device");
    }

    @Test
    @DisplayName("쿠키와 본문 토큰이 함께 오면 쿠키 토큰을 우선하고 본문 deviceId를 전달한다")
    void refresh_CookieToken_PrefersCookieTokenAndPassesBodyDeviceId() throws Exception {
        when(authService.refreshToken(any(), any())).thenReturn(tokenResponse());

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("refreshToken", "cookie-refresh-token"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest("body-refresh-token", "web-device"))))
                .andExpect(status().isOk());

        verify(authService).refreshToken("cookie-refresh-token", "web-device");
    }

    @Test
    @DisplayName("모바일 토큰 갱신은 새 refresh token을 응답 본문에도 유지한다")
    void refresh_MobileClient_KeepsRefreshTokenInBody() throws Exception {
        when(authService.refreshToken(any(), any())).thenReturn(tokenResponse());

        mockMvc.perform(post("/auth/refresh")
                        .header("X-Client-Type", "mobile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest())))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("refreshToken=refresh-token")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.refreshToken").value("refresh-token"));
    }

    @Test
    @DisplayName("OAuth access token 로그인은 허용되지 않은 provider를 거부한다")
    void oauthLogin_InvalidProvider_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "provider": "github",
                                  "accessToken": "provider-token"
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(authService, never()).oauthLogin(any(AuthDto.OAuthLoginRequest.class), any(), any());
    }

    @Test
    @DisplayName("OAuth code 로그인은 Google provider를 거부한다")
    void oauthCodeLogin_InvalidProvider_ReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/auth/oauth/code-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "provider": "google",
                                  "code": "auth-code",
                                  "redirectUri": "http://localhost/auth/callback"
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(authService, never()).oauthCodeLogin(any(AuthDto.OAuthCodeLoginRequest.class), any(), any());
    }

    private UserDto.LoginRequest loginRequest() {
        UserDto.LoginRequest request = new UserDto.LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("Password1!");
        return request;
    }

    private AuthDto.RefreshTokenRequest refreshRequest() {
        return refreshRequest("refresh-token", "mobile-device");
    }

    private AuthDto.RefreshTokenRequest refreshRequest(String refreshToken, String deviceId) {
        AuthDto.RefreshTokenRequest request = new AuthDto.RefreshTokenRequest();
        request.setRefreshToken(refreshToken);
        request.setDeviceId(deviceId);
        return request;
    }

    private AuthDto.LoginResponse loginResponse() {
        return AuthDto.LoginResponse.builder()
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .expiresIn(3600L)
                .tokenType("Bearer")
                .build();
    }

    private AuthDto.TokenResponse tokenResponse() {
        return AuthDto.TokenResponse.builder()
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .expiresIn(3600L)
                .tokenType("Bearer")
                .build();
    }
}
