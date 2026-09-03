package com.travelmate.service;

import com.travelmate.dto.BookmarkDto;
import com.travelmate.entity.Bookmark;
import com.travelmate.entity.Post;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.BookmarkRepository;
import com.travelmate.repository.PostRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    /**
     * 북마크 추가
     */
    @Transactional
    public BookmarkDto.Response createBookmark(Long userId, BookmarkDto.CreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        // 대상 존재 여부 확인
        validateTargetExists(request.getTargetType(), request.getTargetId());

        // 이미 북마크 여부 확인
        if (bookmarkRepository.existsByUserIdAndTargetTypeAndTargetId(
                userId, request.getTargetType(), request.getTargetId())) {
            throw BusinessException.conflict("이미 북마크한 항목입니다.");
        }

        Bookmark bookmark = Bookmark.builder()
                .user(user)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .folderName(request.getFolderName())
                .note(request.getNote())
                .build();

        Bookmark savedBookmark = bookmarkRepository.save(bookmark);
        return toResponse(savedBookmark);
    }

    /**
     * 북마크 토글 (추가/제거)
     */
    @Transactional
    public BookmarkDto.ToggleResponse toggleBookmark(Long userId, Bookmark.TargetType targetType, Long targetId) {
        boolean exists = bookmarkRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);

        if (exists) {
            // 북마크 제거
            bookmarkRepository.deleteByUserIdAndTarget(userId, targetType, targetId);
            return BookmarkDto.ToggleResponse.builder()
                    .targetType(targetType.name())
                    .targetId(targetId)
                    .isBookmarked(false)
                    .build();
        } else {
            // 북마크 추가
            validateTargetExists(targetType, targetId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> BusinessException.userNotFound(userId));

            Bookmark bookmark = Bookmark.builder()
                    .user(user)
                    .targetType(targetType)
                    .targetId(targetId)
                    .build();

            Bookmark savedBookmark = bookmarkRepository.save(bookmark);
            return BookmarkDto.ToggleResponse.builder()
                    .targetType(targetType.name())
                    .targetId(targetId)
                    .isBookmarked(true)
                    .folderName(savedBookmark.getFolderName())
                    .build();
        }
    }

    /**
     * 북마크 수정
     */
    @Transactional
    public BookmarkDto.Response updateBookmark(Long userId, Long bookmarkId, BookmarkDto.UpdateRequest request) {
        Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
                .orElseThrow(() -> BusinessException.notFound("북마크를 찾을 수 없습니다."));

        if (!bookmark.getUser().getId().equals(userId)) {
            throw BusinessException.forbidden("북마크를 수정할 권한이 없습니다.");
        }

        if (request.getFolderName() != null) {
            bookmark.setFolderName(request.getFolderName());
        }
        if (request.getNote() != null) {
            bookmark.setNote(request.getNote());
        }

        Bookmark updatedBookmark = bookmarkRepository.save(bookmark);
        return toResponse(updatedBookmark);
    }

    /**
     * 북마크 삭제
     */
    @Transactional
    public void deleteBookmark(Long userId, Long bookmarkId) {
        Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
                .orElseThrow(() -> BusinessException.notFound("북마크를 찾을 수 없습니다."));

        if (!bookmark.getUser().getId().equals(userId)) {
            throw BusinessException.forbidden("북마크를 삭제할 권한이 없습니다.");
        }

        bookmarkRepository.delete(bookmark);
    }

    /**
     * 사용자의 북마크 목록 조회
     */
    @Transactional(readOnly = true)
    public BookmarkDto.ListResponse getMyBookmarks(Long userId, Pageable pageable) {
        Page<Bookmark> bookmarks = bookmarkRepository.findByUserId(userId, pageable);

        List<BookmarkDto.Response> responses = bookmarks.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return BookmarkDto.ListResponse.builder()
                .bookmarks(responses)
                .totalCount(bookmarks.getTotalElements())
                .hasMore(bookmarks.hasNext())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build();
    }

    /**
     * 타입별 북마크 목록 조회
     */
    @Transactional(readOnly = true)
    public BookmarkDto.ListResponse getMyBookmarksByType(Long userId, Bookmark.TargetType targetType, Pageable pageable) {
        Page<Bookmark> bookmarks = bookmarkRepository.findByUserIdAndTargetType(userId, targetType, pageable);

        List<BookmarkDto.Response> responses = bookmarks.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return BookmarkDto.ListResponse.builder()
                .bookmarks(responses)
                .totalCount(bookmarks.getTotalElements())
                .hasMore(bookmarks.hasNext())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build();
    }

    /**
     * 폴더별 북마크 목록 조회
     */
    @Transactional(readOnly = true)
    public BookmarkDto.ListResponse getMyBookmarksByFolder(Long userId, String folderName, Pageable pageable) {
        Page<Bookmark> bookmarks = bookmarkRepository.findByUserIdAndFolderName(userId, folderName, pageable);

        List<BookmarkDto.Response> responses = bookmarks.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return BookmarkDto.ListResponse.builder()
                .bookmarks(responses)
                .totalCount(bookmarks.getTotalElements())
                .hasMore(bookmarks.hasNext())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .build();
    }

    /**
     * 북마크 상태 조회
     */
    @Transactional(readOnly = true)
    public BookmarkDto.StatusResponse getBookmarkStatus(Long userId, Bookmark.TargetType targetType, Long targetId) {
        Optional<Bookmark> bookmark = bookmarkRepository.findByUserIdAndTargetTypeAndTargetId(
                userId, targetType, targetId);

        return BookmarkDto.StatusResponse.builder()
                .targetType(targetType.name())
                .targetId(targetId)
                .isBookmarked(bookmark.isPresent())
                .bookmarkId(bookmark.map(Bookmark::getId).orElse(null))
                .folderName(bookmark.map(Bookmark::getFolderName).orElse(null))
                .build();
    }

    /**
     * 북마크 상태 일괄 조회
     */
    @Transactional(readOnly = true)
    public BookmarkDto.BatchStatusResponse getBatchBookmarkStatus(Long userId, BookmarkDto.BatchStatusRequest request) {
        List<Long> bookmarkedIds = bookmarkRepository.findBookmarkedTargetIds(
                userId, request.getTargetType(), request.getTargetIds());

        Set<Long> bookmarkedSet = new HashSet<>(bookmarkedIds);
        Map<Long, Boolean> statusMap = request.getTargetIds().stream()
                .collect(Collectors.toMap(id -> id, bookmarkedSet::contains));

        return BookmarkDto.BatchStatusResponse.builder()
                .targetType(request.getTargetType().name())
                .bookmarkStatus(statusMap)
                .build();
    }

    /**
     * 북마크 통계 조회
     */
    @Transactional(readOnly = true)
    public BookmarkDto.StatsResponse getBookmarkStats(Long userId) {
        List<Object[]> countByType = bookmarkRepository.countByUserIdGroupByType(userId);
        Map<String, Long> typeCountMap = new HashMap<>();
        for (Object[] row : countByType) {
            Bookmark.TargetType type = (Bookmark.TargetType) row[0];
            Long count = (Long) row[1];
            typeCountMap.put(type.name(), count);
        }

        List<String> folders = bookmarkRepository.findDistinctFoldersByUserId(userId);
        long totalBookmarks = bookmarkRepository.countByUserId(userId);

        return BookmarkDto.StatsResponse.builder()
                .userId(userId)
                .totalBookmarks(totalBookmarks)
                .countByType(typeCountMap)
                .folders(folders)
                .build();
    }

    /**
     * 폴더명 변경
     */
    @Transactional
    public int renameFolder(Long userId, BookmarkDto.FolderRenameRequest request) {
        return bookmarkRepository.updateFolderName(userId, request.getOldFolderName(), request.getNewFolderName());
    }

    // === Helper Methods ===

    private void validateTargetExists(Bookmark.TargetType targetType, Long targetId) {
        switch (targetType) {
            case POST:
                if (!postRepository.existsById(targetId)) {
                    throw BusinessException.notFound("게시글을 찾을 수 없습니다.");
                }
                break;
            case USER:
                if (!userRepository.existsById(targetId)) {
                    throw BusinessException.userNotFound(targetId);
                }
                break;
            // 다른 타입들은 해당 Repository에서 검증
            default:
                log.debug("Target validation skipped for type: {}", targetType);
        }
    }

    private BookmarkDto.Response toResponse(Bookmark bookmark) {
        return BookmarkDto.Response.builder()
                .id(bookmark.getId())
                .targetType(bookmark.getTargetType().name())
                .targetTypeDisplayName(bookmark.getTargetType().getDisplayName())
                .targetId(bookmark.getTargetId())
                .target(getTargetInfo(bookmark.getTargetType(), bookmark.getTargetId()))
                .folderName(bookmark.getFolderName())
                .note(bookmark.getNote())
                .createdAt(bookmark.getCreatedAt())
                .build();
    }

    private BookmarkDto.TargetInfo getTargetInfo(Bookmark.TargetType targetType, Long targetId) {
        BookmarkDto.TargetInfo.TargetInfoBuilder builder = BookmarkDto.TargetInfo.builder()
                .id(targetId)
                .type(targetType.name());

        try {
            switch (targetType) {
                case POST:
                    postRepository.findById(targetId).ifPresent(post -> {
                        builder.title(post.getTitle())
                               .description(truncate(post.getContent(), 100))
                               .authorName(post.getAuthor() != null ? post.getAuthor().getNickname() : null)
                               .authorId(post.getAuthor() != null ? post.getAuthor().getId() : null);
                        if (post.getImages() != null && !post.getImages().isEmpty()) {
                            builder.imageUrl(post.getImages().get(0).getImageUrl());
                        }
                    });
                    break;
                case USER:
                    userRepository.findById(targetId).ifPresent(user -> {
                        builder.title(user.getNickname())
                               .description("@" + user.getUsername())
                               .imageUrl(user.getProfileImageUrl());
                    });
                    break;
                default:
                    log.debug("Target info not loaded for type: {}", targetType);
            }
        } catch (Exception e) {
            log.warn("Failed to load target info: {} - {}", targetType, targetId, e);
        }

        return builder.build();
    }

    private String truncate(String text, int maxLength) {
        if (text == null) {
            return null;
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }
}
