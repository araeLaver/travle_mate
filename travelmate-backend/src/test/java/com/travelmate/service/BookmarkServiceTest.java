package com.travelmate.service;

import com.travelmate.dto.BookmarkDto;
import com.travelmate.entity.Bookmark;
import com.travelmate.entity.Post;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.BookmarkRepository;
import com.travelmate.repository.PostRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookmarkService 테스트")
class BookmarkServiceTest {

    @Mock
    private BookmarkRepository bookmarkRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private BookmarkService bookmarkService;

    private User user;
    private Post post;
    private Bookmark bookmark;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setNickname("테스트유저");
        user.setEmail("test@test.com");

        post = new Post();
        post.setId(1L);
        post.setTitle("테스트 게시글");
        post.setContent("테스트 내용");
        post.setAuthor(user);

        bookmark = Bookmark.builder()
                .id(1L)
                .user(user)
                .targetType(Bookmark.TargetType.POST)
                .targetId(1L)
                .folderName("여행")
                .note("나중에 다시 보기")
                .build();
        bookmark.setCreatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("북마크 생성 테스트")
    class CreateBookmarkTest {

        @Test
        @DisplayName("성공 - 북마크 생성")
        void createBookmark_Success() {
            // Given
            BookmarkDto.CreateRequest request = new BookmarkDto.CreateRequest();
            request.setTargetType(Bookmark.TargetType.POST);
            request.setTargetId(1L);
            request.setFolderName("여행");
            request.setNote("좋은 정보");

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(postRepository.existsById(1L)).thenReturn(true);
            when(bookmarkRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(false);
            when(bookmarkRepository.save(any(Bookmark.class))).thenAnswer(invocation -> {
                Bookmark saved = invocation.getArgument(0);
                saved.setCreatedAt(LocalDateTime.now());
                return saved;
            });
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));

