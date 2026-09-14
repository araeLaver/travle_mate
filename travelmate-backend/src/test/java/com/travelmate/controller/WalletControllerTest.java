package com.travelmate.controller;

import com.travelmate.dto.WalletDto;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.JwtService;
import com.travelmate.service.nft.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = WalletController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@org.springframework.context.annotation.Import(com.travelmate.config.TestSecurityConfig.class)
class WalletControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WalletService walletService;

    @MockBean
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "1",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void 서명_메시지_생성_테스트() throws Exception {
        when(walletService.generateSignMessage("0x1234567890123456789012345678901234567890"))
                .thenReturn(WalletDto.SignMessageResponse.builder()
                        .message("Sign this")
                        .nonce("nonce")
                        .timestamp(1000L)
                        .expiresAt(2000L)
                        .build());

        mockMvc.perform(post("/wallet/sign-message")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"walletAddress\":\"0x1234567890123456789012345678901234567890\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Sign this"))
                .andExpect(jsonPath("$.nonce").value("nonce"));

        verify(walletService).generateSignMessage("0x1234567890123456789012345678901234567890");
    }

    @Test
    void 문자열_principal로_서명_검증과_지갑_연결을_호출한다() throws Exception {
        when(walletService.verifyAndConnect(any(), any()))
                .thenReturn(WalletDto.WalletConnectionResponse.builder()
                        .success(true)
                        .walletAddress("0x1234567890123456789012345678901234567890")
                        .isVerified(true)
                        .message("connected")
                        .build());

        mockMvc.perform(post("/wallet/verify")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "walletAddress": "0x1234567890123456789012345678901234567890",
                                  "message": "Sign this",
                                  "signature": "0xsig"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(walletService).verifyAndConnect(org.mockito.ArgumentMatchers.eq(1L), any(WalletDto.VerifySignatureRequest.class));
    }

    @Test
    void 문자열_principal로_지갑_상태를_조회한다() throws Exception {
        when(walletService.getWalletStatus(1L))
                .thenReturn(WalletDto.WalletStatusResponse.builder()
                        .isConnected(true)
                        .isVerified(true)
                        .walletAddress("0x1234567890123456789012345678901234567890")
                        .build());

        mockMvc.perform(get("/wallet/status")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connected").value(true))
                .andExpect(jsonPath("$.verified").value(true));

        verify(walletService).getWalletStatus(1L);
    }

    @Test
    void 문자열_principal로_지갑_연결을_해제한다() throws Exception {
        when(walletService.disconnectWallet(1L))
                .thenReturn(WalletDto.DisconnectResponse.builder()
                        .success(true)
                        .message("disconnected")
                        .build());

        mockMvc.perform(delete("/wallet/disconnect")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(walletService).disconnectWallet(1L);
    }
}
