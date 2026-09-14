package com.travelmate.controller;

import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.PostService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PostController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("PostController 계약 테스트")
class PostControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PostService postService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

    @Test
    @DisplayName("GET /posts/nearby - 잘못된 위도는 BAD_REQUEST")
    void getNearbyPosts_InvalidLatitude_ReturnsBadRequestContract() throws Exception {
        mockMvc.perform(get("/posts/nearby")
                        .param("latitude", "100")
                        .param("longitude", "126.9780"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("위도는 -90에서 90 사이여야 합니다."));
    }

    @Test
    @DisplayName("GET /posts/nearby - 잘못된 경도는 BAD_REQUEST")
    void getNearbyPosts_InvalidLongitude_ReturnsBadRequestContract() throws Exception {
        mockMvc.perform(get("/posts/nearby")
                        .param("latitude", "37.5665")
                        .param("longitude", "200"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("경도는 -180에서 180 사이여야 합니다."));
    }

    @Test
    @DisplayName("GET /posts/nearby - 잘못된 반경은 BAD_REQUEST")
    void getNearbyPosts_InvalidRadius_ReturnsBadRequestContract() throws Exception {
        mockMvc.perform(get("/posts/nearby")
                        .param("latitude", "37.5665")
                        .param("longitude", "126.9780")
                        .param("radiusKm", "150"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("반경은 0~100km 이내여야 합니다."));
    }
}
