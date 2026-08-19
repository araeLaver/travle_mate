package com.travelmate.controller;

import com.travelmate.repository.UserRepository;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.JwtService;
import com.travelmate.service.TwoFactorAuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = TwoFactorAuthController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("2FA 컨트롤러 테스트")
class TwoFactorAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TwoFactorAuthService twoFactorAuthService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("인증 principal의 사용자가 없으면 404와 USER_NOT_FOUND를 반환한다")
    void getStatus_UserNotFound_ReturnsNotFoundContract() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/auth/2fa/status")
                        .with(authentication(new UsernamePasswordAuthenticationToken(
                                "99",
                                null,
                                Collections.emptyList()
                        ))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"))
                .andExpect(jsonPath("$.status").value(404));

        verify(twoFactorAuthService, never()).verifyTwoFactorCode(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }
}
