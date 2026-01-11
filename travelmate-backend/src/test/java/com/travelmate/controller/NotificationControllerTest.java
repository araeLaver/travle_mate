package com.travelmate.controller;

import com.travelmate.entity.Notification;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.service.JwtService;
import com.travelmate.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * NotificationController 통합 테스트
 */
@WebMvcTest(controllers = NotificationController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@org.springframework.context.annotation.Import(com.travelmate.config.TestSecurityConfig.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        // 각 테스트 전에 SecurityContext 설정
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "1",  // principal - String userId
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void 알림_목록_조회_테스트() throws Exception {
        // Given
        NotificationService.NotificationDto dto = NotificationService.NotificationDto.builder()
                .id(1L)
                .type(Notification.NotificationType.GROUP_INVITE)
                .title("그룹 초대")
                .message("새로운 그룹에 초대되었습니다")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.getNotifications(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        // When & Then
        mockMvc.perform(get("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].title").value("그룹 초대"));

        verify(notificationService, times(1)).getNotifications(eq(1L), any(Pageable.class));
    }

    @Test
    void 읽지_않은_알림_개수_조회_테스트() throws Exception {
        // Given
        when(notificationService.getUnreadCount(1L)).thenReturn(5L);

        // When & Then
        mockMvc.perform(get("/api/notifications/unread/count")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(5));

        verify(notificationService, times(1)).getUnreadCount(1L);
    }

    @Test
    void 알림_읽음_처리_테스트() throws Exception {
        // Given
        List<Long> notificationIds = Arrays.asList(1L, 2L, 3L);
        doNothing().when(notificationService).markAsRead(notificationIds, 1L);

        // When & Then
        mockMvc.perform(post("/api/notifications/read")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[1, 2, 3]"))
                .andExpect(status().isOk());

        verify(notificationService, times(1)).markAsRead(notificationIds, 1L);
    }

    @Test
    void 모든_알림_읽음_처리_테스트() throws Exception {
        // Given
        doNothing().when(notificationService).markAllAsRead(1L);

        // When & Then
        mockMvc.perform(post("/api/notifications/read/all")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(notificationService, times(1)).markAllAsRead(1L);
    }

    @Test
    void 알림_삭제_테스트() throws Exception {
        // Given
        doNothing().when(notificationService).deleteNotification(1L, 1L);

        // When & Then
        mockMvc.perform(delete("/api/notifications/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(notificationService, times(1)).deleteNotification(1L, 1L);
    }
}
