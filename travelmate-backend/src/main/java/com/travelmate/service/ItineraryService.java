package com.travelmate.service;

import com.travelmate.dto.itinerary.*;
import com.travelmate.entity.ItineraryCollaborator;
import com.travelmate.entity.ItineraryComment;
import com.travelmate.entity.ItineraryItem;
import com.travelmate.entity.ItineraryLike;
import com.travelmate.entity.TravelItinerary;
import com.travelmate.entity.User;
import com.travelmate.entity.ItineraryCollaborator.CollaboratorRole;
import com.travelmate.entity.ItineraryCollaborator.InviteStatus;
import com.travelmate.entity.TravelItinerary.ItineraryVisibility;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ItineraryService {

    private final TravelItineraryRepository itineraryRepository;
    private final ItineraryItemRepository itemRepository;
    private final ItineraryCollaboratorRepository collaboratorRepository;
    private final ItineraryLikeRepository likeRepository;
    private final ItineraryCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final String SHARE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHARE_CODE_LENGTH = 8;

    // ==================== 일정 CRUD ====================

    @Transactional
    public ItineraryResponse createItinerary(Long userId, CreateItineraryRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        TravelItinerary itinerary = TravelItinerary.builder()
                .owner(owner)
                .title(request.getTitle())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .coverImage(request.getCoverImage())
                .visibility(request.getVisibility() != null ? request.getVisibility() : ItineraryVisibility.PRIVATE)
                .build();

        // 공유 가능한 경우 공유 코드 생성
        if (itinerary.getVisibility() != ItineraryVisibility.PRIVATE) {
            itinerary.setShareCode(generateShareCode());
        }

        itinerary = itineraryRepository.save(itinerary);
        log.info("Itinerary created: {} by user {}", itinerary.getId(), userId);

        return toResponse(itinerary, userId);
    }

    @Transactional
    public ItineraryResponse updateItinerary(Long userId, Long itineraryId, UpdateItineraryRequest request) {
        TravelItinerary itinerary = getItineraryWithEditPermission(itineraryId, userId);

        if (request.getTitle() != null) {
            itinerary.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            itinerary.setDescription(request.getDescription());
        }
        if (request.getStartDate() != null) {
            itinerary.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            itinerary.setEndDate(request.getEndDate());
        }
        if (request.getCoverImage() != null) {
            itinerary.setCoverImage(request.getCoverImage());
        }
        if (request.getVisibility() != null) {
            itinerary.setVisibility(request.getVisibility());
            // 공유 코드 생성/제거
            if (request.getVisibility() != ItineraryVisibility.PRIVATE && itinerary.getShareCode() == null) {
                itinerary.setShareCode(generateShareCode());
            }
        }

        itinerary = itineraryRepository.save(itinerary);
        return toResponse(itinerary, userId);
    }

    @Transactional
    public void deleteItinerary(Long userId, Long itineraryId) {
        TravelItinerary itinerary = getItineraryWithOwnerPermission(itineraryId, userId);
        itineraryRepository.delete(itinerary);
        log.info("Itinerary deleted: {} by user {}", itineraryId, userId);
    }

    public ItineraryResponse getItinerary(Long itineraryId, Long userId) {
        TravelItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        // 접근 권한 확인
        if (!canViewItinerary(itinerary, userId)) {
            throw BusinessException.forbidden("Access denied");
        }

        // 조회수 증가 (본인 제외)
        if (!itinerary.getOwner().getId().equals(userId)) {
            itineraryRepository.incrementViewCount(itineraryId);
        }

        return toDetailResponse(itinerary, userId);
    }

    public ItineraryResponse getItineraryByShareCode(String shareCode, Long userId) {
        TravelItinerary itinerary = itineraryRepository.findByShareCode(shareCode)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        itineraryRepository.incrementViewCount(itinerary.getId());
        return toDetailResponse(itinerary, userId);
    }

    public Page<ItineraryResponse> getMyItineraries(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        return itineraryRepository.findByOwnerOrderByStartDateDesc(user, pageable)
                .map(it -> toResponse(it, userId));
    }

    public Page<ItineraryResponse> getCollaboratingItineraries(Long userId, Pageable pageable) {
        return itineraryRepository.findCollaboratingItineraries(userId, pageable)
                .map(it -> toResponse(it, userId));
    }

    public Page<ItineraryResponse> getPublicItineraries(Pageable pageable) {
        return itineraryRepository.findByVisibility(ItineraryVisibility.PUBLIC, pageable)
                .map(it -> toResponse(it, null));
    }

    public Page<ItineraryResponse> getPopularItineraries(Pageable pageable) {
        return itineraryRepository.findPopularItineraries(pageable)
                .map(it -> toResponse(it, null));
    }

    public Page<ItineraryResponse> searchItineraries(String keyword, Pageable pageable) {
        return itineraryRepository.searchPublicItineraries(keyword, pageable)
                .map(it -> toResponse(it, null));
    }

    // ==================== 아이템 CRUD ====================

    @Transactional
    public ItineraryItemResponse addItem(Long userId, Long itineraryId, CreateItemRequest request) {
        TravelItinerary itinerary = getItineraryWithEditPermission(itineraryId, userId);

        // 최대 순서 조회
        Integer maxOrder = itemRepository.findMaxOrderIndex(itinerary, request.getDayNumber());

        ItineraryItem item = ItineraryItem.builder()
                .itinerary(itinerary)
                .dayNumber(request.getDayNumber())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : maxOrder + 1)
                .type(request.getType())
                .title(request.getTitle())
                .description(request.getDescription())
                .notes(request.getNotes())
                .placeName(request.getPlaceName())
                .placeAddress(request.getPlaceAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .googlePlaceId(request.getGooglePlaceId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationMinutes(request.getDurationMinutes())
                .estimatedCost(request.getEstimatedCost())
                .currency(request.getCurrency())
                .bookingReference(request.getBookingReference())
                .bookingUrl(request.getBookingUrl())
                .bookingStatus(request.getBookingStatus())
                .imageUrl(request.getImageUrl())
                .locationCollectionId(request.getLocationCollectionId())
                .build();

        item = itemRepository.save(item);
        return toItemResponse(item);
    }

    @Transactional
    public ItineraryItemResponse updateItem(Long userId, Long itemId, UpdateItemRequest request) {
        ItineraryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> BusinessException.notFound("Item not found"));

        // 편집 권한 확인
        checkEditPermission(item.getItinerary(), userId);

        if (request.getDayNumber() != null) item.setDayNumber(request.getDayNumber());
        if (request.getOrderIndex() != null) item.setOrderIndex(request.getOrderIndex());
        if (request.getType() != null) item.setType(request.getType());
        if (request.getTitle() != null) item.setTitle(request.getTitle());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getNotes() != null) item.setNotes(request.getNotes());
        if (request.getPlaceName() != null) item.setPlaceName(request.getPlaceName());
        if (request.getPlaceAddress() != null) item.setPlaceAddress(request.getPlaceAddress());
        if (request.getLatitude() != null) item.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) item.setLongitude(request.getLongitude());
        if (request.getStartTime() != null) item.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) item.setEndTime(request.getEndTime());
        if (request.getDurationMinutes() != null) item.setDurationMinutes(request.getDurationMinutes());
        if (request.getEstimatedCost() != null) item.setEstimatedCost(request.getEstimatedCost());
        if (request.getActualCost() != null) item.setActualCost(request.getActualCost());
        if (request.getCurrency() != null) item.setCurrency(request.getCurrency());
        if (request.getBookingReference() != null) item.setBookingReference(request.getBookingReference());
        if (request.getBookingUrl() != null) item.setBookingUrl(request.getBookingUrl());
        if (request.getBookingStatus() != null) item.setBookingStatus(request.getBookingStatus());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());

        item = itemRepository.save(item);
        return toItemResponse(item);
    }

    @Transactional
    public void deleteItem(Long userId, Long itemId) {
        ItineraryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> BusinessException.notFound("Item not found"));

        checkEditPermission(item.getItinerary(), userId);
        itemRepository.delete(item);
    }

    @Transactional
    public void reorderItems(Long userId, Long itineraryId, List<ReorderItemRequest> requests) {
        TravelItinerary itinerary = getItineraryWithEditPermission(itineraryId, userId);

        for (ReorderItemRequest req : requests) {
            ItineraryItem item = itemRepository.findById(req.getItemId())
                    .orElseThrow(() -> BusinessException.notFound("Item not found: " + req.getItemId()));

            if (!item.getItinerary().getId().equals(itineraryId)) {
                throw BusinessException.badRequest("Item does not belong to this itinerary");
            }

            item.setDayNumber(req.getDayNumber());
            item.setOrderIndex(req.getOrderIndex());
            itemRepository.save(item);
        }
    }

    // ==================== 협업자 관리 ====================

    @Transactional
    public void inviteCollaborator(Long userId, Long itineraryId, InviteCollaboratorRequest request) {
        TravelItinerary itinerary = getItineraryWithAdminPermission(itineraryId, userId);

        User invitee = userRepository.findById(request.getUserId())
                .orElseThrow(() -> BusinessException.userNotFound(request.getUserId()));

        // 이미 협업자인지 확인
        if (collaboratorRepository.findByItineraryAndUser(itinerary, invitee).isPresent()) {
            throw BusinessException.conflict("User is already a collaborator");
        }

        User inviter = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        ItineraryCollaborator collaborator = ItineraryCollaborator.builder()
                .itinerary(itinerary)
                .user(invitee)
                .role(request.getRole() != null ? request.getRole() : CollaboratorRole.VIEWER)
                .invitedBy(inviter)
                .status(InviteStatus.PENDING)
                .build();

        collaboratorRepository.save(collaborator);

        // 알림 발송
        notificationService.notifyItineraryCollaboratorInvite(
                invitee.getId(),
                itineraryId,
                itinerary.getTitle(),
                inviter.getNickname()
        );

        log.info("User {} invited to itinerary {} by {}", invitee.getId(), itineraryId, userId);
    }

    @Transactional
    public void respondToInvite(Long userId, Long collaboratorId, boolean accept) {
        ItineraryCollaborator collaborator = collaboratorRepository.findById(collaboratorId)
                .orElseThrow(() -> BusinessException.notFound("Invitation not found"));

        if (!collaborator.getUser().getId().equals(userId)) {
            throw BusinessException.forbidden("Not your invitation");
        }

        if (collaborator.getStatus() != InviteStatus.PENDING) {
            throw BusinessException.conflict("Invitation already responded");
        }

        if (accept) {
            collaborator.accept();
            collaboratorRepository.save(collaborator);

            // 초대자에게 수락 알림 발송
            notificationService.notifyItineraryCollaboratorAccepted(
                    collaborator.getInvitedBy().getId(),
                    collaborator.getItinerary().getId(),
                    collaborator.getItinerary().getTitle(),
                    collaborator.getUser().getNickname()
            );
        } else {
            collaborator.decline();
            collaboratorRepository.save(collaborator);
        }

        log.info("User {} {} invitation for itinerary {}",
                userId, accept ? "accepted" : "declined", collaborator.getItinerary().getId());
    }

    @Transactional
    public void removeCollaborator(Long userId, Long itineraryId, Long collaboratorUserId) {
        TravelItinerary itinerary = getItineraryWithAdminPermission(itineraryId, userId);

        User collaboratorUser = userRepository.findById(collaboratorUserId)
                .orElseThrow(() -> BusinessException.userNotFound(collaboratorUserId));

        collaboratorRepository.deleteByItineraryAndUser(itinerary, collaboratorUser);
        log.info("Collaborator {} removed from itinerary {} by {}", collaboratorUserId, itineraryId, userId);
    }

    @Transactional
    public void updateCollaboratorRole(Long userId, Long itineraryId, Long collaboratorUserId, CollaboratorRole newRole) {
        TravelItinerary itinerary = getItineraryWithAdminPermission(itineraryId, userId);

        User collaboratorUser = userRepository.findById(collaboratorUserId)
                .orElseThrow(() -> BusinessException.userNotFound(collaboratorUserId));

        ItineraryCollaborator collaborator = collaboratorRepository.findByItineraryAndUser(itinerary, collaboratorUser)
                .orElseThrow(() -> BusinessException.notFound("Collaborator not found"));

        collaborator.setRole(newRole);
        collaboratorRepository.save(collaborator);
    }

    public List<CollaboratorResponse> getCollaborators(Long itineraryId, Long userId) {
        TravelItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        if (!canViewItinerary(itinerary, userId)) {
            throw BusinessException.forbidden("Access denied");
        }

        return collaboratorRepository.findByItinerary(itinerary).stream()
                .map(this::toCollaboratorResponse)
                .collect(Collectors.toList());
    }

    public List<CollaboratorResponse> getPendingInvites(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        return collaboratorRepository.findByUserAndStatus(user, InviteStatus.PENDING).stream()
                .map(this::toCollaboratorResponse)
                .collect(Collectors.toList());
    }

    // ==================== 일정 복사 ====================

    @Transactional
    public ItineraryResponse copyItinerary(Long userId, Long sourceItineraryId) {
        TravelItinerary source = itineraryRepository.findById(sourceItineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        if (!canViewItinerary(source, userId)) {
            throw BusinessException.forbidden("Access denied");
        }

        User newOwner = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        // 일정 복사
        TravelItinerary copy = TravelItinerary.builder()
                .owner(newOwner)
                .title(source.getTitle() + " (복사본)")
                .description(source.getDescription())
                .startDate(source.getStartDate())
                .endDate(source.getEndDate())
                .coverImage(source.getCoverImage())
                .visibility(ItineraryVisibility.PRIVATE)
                .build();

        copy = itineraryRepository.save(copy);

        // 아이템 복사
        for (ItineraryItem sourceItem : source.getItems()) {
            ItineraryItem copyItem = ItineraryItem.builder()
                    .itinerary(copy)
                    .dayNumber(sourceItem.getDayNumber())
                    .orderIndex(sourceItem.getOrderIndex())
                    .type(sourceItem.getType())
                    .title(sourceItem.getTitle())
                    .description(sourceItem.getDescription())
                    .notes(sourceItem.getNotes())
                    .placeName(sourceItem.getPlaceName())
                    .placeAddress(sourceItem.getPlaceAddress())
                    .latitude(sourceItem.getLatitude())
                    .longitude(sourceItem.getLongitude())
                    .googlePlaceId(sourceItem.getGooglePlaceId())
                    .startTime(sourceItem.getStartTime())
                    .endTime(sourceItem.getEndTime())
                    .durationMinutes(sourceItem.getDurationMinutes())
                    .estimatedCost(sourceItem.getEstimatedCost())
                    .currency(sourceItem.getCurrency())
                    .imageUrl(sourceItem.getImageUrl())
                    .build();

            itemRepository.save(copyItem);
        }

        // 원본 복사 수 증가
        itineraryRepository.incrementCopyCount(sourceItineraryId);

        log.info("Itinerary {} copied to {} by user {}", sourceItineraryId, copy.getId(), userId);
        return toResponse(copy, userId);
    }

    // ==================== 좋아요 기능 ====================

    @Transactional
    public boolean toggleLike(Long userId, Long itineraryId) {
        TravelItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        // 접근 권한 확인
        if (!canViewItinerary(itinerary, userId)) {
            throw BusinessException.forbidden("Access denied");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        // 이미 좋아요 했는지 확인
        if (likeRepository.existsByItineraryIdAndUserId(itineraryId, userId)) {
            // 좋아요 취소
            likeRepository.deleteByItineraryIdAndUserId(itineraryId, userId);
            itineraryRepository.decrementLikeCount(itineraryId);
            log.info("User {} unliked itinerary {}", userId, itineraryId);
            return false;
        } else {
            // 좋아요 추가
            ItineraryLike like = ItineraryLike.builder()
                    .user(user)
                    .itinerary(itinerary)
                    .build();
            likeRepository.save(like);
            itineraryRepository.incrementLikeCount(itineraryId);
            log.info("User {} liked itinerary {}", userId, itineraryId);

            // 알림 발송 (본인이 아닌 경우)
            if (!itinerary.getOwner().getId().equals(userId)) {
                notificationService.notifyItineraryLike(
                        itinerary.getOwner().getId(),
                        itineraryId,
                        itinerary.getTitle(),
                        user.getNickname()
                );
            }

            return true;
        }
    }

    public boolean isLiked(Long userId, Long itineraryId) {
        if (userId == null) {
            return false;
        }
        return likeRepository.existsByItineraryIdAndUserId(itineraryId, userId);
    }

    public Page<ItineraryResponse> getLikedItineraries(Long userId, Pageable pageable) {
        List<Long> likedIds = likeRepository.findLikedItineraryIdsByUserId(userId);
        if (likedIds.isEmpty()) {
            return Page.empty(pageable);
        }

        return itineraryRepository.findByIdIn(likedIds, pageable)
                .map(it -> toResponse(it, userId));
    }

    // ==================== 댓글 기능 ====================

    @Transactional
    public CommentResponse addComment(Long userId, Long itineraryId, CreateCommentRequest request) {
        TravelItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        // 접근 권한 확인
        if (!canViewItinerary(itinerary, userId)) {
            throw BusinessException.forbidden("Access denied");
        }

        User author = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        ItineraryComment comment = ItineraryComment.builder()
                .itinerary(itinerary)
                .author(author)
                .content(request.getContent())
                .build();

        // 대댓글인 경우
        if (request.getParentId() != null) {
            ItineraryComment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> BusinessException.notFound("Parent comment not found"));

            if (!parent.getItinerary().getId().equals(itineraryId)) {
                throw BusinessException.badRequest("Parent comment does not belong to this itinerary");
            }

            comment.setParent(parent);
        }

        comment = commentRepository.save(comment);

        // 알림 발송
        if (request.getParentId() != null) {
            // 대댓글인 경우: 부모 댓글 작성자에게 알림 (본인이 아닌 경우)
            ItineraryComment parent = comment.getParent();
            if (!parent.getAuthor().getId().equals(userId)) {
                notificationService.notifyItineraryCommentReply(
                        parent.getAuthor().getId(),
                        itineraryId,
                        author.getNickname(),
                        request.getContent()
                );
            }
        } else {
            // 일반 댓글인 경우: 일정 소유자에게 알림 (본인이 아닌 경우)
            if (!itinerary.getOwner().getId().equals(userId)) {
                notificationService.notifyItineraryComment(
                        itinerary.getOwner().getId(),
                        itineraryId,
                        itinerary.getTitle(),
                        author.getNickname(),
                        request.getContent()
                );
            }
        }

        log.info("Comment {} added to itinerary {} by user {}", comment.getId(), itineraryId, userId);
        return toCommentResponse(comment, userId);
    }

    @Transactional
    public CommentResponse updateComment(Long userId, Long commentId, UpdateCommentRequest request) {
        ItineraryComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> BusinessException.notFound("Comment not found"));

        // 작성자 확인
        if (!comment.getAuthor().getId().equals(userId)) {
            throw BusinessException.forbidden("Only author can update comment");
        }

        if (comment.getIsDeleted()) {
            throw BusinessException.badRequest("Cannot update deleted comment");
        }

        comment.setContent(request.getContent());
        comment = commentRepository.save(comment);

        log.info("Comment {} updated by user {}", commentId, userId);
        return toCommentResponse(comment, userId);
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        ItineraryComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> BusinessException.notFound("Comment not found"));

        // 작성자 또는 일정 소유자만 삭제 가능
        boolean isAuthor = comment.getAuthor().getId().equals(userId);
        boolean isOwner = comment.getItinerary().getOwner().getId().equals(userId);

        if (!isAuthor && !isOwner) {
            throw BusinessException.forbidden("Permission denied");
        }

        // 대댓글이 있으면 소프트 삭제, 없으면 하드 삭제
        if (!comment.getReplies().isEmpty()) {
            comment.softDelete();
            commentRepository.save(comment);
        } else {
            commentRepository.delete(comment);
        }

        log.info("Comment {} deleted by user {}", commentId, userId);
    }

    public Page<CommentResponse> getComments(Long itineraryId, Long userId, Pageable pageable) {
        TravelItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        // 접근 권한 확인
        if (!canViewItinerary(itinerary, userId)) {
            throw BusinessException.forbidden("Access denied");
        }

        return commentRepository.findTopLevelCommentsByItineraryId(itineraryId, pageable)
                .map(comment -> toCommentResponse(comment, userId));
    }

    public Long getCommentCount(Long itineraryId) {
        return commentRepository.countByItineraryId(itineraryId);
    }

    private CommentResponse toCommentResponse(ItineraryComment comment, Long userId) {
        List<CommentResponse> replies = comment.getReplies().stream()
                .map(reply -> toCommentResponseWithoutReplies(reply, userId))
                .collect(Collectors.toList());

        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .author(CommentResponse.AuthorInfo.builder()
                        .id(comment.getAuthor().getId())
                        .nickname(comment.getAuthor().getNickname())
                        .profileImage(comment.getAuthor().getProfileImageUrl())
                        .build())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replies(replies)
                .replyCount(replies.size())
                .isDeleted(comment.getIsDeleted())
                .isAuthor(userId != null && comment.getAuthor().getId().equals(userId))
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private CommentResponse toCommentResponseWithoutReplies(ItineraryComment comment, Long userId) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .author(CommentResponse.AuthorInfo.builder()
                        .id(comment.getAuthor().getId())
                        .nickname(comment.getAuthor().getNickname())
                        .profileImage(comment.getAuthor().getProfileImageUrl())
                        .build())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replyCount(comment.getReplies().size())
                .isDeleted(comment.getIsDeleted())
                .isAuthor(userId != null && comment.getAuthor().getId().equals(userId))
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    // ==================== Helper Methods ====================

    private boolean canViewItinerary(TravelItinerary itinerary, Long userId) {
        // 소유자
        if (itinerary.getOwner().getId().equals(userId)) {
            return true;
        }

        // 공개 일정
        if (itinerary.getVisibility() == ItineraryVisibility.PUBLIC) {
            return true;
        }

        // 협업자
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && collaboratorRepository.existsByItineraryAndUserAndStatus(itinerary, user, InviteStatus.ACCEPTED)) {
                return true;
            }
        }

        return false;
    }

    private void checkEditPermission(TravelItinerary itinerary, Long userId) {
        if (itinerary.getOwner().getId().equals(userId)) {
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        if (!collaboratorRepository.hasEditPermission(itinerary, user)) {
            throw BusinessException.forbidden("Edit permission denied");
        }
    }

    private TravelItinerary getItineraryWithEditPermission(Long itineraryId, Long userId) {
        TravelItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        checkEditPermission(itinerary, userId);
        return itinerary;
    }

    private TravelItinerary getItineraryWithOwnerPermission(Long itineraryId, Long userId) {
        TravelItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        if (!itinerary.getOwner().getId().equals(userId)) {
            throw BusinessException.forbidden("Owner permission required");
        }

        return itinerary;
    }

    private TravelItinerary getItineraryWithAdminPermission(Long itineraryId, Long userId) {
        TravelItinerary itinerary = itineraryRepository.findById(itineraryId)
                .orElseThrow(() -> BusinessException.notFound("Itinerary not found"));

        if (itinerary.getOwner().getId().equals(userId)) {
            return itinerary;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.userNotFound(userId));

        if (!collaboratorRepository.hasAdminPermission(itinerary, user)) {
            throw BusinessException.forbidden("Admin permission required");
        }

        return itinerary;
    }

    private String generateShareCode() {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(SHARE_CODE_LENGTH);
        for (int i = 0; i < SHARE_CODE_LENGTH; i++) {
            sb.append(SHARE_CODE_CHARS.charAt(random.nextInt(SHARE_CODE_CHARS.length())));
        }
        return sb.toString();
    }

    // ==================== Response Mapping ====================

    private ItineraryResponse toResponse(TravelItinerary itinerary, Long userId) {
        return ItineraryResponse.builder()
                .id(itinerary.getId())
                .title(itinerary.getTitle())
                .description(itinerary.getDescription())
                .startDate(itinerary.getStartDate())
                .endDate(itinerary.getEndDate())
                .duration(itinerary.getDuration())
                .coverImage(itinerary.getCoverImage())
                .visibility(itinerary.getVisibility())
                .shareCode(itinerary.getShareCode())
                .viewCount(itinerary.getViewCount())
                .likeCount(itinerary.getLikeCount())
                .copyCount(itinerary.getCopyCount())
                .itemCount((int) itemRepository.countByItinerary(itinerary))
                .owner(toOwnerInfo(itinerary.getOwner()))
                .isOwner(userId != null && itinerary.getOwner().getId().equals(userId))
                .isLiked(isLiked(userId, itinerary.getId()))
                .createdAt(itinerary.getCreatedAt())
                .build();
    }

    private ItineraryResponse toDetailResponse(TravelItinerary itinerary, Long userId) {
        ItineraryResponse response = toResponse(itinerary, userId);
        response.setItems(itemRepository.findByItineraryOrderByDayNumberAscOrderIndexAsc(itinerary)
                .stream().map(this::toItemResponse).collect(Collectors.toList()));
        response.setCollaborators(collaboratorRepository.findByItineraryAndStatus(itinerary, InviteStatus.ACCEPTED)
                .stream().map(this::toCollaboratorResponse).collect(Collectors.toList()));
        return response;
    }

    private ItineraryItemResponse toItemResponse(ItineraryItem item) {
        return ItineraryItemResponse.builder()
                .id(item.getId())
                .dayNumber(item.getDayNumber())
                .orderIndex(item.getOrderIndex())
                .type(item.getType())
                .title(item.getTitle())
                .description(item.getDescription())
                .notes(item.getNotes())
                .placeName(item.getPlaceName())
                .placeAddress(item.getPlaceAddress())
                .latitude(item.getLatitude())
                .longitude(item.getLongitude())
                .googlePlaceId(item.getGooglePlaceId())
                .startTime(item.getStartTime())
                .endTime(item.getEndTime())
                .durationMinutes(item.getDurationMinutes())
                .estimatedCost(item.getEstimatedCost())
                .actualCost(item.getActualCost())
                .currency(item.getCurrency())
                .bookingReference(item.getBookingReference())
                .bookingUrl(item.getBookingUrl())
                .bookingStatus(item.getBookingStatus())
                .imageUrl(item.getImageUrl())
                .locationCollectionId(item.getLocationCollectionId())
                .build();
    }

    private CollaboratorResponse toCollaboratorResponse(ItineraryCollaborator collaborator) {
        return CollaboratorResponse.builder()
                .id(collaborator.getId())
                .userId(collaborator.getUser().getId())
                .username(collaborator.getUser().getNickname())
                .profileImage(collaborator.getUser().getProfileImageUrl())
                .role(collaborator.getRole())
                .status(collaborator.getStatus())
                .invitedAt(collaborator.getCreatedAt())
                .acceptedAt(collaborator.getAcceptedAt())
                .itineraryId(collaborator.getItinerary().getId())
                .itineraryTitle(collaborator.getItinerary().getTitle())
                .build();
    }

    private OwnerInfo toOwnerInfo(User user) {
        return OwnerInfo.builder()
                .id(user.getId())
                .username(user.getNickname())
                .profileImage(user.getProfileImageUrl())
                .build();
    }
}
