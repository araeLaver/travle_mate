package com.travelmate.controller;

import com.travelmate.dto.ActivityDto;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.ActivityService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ActivityController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("활동 컨트롤러 테스트")
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ActivityService activityService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

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
    @DisplayName("GET /activities/timeline - 문자열 principal을 사용자 ID로 변환")
    void getMyTimeline_UsesStringPrincipalUserId() throws Exception {
        ActivityDto.TimelineResponse response = ActivityDto.TimelineResponse.builder()
                .userId(1L)
                .activities(Collections.emptyList())
                .totalCount(0L)
                .hasMore(false)
                .page(0)
                .size(20)
                .build();

        when(activityService.getMyTimeline(eq(1L), any(Pageable.class))).thenReturn(response);

        mockMvc.perform(get("/activities/timeline"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.totalCount").value(0));

        verify(activityService).getMyTimeline(eq(1L), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /activities/users/{userId} - viewerId에 principal 사용자 ID 전달")
    void getUserActivities_UsesStringPrincipalViewerId() throws Exception {
        ActivityDto.FeedResponse response = ActivityDto.FeedResponse.builder()
                .activities(Collections.emptyList())
                .totalCount(0L)
                .hasMore(false)
                .page(0)
                .size(20)
                .build();

        when(activityService.getUserActivities(eq(2L), eq(1L), any(Pageable.class))).thenReturn(response);

        mockMvc.perform(get("/activities/users/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(0));

        verify(activityService).getUserActivities(eq(2L), eq(1L), any(Pageable.class));
    }
}
