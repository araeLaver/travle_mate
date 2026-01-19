package com.travelmate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.dto.BookmarkDto;
import com.travelmate.entity.Bookmark;
import com.travelmate.security.JwtAuthenticationFilter;
import com.travelmate.security.UserPrincipal;
import com.travelmate.service.BookmarkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = BookmarkController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {JwtAuthenticationFilter.class}))
@Import(com.travelmate.config.TestSecurityConfig.class)
@DisplayName("북마크 컨트롤러 테스트")
class BookmarkControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookmarkService bookmarkService;

    @MockBean
    private com.travelmate.service.JwtService jwtService;

    @MockBean
    private com.travelmate.repository.UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UserPrincipal userPrincipal;
    private BookmarkDto.Response bookmarkResponse;
    private BookmarkDto.TargetInfo targetInfo;

    @BeforeEach
    void setUp() {
        // UserPrincipal 설정
        userPrincipal = new UserPrincipal(
                1L,
                "test@test.com",
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );

        // SecurityContext 설정
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userPrincipal,
                null,
                userPrincipal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        // TargetInfo 설정
        targetInfo = BookmarkDto.TargetInfo.builder()
                .id(1L)
                .type("POST")
                .title("테스트 게시글")
                .description("게시글 내용")
                .imageUrl("http://example.com/image.jpg")
                .authorName("작성자")
                .authorId(2L)
                .build();

        // BookmarkDto.Response 설정
        bookmarkResponse = BookmarkDto.Response.builder()
                .id(1L)
                .targetType("POST")
                .targetTypeDisplayName("게시글")
                .targetId(1L)
                .target(targetInfo)
                .folderName("여행")
                .note("나중에 참고할 글")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("북마크 추가 테스트")
    class CreateBookmarkTest {

        @Test
        @DisplayName("POST /api/bookmarks - 성공")
        void createBookmark_Success() throws Exception {
            // Given
            BookmarkDto.CreateRequest request = BookmarkDto.CreateRequest.builder()
                    .targetType(Bookmark.TargetType.POST)
                    .targetId(1L)
                    .folderName("여행")
                    .note("나중에 참고할 글")
                    .build();

            when(bookmarkService.createBookmark(eq(1L), any(BookmarkDto.CreateRequest.class)))
                    .thenReturn(bookmarkResponse);

            // When & Then
            mockMvc.perform(post("/bookmarks")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.targetType").value("POST"))
                    .andExpect(jsonPath("$.folderName").value("여행"));

            verify(bookmarkService).createBookmark(eq(1L), any(BookmarkDto.CreateRequest.class));
        }

        @Test
        @DisplayName("POST /api/bookmarks - 필수 필드 누락 실패")
        void createBookmark_Fail_MissingRequiredFields() throws Exception {
            // Given
            BookmarkDto.CreateRequest request = BookmarkDto.CreateRequest.builder()
                    .folderName("여행")
                    .build();

            // When & Then
            mockMvc.perform(post("/bookmarks")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("북마크 토글 테스트")
    class ToggleBookmarkTest {

        @Test
        @DisplayName("POST /api/bookmarks/toggle - 북마크 추가 성공")
        void toggleBookmark_Add_Success() throws Exception {
            // Given
            BookmarkDto.ToggleResponse toggleResponse = BookmarkDto.ToggleResponse.builder()
                    .targetType("POST")
                    .targetId(1L)
                    .isBookmarked(true)
                    .folderName(null)
                    .build();

            when(bookmarkService.toggleBookmark(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(toggleResponse);

            // When & Then
            mockMvc.perform(post("/bookmarks/toggle")
                            .with(csrf())
                            .param("targetType", "POST")
                            .param("targetId", "1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.targetType").value("POST"))
                    .andExpect(jsonPath("$.targetId").value(1))
                    .andExpect(jsonPath("$.bookmarked").value(true));
        }

        @Test
        @DisplayName("POST /api/bookmarks/toggle - 북마크 해제 성공")
        void toggleBookmark_Remove_Success() throws Exception {
            // Given
            BookmarkDto.ToggleResponse toggleResponse = BookmarkDto.ToggleResponse.builder()
                    .targetType("POST")
                    .targetId(1L)
                    .isBookmarked(false)
                    .folderName(null)
                    .build();

            when(bookmarkService.toggleBookmark(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(toggleResponse);

            // When & Then
            mockMvc.perform(post("/bookmarks/toggle")
                            .with(csrf())
                            .param("targetType", "POST")
                            .param("targetId", "1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bookmarked").value(false));
        }
    }

    @Nested
    @DisplayName("북마크 수정 테스트")
    class UpdateBookmarkTest {

        @Test
        @DisplayName("PUT /api/bookmarks/{bookmarkId} - 성공")
        void updateBookmark_Success() throws Exception {
            // Given
            BookmarkDto.UpdateRequest request = BookmarkDto.UpdateRequest.builder()
                    .folderName("수정된 폴더")
                    .note("수정된 메모")
                    .build();

            BookmarkDto.Response updatedResponse = BookmarkDto.Response.builder()
                    .id(1L)
                    .targetType("POST")
                    .targetId(1L)
                    .target(targetInfo)
                    .folderName("수정된 폴더")
                    .note("수정된 메모")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(bookmarkService.updateBookmark(eq(1L), eq(1L), any(BookmarkDto.UpdateRequest.class)))
                    .thenReturn(updatedResponse);

            // When & Then
            mockMvc.perform(put("/bookmarks/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.folderName").value("수정된 폴더"))
                    .andExpect(jsonPath("$.note").value("수정된 메모"));
        }
    }

    @Nested
    @DisplayName("북마크 삭제 테스트")
    class DeleteBookmarkTest {

        @Test
        @DisplayName("DELETE /api/bookmarks/{bookmarkId} - 성공")
        void deleteBookmark_Success() throws Exception {
            // Given
            doNothing().when(bookmarkService).deleteBookmark(1L, 1L);

            // When & Then
            mockMvc.perform(delete("/bookmarks/1")
                            .with(csrf()))
                    .andDo(print())
                    .andExpect(status().isNoContent());

            verify(bookmarkService).deleteBookmark(1L, 1L);
        }
    }

    @Nested
    @DisplayName("북마크 목록 조회 테스트")
    class GetBookmarksTest {

        @Test
        @DisplayName("GET /api/bookmarks - 전체 목록 조회")
        void getMyBookmarks_Success() throws Exception {
            // Given
            BookmarkDto.ListResponse listResponse = BookmarkDto.ListResponse.builder()
                    .bookmarks(List.of(bookmarkResponse))
                    .totalCount(1L)
                    .hasMore(false)
                    .page(0)
                    .size(20)
                    .build();

            when(bookmarkService.getMyBookmarks(eq(1L), any()))
                    .thenReturn(listResponse);

            // When & Then
            mockMvc.perform(get("/bookmarks"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bookmarks[0].id").value(1))
                    .andExpect(jsonPath("$.totalCount").value(1))
                    .andExpect(jsonPath("$.hasMore").value(false));
        }

        @Test
        @DisplayName("GET /api/bookmarks - 페이지네이션")
        void getMyBookmarks_WithPagination() throws Exception {
            // Given
            BookmarkDto.ListResponse listResponse = BookmarkDto.ListResponse.builder()
                    .bookmarks(List.of(bookmarkResponse))
                    .totalCount(50L)
                    .hasMore(true)
                    .page(1)
                    .size(10)
                    .build();

            when(bookmarkService.getMyBookmarks(eq(1L), any()))
                    .thenReturn(listResponse);

            // When & Then
            mockMvc.perform(get("/bookmarks")
                            .param("page", "1")
                            .param("size", "10"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalCount").value(50))
                    .andExpect(jsonPath("$.hasMore").value(true));
        }

        @Test
        @DisplayName("GET /api/bookmarks/type/{targetType} - 타입별 조회")
        void getMyBookmarksByType_Success() throws Exception {
            // Given
            BookmarkDto.ListResponse listResponse = BookmarkDto.ListResponse.builder()
                    .bookmarks(List.of(bookmarkResponse))
                    .totalCount(1L)
                    .hasMore(false)
                    .page(0)
                    .size(20)
                    .build();

            when(bookmarkService.getMyBookmarksByType(eq(1L), eq(Bookmark.TargetType.POST), any()))
                    .thenReturn(listResponse);

            // When & Then
            mockMvc.perform(get("/bookmarks/type/POST"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bookmarks[0].targetType").value("POST"));
        }

        @Test
        @DisplayName("GET /api/bookmarks/folder/{folderName} - 폴더별 조회")
        void getMyBookmarksByFolder_Success() throws Exception {
            // Given
            BookmarkDto.ListResponse listResponse = BookmarkDto.ListResponse.builder()
                    .bookmarks(List.of(bookmarkResponse))
                    .totalCount(1L)
                    .hasMore(false)
                    .page(0)
                    .size(20)
                    .build();

            when(bookmarkService.getMyBookmarksByFolder(eq(1L), eq("여행"), any()))
                    .thenReturn(listResponse);

            // When & Then
            mockMvc.perform(get("/bookmarks/folder/여행"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bookmarks[0].folderName").value("여행"));
        }
    }

    @Nested
    @DisplayName("북마크 상태 조회 테스트")
    class GetBookmarkStatusTest {

        @Test
        @DisplayName("GET /api/bookmarks/status - 성공")
        void getBookmarkStatus_Success() throws Exception {
            // Given
            BookmarkDto.StatusResponse statusResponse = BookmarkDto.StatusResponse.builder()
                    .targetType("POST")
                    .targetId(1L)
                    .isBookmarked(true)
                    .bookmarkId(1L)
                    .folderName("여행")
                    .build();

            when(bookmarkService.getBookmarkStatus(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(statusResponse);

            // When & Then
            mockMvc.perform(get("/bookmarks/status")
                            .param("targetType", "POST")
                            .param("targetId", "1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.targetType").value("POST"))
                    .andExpect(jsonPath("$.bookmarked").value(true))
                    .andExpect(jsonPath("$.bookmarkId").value(1));
        }

        @Test
        @DisplayName("GET /api/bookmarks/status - 북마크 없음")
        void getBookmarkStatus_NotBookmarked() throws Exception {
            // Given
            BookmarkDto.StatusResponse statusResponse = BookmarkDto.StatusResponse.builder()
                    .targetType("POST")
                    .targetId(1L)
                    .isBookmarked(false)
                    .bookmarkId(null)
                    .folderName(null)
                    .build();

            when(bookmarkService.getBookmarkStatus(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(statusResponse);

            // When & Then
            mockMvc.perform(get("/bookmarks/status")
                            .param("targetType", "POST")
                            .param("targetId", "1"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.bookmarked").value(false))
                    .andExpect(jsonPath("$.bookmarkId").isEmpty());
        }
    }

    @Nested
    @DisplayName("북마크 상태 일괄 조회 테스트")
    class GetBatchBookmarkStatusTest {

        @Test
        @DisplayName("POST /api/bookmarks/status/batch - 성공")
        void getBatchBookmarkStatus_Success() throws Exception {
            // Given
            BookmarkDto.BatchStatusRequest request = BookmarkDto.BatchStatusRequest.builder()
                    .targetType(Bookmark.TargetType.POST)
                    .targetIds(List.of(1L, 2L, 3L))
                    .build();

            BookmarkDto.BatchStatusResponse batchResponse = BookmarkDto.BatchStatusResponse.builder()
                    .targetType("POST")
                    .bookmarkStatus(Map.of(1L, true, 2L, false, 3L, true))
                    .build();

            when(bookmarkService.getBatchBookmarkStatus(eq(1L), any(BookmarkDto.BatchStatusRequest.class)))
                    .thenReturn(batchResponse);

            // When & Then
            mockMvc.perform(post("/bookmarks/status/batch")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.targetType").value("POST"))
                    .andExpect(jsonPath("$.bookmarkStatus.1").value(true))
                    .andExpect(jsonPath("$.bookmarkStatus.2").value(false))
                    .andExpect(jsonPath("$.bookmarkStatus.3").value(true));
        }
    }

    @Nested
    @DisplayName("북마크 통계 조회 테스트")
    class GetBookmarkStatsTest {

        @Test
        @DisplayName("GET /api/bookmarks/stats - 성공")
        void getBookmarkStats_Success() throws Exception {
            // Given
            BookmarkDto.StatsResponse statsResponse = BookmarkDto.StatsResponse.builder()
                    .userId(1L)
                    .totalBookmarks(10L)
                    .countByType(Map.of("POST", 5L, "LOCATION", 3L, "TRAVEL_PLAN", 2L))
                    .folders(List.of("여행", "맛집", "기본"))
                    .build();

            when(bookmarkService.getBookmarkStats(1L))
                    .thenReturn(statsResponse);

            // When & Then
            mockMvc.perform(get("/bookmarks/stats"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId").value(1))
                    .andExpect(jsonPath("$.totalBookmarks").value(10))
                    .andExpect(jsonPath("$.countByType.POST").value(5))
                    .andExpect(jsonPath("$.folders").isArray())
                    .andExpect(jsonPath("$.folders.length()").value(3));
        }
    }

    @Nested
    @DisplayName("폴더명 변경 테스트")
    class RenameFolderTest {

        @Test
        @DisplayName("PUT /api/bookmarks/folders/rename - 성공")
        void renameFolder_Success() throws Exception {
            // Given
            BookmarkDto.FolderRenameRequest request = BookmarkDto.FolderRenameRequest.builder()
                    .oldFolderName("여행")
                    .newFolderName("해외여행")
                    .build();

            when(bookmarkService.renameFolder(eq(1L), any(BookmarkDto.FolderRenameRequest.class)))
                    .thenReturn(5);

            // When & Then
            mockMvc.perform(put("/bookmarks/folders/rename")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(content().string("5"));

            verify(bookmarkService).renameFolder(eq(1L), any(BookmarkDto.FolderRenameRequest.class));
        }

        @Test
        @DisplayName("PUT /api/bookmarks/folders/rename - 필수 필드 누락")
        void renameFolder_Fail_MissingFields() throws Exception {
            // Given
            BookmarkDto.FolderRenameRequest request = BookmarkDto.FolderRenameRequest.builder()
                    .oldFolderName("여행")
                    .build();

            // When & Then
            mockMvc.perform(put("/bookmarks/folders/rename")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isBadRequest());
        }
    }
}
