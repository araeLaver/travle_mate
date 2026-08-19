package com.travelmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.FollowDto;
import com.travelmate.entity.User;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.FollowService;
import com.travelmate.service.UserService;
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

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = FollowController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@org.springframework.context.annotation.Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("팔로우 컨트롤러 테스트")
class FollowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FollowService followService;

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
    @DisplayName("팔로우 API 테스트")
    class FollowApiTest {

        @Test
        @DisplayName("POST /api/users/{userId}/follow - 성공")
        void follow_Success() throws Exception {
            // Given
            FollowDto.FollowStatsResponse stats = FollowDto.FollowStatsResponse.builder()
                    .userId(2L)
                    .followerCount(10L)
                    .followingCount(5L)
                    .build();

            FollowDto.FollowResponse response = FollowDto.FollowResponse.builder()
                    .success(true)
                    .isFollowing(true)
                    .isMutual(false)
                    .stats(stats)
                    .message("팔로잉님을 팔로우합니다.")
                    .build();

            when(followService.follow(1L, 2L)).thenReturn(response);

            // When & Then
            mockMvc.perform(post("/users/2/follow")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.following").value(true))
                    .andExpect(jsonPath("$.mutual").value(false))
                    .andExpect(jsonPath("$.stats.followerCount").value(10))
                    .andExpect(jsonPath("$.stats.followingCount").value(5));
        }

        @Test
        @DisplayName("DELETE /api/users/{userId}/follow - 언팔로우 성공")
        void unfollow_Success() throws Exception {
            // Given
            FollowDto.FollowStatsResponse stats = FollowDto.FollowStatsResponse.builder()
                    .userId(2L)
                    .followerCount(9L)
                    .followingCount(5L)
                    .build();

            FollowDto.FollowResponse response = FollowDto.FollowResponse.builder()
                    .success(true)
                    .isFollowing(false)
                    .isMutual(false)
                    .stats(stats)
                    .message("언팔로우했습니다.")
                    .build();

            when(followService.unfollow(1L, 2L)).thenReturn(response);

            // When & Then
            mockMvc.perform(delete("/users/2/follow")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.following").value(false));
        }
    }

    @Nested
    @DisplayName("팔로워/팔로잉 목록 조회 테스트")
    class GetFollowListTest {

        @Test
        @DisplayName("GET /api/users/{userId}/followers - 팔로워 목록")
        void getFollowers_Success() throws Exception {
            // Given
            FollowDto.FollowUserResponse follower = FollowDto.FollowUserResponse.builder()
                    .id(2L)
                    .nickname("팔로워1")
                    .profileImageUrl("https://example.com/profile.jpg")
                    .isMutual(true)
                    .build();

            Page<FollowDto.FollowUserResponse> page = new PageImpl<>(
                    List.of(follower), PageRequest.of(0, 20), 1);

            when(followService.getFollowers(eq(1L), eq(1L), any())).thenReturn(page);

            // When & Then
            mockMvc.perform(get("/users/1/followers"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(2))
                    .andExpect(jsonPath("$.content[0].nickname").value("팔로워1"))
                    .andExpect(jsonPath("$.content[0].mutual").value(true))
                    .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        @DisplayName("GET /api/users/{userId}/following - 팔로잉 목록")
        void getFollowing_Success() throws Exception {
            // Given
            FollowDto.FollowUserResponse following = FollowDto.FollowUserResponse.builder()
                    .id(3L)
                    .nickname("팔로잉1")
                    .profileImageUrl(null)
                    .isMutual(false)
                    .build();

            Page<FollowDto.FollowUserResponse> page = new PageImpl<>(
                    List.of(following), PageRequest.of(0, 20), 1);

            when(followService.getFollowing(eq(1L), eq(1L), any())).thenReturn(page);

            // When & Then
            mockMvc.perform(get("/users/1/following"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(3))
                    .andExpect(jsonPath("$.content[0].nickname").value("팔로잉1"));
        }

        @Test
        @DisplayName("GET /api/users/me/followers - 내 팔로워 목록")
        void getMyFollowers_Success() throws Exception {
            // Given
            Page<FollowDto.FollowUserResponse> page = new PageImpl<>(
                    List.of(), PageRequest.of(0, 20), 0);

            when(followService.getFollowers(eq(1L), eq(1L), any())).thenReturn(page);

            // When & Then
            mockMvc.perform(get("/users/me/followers"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.totalElements").value(0));
        }

        @Test
        @DisplayName("GET /api/users/me/following - 내 팔로잉 목록")
        void getMyFollowing_Success() throws Exception {
            // Given
            Page<FollowDto.FollowUserResponse> page = new PageImpl<>(
                    List.of(), PageRequest.of(0, 20), 0);

            when(followService.getFollowing(eq(1L), eq(1L), any())).thenReturn(page);

            // When & Then
            mockMvc.perform(get("/users/me/following"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }
    }

    @Nested
    @DisplayName("팔로우 통계 및 상태 조회 테스트")
    class GetFollowStatsTest {

        @Test
        @DisplayName("GET /api/users/{userId}/follow-stats - 통계 조회")
        void getFollowStats_Success() throws Exception {
            // Given
            FollowDto.FollowStatsResponse stats = FollowDto.FollowStatsResponse.builder()
                    .userId(1L)
                    .followerCount(100L)
                    .followingCount(50L)
                    .build();

            when(followService.getFollowStats(1L)).thenReturn(stats);

            // When & Then
            mockMvc.perform(get("/users/1/follow-stats"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId").value(1))
                    .andExpect(jsonPath("$.followerCount").value(100))
                    .andExpect(jsonPath("$.followingCount").value(50));
        }

        @Test
        @DisplayName("GET /api/users/me/follow-stats - 내 통계 조회")
        void getMyFollowStats_Success() throws Exception {
            // Given
            FollowDto.FollowStatsResponse stats = FollowDto.FollowStatsResponse.builder()
                    .userId(1L)
                    .followerCount(10L)
                    .followingCount(5L)
                    .build();

            when(followService.getFollowStats(1L)).thenReturn(stats);

            // When & Then
            mockMvc.perform(get("/users/me/follow-stats"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId").value(1));
        }

        @Test
        @DisplayName("GET /api/users/{userId}/follow-status - 상태 조회")
        void getFollowStatus_Success() throws Exception {
            // Given
            FollowDto.FollowStatusResponse status = FollowDto.FollowStatusResponse.builder()
                    .isFollowing(true)
                    .isFollowedBy(true)
                    .isMutual(true)
                    .build();

            when(followService.getFollowStatus(1L, 2L)).thenReturn(status);

            // When & Then
            mockMvc.perform(get("/users/2/follow-status"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.following").value(true))
                    .andExpect(jsonPath("$.followedBy").value(true))
                    .andExpect(jsonPath("$.mutual").value(true));
        }
    }

    @Nested
    @DisplayName("맞팔로우 및 배치 조회 테스트")
    class MutualAndBatchTest {

        @Test
        @DisplayName("GET /api/users/{userId}/mutual-followers - 맞팔 목록")
        void getMutualFollowers_Success() throws Exception {
            // Given
            FollowDto.FollowUserResponse mutualFollower = FollowDto.FollowUserResponse.builder()
                    .id(2L)
                    .nickname("맞팔유저")
                    .isMutual(true)
                    .build();

            Page<FollowDto.FollowUserResponse> page = new PageImpl<>(
                    List.of(mutualFollower), PageRequest.of(0, 20), 1);

            when(followService.getMutualFollowers(eq(1L), any())).thenReturn(page);

            // When & Then
            mockMvc.perform(get("/users/1/mutual-followers"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].nickname").value("맞팔유저"))
                    .andExpect(jsonPath("$.content[0].mutual").value(true));
        }

        @Test
        @DisplayName("POST /api/users/follow-status/batch - 배치 조회")
        void getFollowStatusBatch_Success() throws Exception {
            // Given
            FollowDto.UserWithFollowStatus user1 = FollowDto.UserWithFollowStatus.builder()
                    .id(2L)
                    .nickname("유저2")
                    .isFollowing(true)
                    .build();

            FollowDto.UserWithFollowStatus user2 = FollowDto.UserWithFollowStatus.builder()
                    .id(3L)
                    .nickname("유저3")
                    .isFollowing(false)
                    .build();

            when(followService.getUsersWithFollowStatus(eq(1L), anyList()))
                    .thenReturn(List.of(user1, user2));

            Map<String, List<Long>> request = Map.of("userIds", List.of(2L, 3L));

            // When & Then
            mockMvc.perform(post("/users/follow-status/batch")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(2))
                    .andExpect(jsonPath("$[0].following").value(true))
                    .andExpect(jsonPath("$[1].id").value(3))
                    .andExpect(jsonPath("$[1].following").value(false));
        }

        @Test
        @DisplayName("POST /api/users/follow-status/batch - 빈 요청")
        void getFollowStatusBatch_EmptyRequest() throws Exception {
            // Given
            Map<String, List<Long>> request = Map.of("userIds", List.of());

            // When & Then
            mockMvc.perform(post("/users/follow-status/batch")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }
    }
}
