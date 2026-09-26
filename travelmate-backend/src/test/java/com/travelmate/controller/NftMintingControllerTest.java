package com.travelmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.nft.MintingDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.MintStatus;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.UserService;
import com.travelmate.service.nft.NftMintingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = NftMintingController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@org.springframework.context.annotation.Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("NFT 민팅 컨트롤러 테스트")
class NftMintingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NftMintingService nftMintingService;

    @MockBean
    private UserService userService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setEmail("test@test.com");
        currentUser.setNickname("테스트유저");
        currentUser.setPassword("password");

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "1",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Nested
    @DisplayName("민팅 요청 테스트")
    class RequestMintingTest {

        @Test
        @DisplayName("POST /api/nft/mint/{collectionId} - 성공")
        void requestMinting_Success() throws Exception {
            // Given
            MintingDto.MintingRequest request = MintingDto.MintingRequest.builder()
                    .walletAddress("0x1234567890abcdef1234567890abcdef12345678")
                    .build();

            MintingDto.MintingResponse response = MintingDto.MintingResponse.builder()
                    .collectionId(1L)
                    .locationId(1L)
                    .locationName("테스트 장소")
                    .mintStatus(MintStatus.MINTING)
                    .walletAddress("0x1234567890abcdef1234567890abcdef12345678")
                    .message("민팅이 시작되었습니다.")
                    .build();

            when(nftMintingService.requestMinting(eq(1L), eq(1L), anyString())).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/nft/mint/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.collectionId").value(1))
                    .andExpect(jsonPath("$.locationName").value("테스트 장소"))
                    .andExpect(jsonPath("$.mintStatus").value("MINTING"))
                    .andExpect(jsonPath("$.message").value("민팅이 시작되었습니다."));
        }

        @Test
        @DisplayName("POST /api/nft/mint/{collectionId} - 지갑 주소 없이 요청")
        void requestMinting_WithoutWallet() throws Exception {
            // Given
            MintingDto.MintingResponse response = MintingDto.MintingResponse.builder()
                    .collectionId(1L)
                    .locationId(1L)
                    .locationName("테스트 장소")
                    .mintStatus(MintStatus.MINTING)
                    .walletAddress("0xexisting")
                    .message("민팅이 시작되었습니다.")
                    .build();

            when(nftMintingService.requestMinting(eq(1L), eq(1L), isNull())).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/nft/mint/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.mintStatus").value("MINTING"));
        }
    }

    @Nested
    @DisplayName("민팅 상태 조회 테스트")
    class GetMintingStatusTest {

        @Test
        @DisplayName("GET /api/nft/mint/status/{collectionId} - 성공")
        void getMintingStatus_Success() throws Exception {
            // Given
            MintingDto.MintingStatusResponse response = MintingDto.MintingStatusResponse.builder()
                    .collectionId(1L)
                    .locationId(1L)
                    .locationName("테스트 장소")
                    .nftImageUrl("https://example.com/nft.png")
                    .rarity("RARE")
                    .mintStatus(MintStatus.MINTED)
                    .tokenId("12345")
                    .transactionHash("0xabc123def456")
                    .contractAddress("0xcontract")
                    .walletAddress("0xwallet")
                    .build();

            when(nftMintingService.getMintingStatus(1L, 1L)).thenReturn(response);

            // When & Then
            mockMvc.perform(get("/nft/mint/status/1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.collectionId").value(1))
                    .andExpect(jsonPath("$.mintStatus").value("MINTED"))
                    .andExpect(jsonPath("$.tokenId").value("12345"))
                    .andExpect(jsonPath("$.transactionHash").value("0xabc123def456"))
                    .andExpect(jsonPath("$.rarity").value("RARE"));
        }

        @Test
        @DisplayName("GET /api/nft/mint/status/{collectionId} - 민팅 중")
        void getMintingStatus_Minting() throws Exception {
            // Given
            MintingDto.MintingStatusResponse response = MintingDto.MintingStatusResponse.builder()
                    .collectionId(1L)
                    .locationId(1L)
                    .locationName("테스트 장소")
                    .nftImageUrl("https://example.com/nft.png")
                    .rarity("COMMON")
                    .mintStatus(MintStatus.MINTING)
                    .walletAddress("0xwallet")
                    .build();

            when(nftMintingService.getMintingStatus(1L, 1L)).thenReturn(response);

            // When & Then
            mockMvc.perform(get("/nft/mint/status/1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.mintStatus").value("MINTING"))
                    .andExpect(jsonPath("$.tokenId").doesNotExist());
        }
    }

    @Nested
    @DisplayName("민팅 가능 NFT 목록 조회 테스트")
    class GetMintableNftsTest {

        @Test
        @DisplayName("GET /api/nft/mint/mintable - 성공")
        void getMintableNfts_Success() throws Exception {
            // Given
            MintingDto.MintableNftResponse nft1 = MintingDto.MintableNftResponse.builder()
                    .collectionId(1L)
                    .locationId(1L)
                    .locationName("장소1")
                    .locationDescription("설명1")
                    .nftImageUrl("https://example.com/nft1.png")
                    .rarity("COMMON")
                    .mintStatus(MintStatus.PENDING)
                    .collectedAt(LocalDateTime.now())
                    .earnedPoints(100)
                    .build();

            MintingDto.MintableNftResponse nft2 = MintingDto.MintableNftResponse.builder()
                    .collectionId(2L)
                    .locationId(2L)
                    .locationName("장소2")
                    .locationDescription("설명2")
                    .nftImageUrl("https://example.com/nft2.png")
                    .rarity("RARE")
                    .mintStatus(MintStatus.FAILED)
                    .collectedAt(LocalDateTime.now())
                    .earnedPoints(200)
                    .build();

            Page<MintingDto.MintableNftResponse> page = new PageImpl<>(
                    List.of(nft1, nft2), PageRequest.of(0, 20), 2);

            when(nftMintingService.getMintableNfts(eq(1L), any())).thenReturn(page);

            // When & Then
            mockMvc.perform(get("/nft/mint/mintable"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content[0].locationName").value("장소1"))
                    .andExpect(jsonPath("$.content[0].rarity").value("COMMON"))
                    .andExpect(jsonPath("$.content[1].locationName").value("장소2"))
                    .andExpect(jsonPath("$.content[1].mintStatus").value("FAILED"))
                    .andExpect(jsonPath("$.totalElements").value(2));
        }

        @Test
        @DisplayName("GET /api/nft/mint/mintable - 빈 목록")
        void getMintableNfts_Empty() throws Exception {
            // Given
            Page<MintingDto.MintableNftResponse> page = new PageImpl<>(
                    List.of(), PageRequest.of(0, 20), 0);

            when(nftMintingService.getMintableNfts(eq(1L), any())).thenReturn(page);

            // When & Then
            mockMvc.perform(get("/nft/mint/mintable"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isEmpty())
                    .andExpect(jsonPath("$.totalElements").value(0));
        }
    }

    @Nested
    @DisplayName("민팅 재시도 테스트")
    class RetryMintingTest {

        @Test
        @DisplayName("POST /api/nft/mint/{collectionId}/retry - 성공")
        void retryMinting_Success() throws Exception {
            // Given
            MintingDto.MintingResponse response = MintingDto.MintingResponse.builder()
                    .collectionId(1L)
                    .locationId(1L)
                    .locationName("테스트 장소")
                    .mintStatus(MintStatus.MINTING)
                    .walletAddress("0xwallet")
                    .message("민팅이 재시도됩니다.")
                    .build();

            when(nftMintingService.retryMinting(1L, 1L)).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/nft/mint/1/retry")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.collectionId").value(1))
                    .andExpect(jsonPath("$.mintStatus").value("MINTING"))
                    .andExpect(jsonPath("$.message").value("민팅이 재시도됩니다."));
        }
    }

    @Nested
    @DisplayName("민팅 통계 조회 테스트")
    class GetMintingStatsTest {

        @Test
        @DisplayName("GET /api/nft/mint/stats - 성공")
        void getMintingStats_Success() throws Exception {
            // Given
            MintingDto.MintingStatsResponse stats = MintingDto.MintingStatsResponse.builder()
                    .totalCollected(10L)
                    .mintedCount(5L)
                    .pendingCount(3L)
                    .mintingCount(1L)
                    .failedCount(1L)
                    .build();

            when(nftMintingService.getMintingStats(1L)).thenReturn(stats);

            // When & Then
            mockMvc.perform(get("/nft/mint/stats"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalCollected").value(10))
                    .andExpect(jsonPath("$.mintedCount").value(5))
                    .andExpect(jsonPath("$.pendingCount").value(3))
                    .andExpect(jsonPath("$.mintingCount").value(1))
                    .andExpect(jsonPath("$.failedCount").value(1));
        }

        @Test
        @DisplayName("GET /api/nft/mint/stats - NFT 없음")
        void getMintingStats_NoNfts() throws Exception {
            // Given
            MintingDto.MintingStatsResponse stats = MintingDto.MintingStatsResponse.builder()
                    .totalCollected(0L)
                    .mintedCount(0L)
                    .pendingCount(0L)
                    .mintingCount(0L)
                    .failedCount(0L)
                    .build();

            when(nftMintingService.getMintingStats(1L)).thenReturn(stats);

            // When & Then
            mockMvc.perform(get("/nft/mint/stats"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalCollected").value(0));
        }
    }
}
