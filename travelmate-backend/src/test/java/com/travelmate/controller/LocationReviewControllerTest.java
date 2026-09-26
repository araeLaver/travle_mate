package com.travelmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.nft.LocationReviewDto;
import com.travelmate.entity.User;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.UserService;
import com.travelmate.service.nft.LocationReviewService;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = LocationReviewController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@org.springframework.context.annotation.Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("위치 리뷰 컨트롤러 테스트")
class LocationReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LocationReviewService locationReviewService;

    @MockBean
    private UserService userService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User currentUser;
    private LocationReviewDto.Response reviewResponse;

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

        LocationReviewDto.ReviewerInfo reviewerInfo = LocationReviewDto.ReviewerInfo.builder()
                .id(1L)
                .nickname("테스트유저")
                .profileImageUrl(null)
                .build();

        reviewResponse = LocationReviewDto.Response.builder()
                .id(1L)
                .reviewer(reviewerInfo)
                .locationId(1L)
                .locationName("테스트 장소")
                .rating(5)
                .comment("좋은 장소입니다")
                .visitedSeason("SPRING")
                .helpfulCount(10)
                .isHelpful(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("리뷰 작성 테스트")
    class CreateReviewTest {

        @Test
        @DisplayName("POST /api/locations/{locationId}/reviews - 성공")
        void createReview_Success() throws Exception {
            // Given
            LocationReviewDto.CreateRequest request = new LocationReviewDto.CreateRequest();
            request.setRating(5);
            request.setComment("좋은 장소입니다");

            when(locationReviewService.createReview(eq(1L), eq(1L), any())).thenReturn(reviewResponse);

            // When & Then
            mockMvc.perform(post("/locations/1/reviews")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.rating").value(5))
                    .andExpect(jsonPath("$.comment").value("좋은 장소입니다"))
                    .andExpect(jsonPath("$.locationName").value("테스트 장소"));
        }

        @Test
        @DisplayName("POST /api/locations/{locationId}/reviews - 유효성 검증 실패")
        void createReview_ValidationFail() throws Exception {
            // Given - rating이 없는 요청
            LocationReviewDto.CreateRequest request = new LocationReviewDto.CreateRequest();
            request.setComment("좋은 장소입니다");

            // When & Then
            mockMvc.perform(post("/locations/1/reviews")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("리뷰 수정/삭제 테스트")
    class UpdateDeleteReviewTest {

        @Test
        @DisplayName("PUT /api/reviews/{reviewId} - 수정 성공")
        void updateReview_Success() throws Exception {
            // Given
            LocationReviewDto.UpdateRequest request = new LocationReviewDto.UpdateRequest();
            request.setRating(4);
            request.setComment("수정된 리뷰입니다");

            LocationReviewDto.ReviewerInfo reviewerInfo = LocationReviewDto.ReviewerInfo.builder()
                    .id(1L)
                    .nickname("테스트유저")
                    .build();

            LocationReviewDto.Response updatedResponse = LocationReviewDto.Response.builder()
                    .id(1L)
                    .reviewer(reviewerInfo)
                    .locationId(1L)
                    .locationName("테스트 장소")
                    .rating(4)
                    .comment("수정된 리뷰입니다")
                    .helpfulCount(10)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            when(locationReviewService.updateReview(eq(1L), eq(1L), any())).thenReturn(updatedResponse);

            // When & Then
            mockMvc.perform(put("/reviews/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.rating").value(4))
                    .andExpect(jsonPath("$.comment").value("수정된 리뷰입니다"));
        }

        @Test
        @DisplayName("DELETE /api/reviews/{reviewId} - 삭제 성공")
        void deleteReview_Success() throws Exception {
            // Given
            doNothing().when(locationReviewService).deleteReview(1L, 1L);

            // When & Then
            mockMvc.perform(delete("/reviews/1")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("리뷰 조회 테스트")
    class GetReviewTest {

        @Test
        @DisplayName("GET /api/locations/{locationId}/reviews - 목록 조회")
        void getLocationReviews_Success() throws Exception {
            // Given
            Page<LocationReviewDto.Response> page = new PageImpl<>(
                    List.of(reviewResponse), PageRequest.of(0, 10), 1);

            when(locationReviewService.getLocationReviews(eq(1L), eq(1L), eq("recent"), any()))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/locations/1/reviews")
                            .param("sort", "recent"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(1))
                    .andExpect(jsonPath("$.content[0].rating").value(5))
                    .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        @DisplayName("GET /api/locations/{locationId}/reviews - 도움순 정렬")
        void getLocationReviews_SortByHelpful() throws Exception {
            // Given
            Page<LocationReviewDto.Response> page = new PageImpl<>(
                    List.of(reviewResponse), PageRequest.of(0, 10), 1);

            when(locationReviewService.getLocationReviews(eq(1L), eq(1L), eq("helpful"), any()))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/locations/1/reviews")
                            .param("sort", "helpful"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
        }

        @Test
        @DisplayName("GET /api/users/{userId}/reviews - 사용자 리뷰 목록")
        void getUserReviews_Success() throws Exception {
            // Given
            Page<LocationReviewDto.Response> page = new PageImpl<>(
                    List.of(reviewResponse), PageRequest.of(0, 10), 1);

            when(locationReviewService.getUserReviews(eq(1L), eq(2L), any()))
                    .thenReturn(page);

            // When & Then
            mockMvc.perform(get("/users/2/reviews"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].reviewer.id").value(1));
        }

        @Test
        @DisplayName("GET /api/reviews/{reviewId} - 상세 조회")
        void getReview_Success() throws Exception {
            // Given
            when(locationReviewService.getReview(1L, 1L)).thenReturn(reviewResponse);

            // When & Then
            mockMvc.perform(get("/reviews/1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.comment").value("좋은 장소입니다"));
        }
    }

    @Nested
    @DisplayName("도움됨/통계 테스트")
    class HelpfulAndStatsTest {

        @Test
        @DisplayName("POST /api/reviews/{reviewId}/helpful - 도움됨 추가")
        void toggleHelpful_Add() throws Exception {
            // Given
            when(locationReviewService.toggleHelpful(1L, 1L)).thenReturn(true);

            // When & Then
            mockMvc.perform(post("/reviews/1/helpful")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isHelpful").value(true));
        }

        @Test
        @DisplayName("POST /api/reviews/{reviewId}/helpful - 도움됨 취소")
        void toggleHelpful_Remove() throws Exception {
            // Given
            when(locationReviewService.toggleHelpful(1L, 1L)).thenReturn(false);

            // When & Then
            mockMvc.perform(post("/reviews/1/helpful")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isHelpful").value(false));
        }

        @Test
        @DisplayName("GET /api/locations/{locationId}/reviews/stats - 통계 조회")
        void getLocationReviewStats_Success() throws Exception {
            // Given
            LocationReviewDto.LocationReviewStats stats = LocationReviewDto.LocationReviewStats.builder()
                    .locationId(1L)
                    .averageRating(4.5)
                    .reviewCount(100L)
                    .build();

            when(locationReviewService.getLocationReviewStats(1L)).thenReturn(stats);

            // When & Then
            mockMvc.perform(get("/locations/1/reviews/stats"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.locationId").value(1))
                    .andExpect(jsonPath("$.averageRating").value(4.5))
                    .andExpect(jsonPath("$.reviewCount").value(100));
        }
    }
}
