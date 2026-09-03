package com.travelmate.service;

import com.travelmate.dto.ConversationDto;
import com.travelmate.entity.Conversation;
import com.travelmate.entity.MatchRequest;
import com.travelmate.entity.Message;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.exception.ErrorCode;
import com.travelmate.repository.ConversationRepository;
import com.travelmate.repository.MatchRequestRepository;
import com.travelmate.repository.MessageRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MatchRequestRepository matchRequestRepository;
    private final UserRepository userRepository;

    // ────────────────────────────────────────────────
    // POST /api/conversations
    // ────────────────────────────────────────────────

    /**
     * 대화 시작 (매칭된 pair만 가능, 중복 방지)
     * - 수락되었거나 완료된 매칭이 존재해야 함
     * - 이미 대화가 있으면 기존 대화 반환
     */
    public ConversationDto.ConversationResponse startConversation(
            Long myUserId,
            ConversationDto.StartConversationRequest request) {

        Long targetUserId = request.getTargetUserId();

        if (myUserId.equals(targetUserId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        // 매칭 확인: 두 사용자 간 수락/완료된 매칭이 있어야 대화 시작 가능
        boolean isMatched = matchRequestRepository.findMatchHistory(myUserId).stream()
                .anyMatch(mr -> {
                    Long otherId = mr.getRequester().getId().equals(myUserId)
                            ? mr.getReceiver().getId()
                            : mr.getRequester().getId();
                    return otherId.equals(targetUserId);
                });

        if (!isMatched) {
            throw new BusinessException(ErrorCode.NOT_MATCHED_PAIR);
        }

        // 중복 대화 방지: 이미 존재하면 반환
        return conversationRepository
                .findByParticipants(myUserId, targetUserId)
                .map(this::toConversationResponse)
                .orElseGet(() -> {
                    User me = getUser(myUserId);
                    User target = getUser(targetUserId);

                    // participant 저장 순서: id 오름차순 (UNIQUE 제약 대응)
                    User p1 = me.getId() < target.getId() ? me : target;
                    User p2 = me.getId() < target.getId() ? target : me;

                    Conversation conv = Conversation.builder()
                            .participant1(p1)
                            .participant2(p2)
                            .build();

                    Conversation saved = conversationRepository.save(conv);
                    log.info("새 대화 생성: id={}, p1={}, p2={}", saved.getId(), p1.getId(), p2.getId());
                    return toConversationResponse(saved);
                });
    }

    // ────────────────────────────────────────────────
    // GET /api/conversations
    // ────────────────────────────────────────────────

    /**
     * 내 대화 목록 (lastMessage + 안읽은수 포함)
     */
    @Transactional(readOnly = true)
    public List<ConversationDto.ConversationSummary> getMyConversations(Long myUserId) {
        List<Conversation> conversations =
                conversationRepository.findMyConversationsWithParticipants(myUserId);

        if (conversations.isEmpty()) {
            return List.of();
        }

        List<Long> convIds = conversations.stream()
                .map(Conversation::getId)
                .collect(Collectors.toList());

        // 최신 메시지 일괄 조회 (N+1 방지)
        Map<Long, Message> latestMessages = messageRepository
                .findLatestByConversationIds(convIds).stream()
                .collect(Collectors.toMap(m -> m.getConversation().getId(), m -> m));

        // 읽지 않은 메시지 수 일괄 조회
        Map<Long, Long> unreadCounts = messageRepository
                .countUnreadByConversationIds(convIds, myUserId).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        return conversations.stream()
                .map(conv -> {
                    User other = conv.otherParticipant(myUserId);
                    Message latest = latestMessages.get(conv.getId());
                    long unread = unreadCounts.getOrDefault(conv.getId(), 0L);

                    return ConversationDto.ConversationSummary.builder()
                            .id(conv.getId())
                            .otherUser(toParticipantInfo(other))
                            .lastMessage(latest != null ? toLastMessageInfo(latest) : null)
                            .unreadCount(unread)
                            .createdAt(conv.getCreatedAt())
                            .lastMessageAt(conv.getLastMessageAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ────────────────────────────────────────────────
    // GET /api/messages
    // ────────────────────────────────────────────────

    /**
     * 메시지 목록 (최신순 페이지네이션)
     */
    @Transactional(readOnly = true)
    public ConversationDto.MessagePageResponse getMessages(
            Long myUserId,
            Long conversationId,
            int page,
            int size) {

        Conversation conv = getConversation(conversationId);
        checkParticipant(conv, myUserId);

        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Message> messagePage =
                messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        List<ConversationDto.MessageResponse> responses = messagePage.getContent().stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());

        return ConversationDto.MessagePageResponse.builder()
                .messages(responses)
                .page(page)
                .size(size)
                .hasNext(messagePage.hasNext())
                .totalElements(messagePage.getTotalElements())
                .build();
    }

    // ────────────────────────────────────────────────
    // POST /api/messages
    // ────────────────────────────────────────────────

    /**
     * 메시지 전송
     */
    public ConversationDto.MessageResponse sendMessage(
            Long myUserId,
            ConversationDto.SendMessageRequest request) {

        Conversation conv = getConversation(request.getConversationId());
        checkParticipant(conv, myUserId);

        User sender = getUser(myUserId);

        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        Message message = Message.builder()
                .conversation(conv)
                .sender(sender)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);

        // lastMessageAt 갱신
        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conv);

        log.debug("메시지 전송: convId={}, senderId={}", conv.getId(), myUserId);
        return toMessageResponse(saved);
    }

    // ────────────────────────────────────────────────
    // PUT /api/messages/{conversationId}/read
    // ────────────────────────────────────────────────

    /**
     * 읽음 처리 (내가 받은 메시지 전체)
     */
    public int markAsRead(Long myUserId, Long conversationId) {
        Conversation conv = getConversation(conversationId);
        checkParticipant(conv, myUserId);

        int updated = messageRepository.markAllAsRead(conversationId, myUserId);
        log.debug("읽음 처리: convId={}, userId={}, count={}", conversationId, myUserId, updated);
        return updated;
    }

    // ────────────────────────────────────────────────
    // Private helpers
    // ────────────────────────────────────────────────

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private Conversation getConversation(Long conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONVERSATION_NOT_FOUND));
    }

    private void checkParticipant(Conversation conv, Long userId) {
        if (!conv.hasParticipant(userId)) {
            throw new BusinessException(ErrorCode.NOT_CONVERSATION_PARTICIPANT);
        }
    }

    private ConversationDto.ConversationResponse toConversationResponse(Conversation conv) {
        return ConversationDto.ConversationResponse.builder()
                .id(conv.getId())
                .participant1(toParticipantInfo(conv.getParticipant1()))
                .participant2(toParticipantInfo(conv.getParticipant2()))
                .createdAt(conv.getCreatedAt())
                .lastMessageAt(conv.getLastMessageAt())
                .build();
    }

    private ConversationDto.ParticipantInfo toParticipantInfo(User user) {
        if (user == null) return null;
        return ConversationDto.ParticipantInfo.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    private ConversationDto.MessageResponse toMessageResponse(Message msg) {
        return ConversationDto.MessageResponse.builder()
                .id(msg.getId())
                .conversationId(msg.getConversation().getId())
                .senderId(msg.getSender().getId())
                .senderNickname(msg.getSender().getNickname())
                .senderProfileImageUrl(msg.getSender().getProfileImageUrl())
                .content(msg.getContent())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .build();
    }

    private ConversationDto.LastMessageInfo toLastMessageInfo(Message msg) {
        return ConversationDto.LastMessageInfo.builder()
                .id(msg.getId())
                .senderId(msg.getSender().getId())
                .content(msg.getContent())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
