package com.travelmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.UserBlockDto;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.UserBlockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserBlockController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("사용자 차단 컨트롤러 테스트")
class UserBlockControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserBlockService userBlockService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

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
    @DisplayName("POST /users/block - 문자열 principal을 차단 요청자 ID로 변환")
    void blockUser_UsesStringPrincipalUserId() throws Exception {
        UserBlockDto.BlockRequest request = UserBlockDto.BlockRequest.builder()
                .userId(2L)
                .reason("spam")
                .build();
        UserBlockDto.Response response = UserBlockDto.Response.builder()
                .id(10L)
                .blockedUser(UserBlockDto.UserInfo.builder().id(2L).username("blocked").build())
                .reason("spam")
                .createdAt(LocalDateTime.now())
                .build();

        when(userBlockService.blockUser(eq(1L), any(UserBlockDto.BlockRequest.class))).thenReturn(response);

        mockMvc.perform(post("/users/block")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.blockedUser.id").value(2));

        verify(userBlockService).blockUser(eq(1L), any(UserBlockDto.BlockRequest.class));
    }

    @Test
    @DisplayName("DELETE /users/block/{userId} - principal 사용자 ID로 차단 해제")
    void unblockUser_UsesStringPrincipalUserId() throws Exception {
        doNothing().when(userBlockService).unblockUser(1L, 2L);

        mockMvc.perform(delete("/users/block/2"))
                .andExpect(status().isNoContent());

        verify(userBlockService).unblockUser(1L, 2L);
    }

    @Test
    @DisplayName("GET /users/blocked - principal 사용자 ID로 차단 목록 조회")
    void getBlockedUsers_UsesStringPrincipalUserId() throws Exception {
        UserBlockDto.ListResponse response = UserBlockDto.ListResponse.builder()
                .blocks(Collections.emptyList())
                .totalCount(0L)
                .hasMore(false)
                .page(0)
                .size(20)
                .build();

        when(userBlockService.getBlockedUsers(eq(1L), any(Pageable.class))).thenReturn(response);

        mockMvc.perform(get("/users/blocked"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(0));

        verify(userBlockService).getBlockedUsers(eq(1L), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /users/block/{userId}/status - principal 사용자 ID로 차단 상태 조회")
    void getBlockStatus_UsesStringPrincipalUserId() throws Exception {
        UserBlockDto.StatusResponse response = UserBlockDto.StatusResponse.builder()
                .userId(2L)
                .isBlocked(true)
                .isBlockedBy(false)
                .isEitherBlocked(true)
                .build();

        when(userBlockService.getBlockStatus(1L, 2L)).thenReturn(response);

        mockMvc.perform(get("/users/block/2/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2))
                .andExpect(jsonPath("$.blocked").value(true));

        verify(userBlockService).getBlockStatus(1L, 2L);
    }

    @Test
    @DisplayName("POST /users/block/status/batch - principal 사용자 ID로 일괄 상태 조회")
    void getBatchBlockStatus_UsesStringPrincipalUserId() throws Exception {
        UserBlockDto.BatchStatusRequest request = UserBlockDto.BatchStatusRequest.builder()
                .userIds(List.of(2L, 3L))
                .build();
        UserBlockDto.BatchStatusResponse response = UserBlockDto.BatchStatusResponse.builder()
                .blockStatus(Map.of(2L, true, 3L, false))
                .build();

        when(userBlockService.getBatchBlockStatus(eq(1L), any(UserBlockDto.BatchStatusRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/users/block/status/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blockStatus.2").value(true))
                .andExpect(jsonPath("$.blockStatus.3").value(false));

        verify(userBlockService).getBatchBlockStatus(eq(1L), any(UserBlockDto.BatchStatusRequest.class));
    }

    @Test
    @DisplayName("GET /users/blocked/ids - principal 사용자 ID로 차단 ID 목록 조회")
    void getBlockedUserIds_UsesStringPrincipalUserId() throws Exception {
        when(userBlockService.getBlockedUserIds(1L)).thenReturn(List.of(2L, 3L));

        mockMvc.perform(get("/users/blocked/ids"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value(2))
                .andExpect(jsonPath("$[1]").value(3));

        verify(userBlockService).getBlockedUserIds(1L);
    }
}