            // When
            BookmarkDto.Response result = bookmarkService.createBookmark(1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTargetType()).isEqualTo("POST");
            assertThat(result.getTargetId()).isEqualTo(1L);
            assertThat(result.getFolderName()).isEqualTo("여행");
            verify(bookmarkRepository).save(any(Bookmark.class));
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void createBookmark_Fail_UserNotFound() {
            // Given
            BookmarkDto.CreateRequest request = new BookmarkDto.CreateRequest();
            request.setTargetType(Bookmark.TargetType.POST);
            request.setTargetId(1L);

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> bookmarkService.createBookmark(999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 이미 북마크한 항목")
        void createBookmark_Fail_AlreadyBookmarked() {
            // Given
            BookmarkDto.CreateRequest request = new BookmarkDto.CreateRequest();
            request.setTargetType(Bookmark.TargetType.POST);
            request.setTargetId(1L);

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(postRepository.existsById(1L)).thenReturn(true);
            when(bookmarkRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> bookmarkService.createBookmark(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("이미 북마크한 항목");
        }

        @Test
        @DisplayName("실패 - 게시글 없음")
        void createBookmark_Fail_PostNotFound() {
            // Given
            BookmarkDto.CreateRequest request = new BookmarkDto.CreateRequest();
            request.setTargetType(Bookmark.TargetType.POST);
            request.setTargetId(999L);

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(postRepository.existsById(999L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> bookmarkService.createBookmark(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("게시글을 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("북마크 토글 테스트")
    class ToggleBookmarkTest {

        @Test
        @DisplayName("성공 - 북마크 추가 (미존재 시)")
        void toggleBookmark_Add() {
            // Given
            when(bookmarkRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(false);
            when(postRepository.existsById(1L)).thenReturn(true);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(bookmarkRepository.save(any(Bookmark.class))).thenReturn(bookmark);

            // When
            BookmarkDto.ToggleResponse result = bookmarkService.toggleBookmark(1L, Bookmark.TargetType.POST, 1L);

            // Then
            assertThat(result.isBookmarked()).isTrue();
            verify(bookmarkRepository).save(any(Bookmark.class));
        }

        @Test
        @DisplayName("성공 - 북마크 제거 (존재 시)")
        void toggleBookmark_Remove() {
            // Given
            when(bookmarkRepository.existsByUserIdAndTargetTypeAndTargetId(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(true);
            when(bookmarkRepository.deleteByUserIdAndTarget(1L, Bookmark.TargetType.POST, 1L)).thenReturn(1);

            // When
            BookmarkDto.ToggleResponse result = bookmarkService.toggleBookmark(1L, Bookmark.TargetType.POST, 1L);

            // Then
            assertThat(result.isBookmarked()).isFalse();
            verify(bookmarkRepository).deleteByUserIdAndTarget(1L, Bookmark.TargetType.POST, 1L);
        }
    }

    @Nested
    @DisplayName("북마크 수정 테스트")
    class UpdateBookmarkTest {

        @Test
        @DisplayName("성공 - 북마크 수정")
        void updateBookmark_Success() {
            // Given
            BookmarkDto.UpdateRequest request = new BookmarkDto.UpdateRequest();
            request.setFolderName("새폴더");
            request.setNote("수정된 메모");

            when(bookmarkRepository.findById(1L)).thenReturn(Optional.of(bookmark));
            when(bookmarkRepository.save(any(Bookmark.class))).thenReturn(bookmark);
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));

            // When
            BookmarkDto.Response result = bookmarkService.updateBookmark(1L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(bookmark.getFolderName()).isEqualTo("새폴더");
            assertThat(bookmark.getNote()).isEqualTo("수정된 메모");
        }

        @Test
        @DisplayName("실패 - 북마크 없음")
        void updateBookmark_Fail_NotFound() {
            // Given
            BookmarkDto.UpdateRequest request = new BookmarkDto.UpdateRequest();

            when(bookmarkRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> bookmarkService.updateBookmark(1L, 999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("북마크를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 권한 없음")
        void updateBookmark_Fail_NoPermission() {
            // Given
            BookmarkDto.UpdateRequest request = new BookmarkDto.UpdateRequest();

            when(bookmarkRepository.findById(1L)).thenReturn(Optional.of(bookmark));

            // When & Then
            assertThatThrownBy(() -> bookmarkService.updateBookmark(2L, 1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("수정할 권한이 없습니다");
        }
    }

    @Nested
    @DisplayName("북마크 삭제 테스트")
    class DeleteBookmarkTest {

        @Test
        @DisplayName("성공 - 북마크 삭제")
        void deleteBookmark_Success() {
            // Given
            when(bookmarkRepository.findById(1L)).thenReturn(Optional.of(bookmark));
            doNothing().when(bookmarkRepository).delete(bookmark);

            // When
            bookmarkService.deleteBookmark(1L, 1L);

            // Then
            verify(bookmarkRepository).delete(bookmark);
        }

        @Test
        @DisplayName("실패 - 북마크 없음")
        void deleteBookmark_Fail_NotFound() {
            // Given
            when(bookmarkRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> bookmarkService.deleteBookmark(1L, 999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("북마크를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("실패 - 권한 없음")
        void deleteBookmark_Fail_NoPermission() {
            // Given
            when(bookmarkRepository.findById(1L)).thenReturn(Optional.of(bookmark));

            // When & Then
            assertThatThrownBy(() -> bookmarkService.deleteBookmark(2L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("삭제할 권한이 없습니다");
        }
    }

    @Nested
    @DisplayName("북마크 목록 조회 테스트")
    class GetBookmarksTest {

        @Test
        @DisplayName("성공 - 전체 북마크 목록 조회")
        void getMyBookmarks_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<Bookmark> bookmarkPage = new PageImpl<>(List.of(bookmark), pageable, 1);

            when(bookmarkRepository.findByUserId(1L, pageable)).thenReturn(bookmarkPage);
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));

            // When
            BookmarkDto.ListResponse result = bookmarkService.getMyBookmarks(1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTotalCount()).isEqualTo(1);
            assertThat(result.getBookmarks()).hasSize(1);
        }

        @Test
        @DisplayName("성공 - 타입별 북마크 목록 조회")
        void getMyBookmarksByType_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<Bookmark> bookmarkPage = new PageImpl<>(List.of(bookmark), pageable, 1);

            when(bookmarkRepository.findByUserIdAndTargetType(1L, Bookmark.TargetType.POST, pageable))
                    .thenReturn(bookmarkPage);
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));

            // When
            BookmarkDto.ListResponse result = bookmarkService.getMyBookmarksByType(1L, Bookmark.TargetType.POST, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getBookmarks()).hasSize(1);
        }

        @Test
        @DisplayName("성공 - 폴더별 북마크 목록 조회")
        void getMyBookmarksByFolder_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 20);
            Page<Bookmark> bookmarkPage = new PageImpl<>(List.of(bookmark), pageable, 1);

            when(bookmarkRepository.findByUserIdAndFolderName(1L, "여행", pageable)).thenReturn(bookmarkPage);
            when(postRepository.findById(1L)).thenReturn(Optional.of(post));

            // When
            BookmarkDto.ListResponse result = bookmarkService.getMyBookmarksByFolder(1L, "여행", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getBookmarks()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("북마크 상태 조회 테스트")
    class GetBookmarkStatusTest {

        @Test
        @DisplayName("성공 - 북마크 상태 조회 (북마크됨)")
        void getBookmarkStatus_Bookmarked() {
            // Given
            when(bookmarkRepository.findByUserIdAndTargetTypeAndTargetId(1L, Bookmark.TargetType.POST, 1L))
                    .thenReturn(Optional.of(bookmark));

            // When
            BookmarkDto.StatusResponse result = bookmarkService.getBookmarkStatus(1L, Bookmark.TargetType.POST, 1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.isBookmarked()).isTrue();
            assertThat(result.getBookmarkId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("성공 - 북마크 상태 조회 (북마크 안됨)")
        void getBookmarkStatus_NotBookmarked() {
            // Given
            when(bookmarkRepository.findByUserIdAndTargetTypeAndTargetId(1L, Bookmark.TargetType.POST, 2L))
                    .thenReturn(Optional.empty());

            // When
            BookmarkDto.StatusResponse result = bookmarkService.getBookmarkStatus(1L, Bookmark.TargetType.POST, 2L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.isBookmarked()).isFalse();
            assertThat(result.getBookmarkId()).isNull();
        }
    }

    @Nested
    @DisplayName("북마크 일괄 상태 조회 테스트")
    class GetBatchBookmarkStatusTest {

        @Test
        @DisplayName("성공 - 일괄 상태 조회")
        void getBatchBookmarkStatus_Success() {
            // Given
            BookmarkDto.BatchStatusRequest request = new BookmarkDto.BatchStatusRequest();
            request.setTargetType(Bookmark.TargetType.POST);
            request.setTargetIds(List.of(1L, 2L, 3L));

            when(bookmarkRepository.findBookmarkedTargetIds(1L, Bookmark.TargetType.POST, List.of(1L, 2L, 3L)))
                    .thenReturn(List.of(1L, 3L));

            // When
            BookmarkDto.BatchStatusResponse result = bookmarkService.getBatchBookmarkStatus(1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getBookmarkStatus()).containsEntry(1L, true);
            assertThat(result.getBookmarkStatus()).containsEntry(2L, false);
            assertThat(result.getBookmarkStatus()).containsEntry(3L, true);
        }
    }

    @Nested
    @DisplayName("북마크 통계 테스트")
    class GetBookmarkStatsTest {

        @Test
        @DisplayName("성공 - 북마크 통계 조회")
        void getBookmarkStats_Success() {
            // Given
            when(bookmarkRepository.countByUserIdGroupByType(1L))
                    .thenReturn(List.of(
                            new Object[]{Bookmark.TargetType.POST, 5L},
                            new Object[]{Bookmark.TargetType.USER, 3L}
                    ));
            when(bookmarkRepository.findDistinctFoldersByUserId(1L)).thenReturn(List.of("여행", "맛집"));
            when(bookmarkRepository.countByUserId(1L)).thenReturn(8L);

            // When
            BookmarkDto.StatsResponse result = bookmarkService.getBookmarkStats(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTotalBookmarks()).isEqualTo(8);
            assertThat(result.getCountByType()).containsEntry("POST", 5L);
            assertThat(result.getCountByType()).containsEntry("USER", 3L);
            assertThat(result.getFolders()).containsExactlyInAnyOrder("여행", "맛집");
        }
    }

    @Nested
    @DisplayName("폴더명 변경 테스트")
    class RenameFolderTest {

        @Test
        @DisplayName("성공 - 폴더명 변경")
        void renameFolder_Success() {
            // Given
            BookmarkDto.FolderRenameRequest request = new BookmarkDto.FolderRenameRequest();
            request.setOldFolderName("여행");
            request.setNewFolderName("해외여행");

            when(bookmarkRepository.updateFolderName(1L, "여행", "해외여행")).thenReturn(3);

            // When
            int result = bookmarkService.renameFolder(1L, request);

            // Then
            assertThat(result).isEqualTo(3);
            verify(bookmarkRepository).updateFolderName(1L, "여행", "해외여행");
        }
    }
}
