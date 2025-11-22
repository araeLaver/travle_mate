package com.travelmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.User;
import com.travelmate.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@org.springframework.context.annotation.Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("사용자 컨트롤러 테스트")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

    @MockBean
    private com.travelmate.repository.UserReviewRepository userReviewRepository;

    @MockBean
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private UserDto.RegisterRequest registerRequest;
    private UserDto.Response userResponse;
    private UserDto.LoginResponse loginResponse;

    @BeforeEach
    void setUp() {
        registerRequest = new UserDto.RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setNickname("testuser");
        registerRequest.setPassword("password123");

        userResponse = UserDto.Response.builder()
                .id(1L)
                .email("test@example.com")
                .nickname("testuser")
                .fullName("테스트 사용자")
                .age(25)
                .gender(User.Gender.MALE)
                .rating(0.0)
                .reviewCount(0)
                .build();

        loginResponse = new UserDto.LoginResponse();
        loginResponse.setToken("jwt.token.here");
        loginResponse.setUser(userResponse);
    }

    @Test
    @DisplayName("사용자 등록 - 성공")
    void registerUser_Success() throws Exception {
        // Given
        when(userService.registerUser(any(UserDto.RegisterRequest.class)))
                .thenReturn(userResponse);

        // When & Then
        mockMvc.perform(post("/users/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userResponse.getId()))
                .andExpect(jsonPath("$.email").value(userResponse.getEmail()))
                .andExpect(jsonPath("$.nickname").value(userResponse.getNickname()));
    }

    @Test
    @DisplayName("로그인 - 성공")
    void login_Success() throws Exception {
        // Given
        UserDto.LoginRequest loginRequest = new UserDto.LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        when(userService.loginUser(loginRequest))
                .thenReturn(loginResponse);

        // When & Then
        mockMvc.perform(post("/users/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(loginResponse.getToken()))
                .andExpect(jsonPath("$.user.id").value(userResponse.getId()));
    }

    @Test
    @WithMockUser(username = "1")
    @DisplayName("사용자 프로필 조회 - 성공")
    void getUserProfile_Success() throws Exception {
        // Given
        when(userService.getUserProfile(1L)).thenReturn(userResponse);

        // When & Then
        mockMvc.perform(get("/users/profile/1"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userResponse.getId()))
                .andExpect(jsonPath("$.email").value(userResponse.getEmail()));
    }

    @Test
    @WithMockUser(username = "1")
    @DisplayName("사용자 프로필 업데이트 - 성공")
    void updateUserProfile_Success() throws Exception {
        // Given
        UserDto.UpdateProfileRequest updateRequest = new UserDto.UpdateProfileRequest();
        updateRequest.setBio("새로운 소개");
        updateRequest.setTravelStyle(User.TravelStyle.ADVENTURE);

        UserDto.Response updatedResponse = UserDto.Response.builder()
                .id(1L)
                .email("test@example.com")
                .nickname("testuser")
                .fullName("업데이트된 이름")
                .bio("새로운 소개")
                .age(26)
                .travelStyle(User.TravelStyle.ADVENTURE)
                .rating(0.0)
                .reviewCount(0)
                .build();

        when(userService.updateUserProfile(any(Long.class), any(UserDto.UpdateProfileRequest.class)))
                .thenReturn(updatedResponse);

        // When & Then
        mockMvc.perform(put("/users/profile")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("새로운 소개"));
    }
}