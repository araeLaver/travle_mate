package com.travelmate.service;

import com.travelmate.dto.ChatDto;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.*;
import com.travelmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ChatService {
    
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final UserRepository userRepository;
    private final TravelGroupRepository travelGroupRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    // 타이핑 상태 관리용 메모리 저장소
    private final Map<String, Map<Long, LocalDateTime>> typingStatus = new ConcurrentHashMap<>();
    
    public ChatDto.ChatRoomResponse createChatRoom(Long creatorId, ChatDto.CreateChatRoomRequest request) {
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        ChatRoom chatRoom = new ChatRoom();
        chatRoom.setRoomName(request.getRoomName());
        chatRoom.setRoomType(request.getRoomType());
        chatRoom.setIsActive(true);
        
        // 여행 그룹 채팅인 경우
        if (request.getTravelGroupId() != null) {
            TravelGroup travelGroup = travelGroupRepository.findById(request.getTravelGroupId())
                .orElseThrow(() -> new RuntimeException("여행 그룹을 찾을 수 없습니다."));
            chatRoom.setTravelGroup(travelGroup);
            chatRoom.setRoomName(travelGroup.getTitle() + " 채팅");
        }
        
        ChatRoom savedRoom = chatRoomRepository.save(chatRoom);
        
        // 참가자 추가
        addParticipantToRoom(savedRoom, creator);
        
        if (request.getParticipantIds() != null) {
            for (Long participantId : request.getParticipantIds()) {
                User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new RuntimeException("참가자를 찾을 수 없습니다: " + participantId));
                addParticipantToRoom(savedRoom, participant);
            }
        }
        
        // 시스템 메시지 전송
        sendSystemMessage(savedRoom.getId(), String.format("%s님이 채팅방을 생성했습니다.", creator.getNickname()));
        
        log.info("새 채팅방 생성: {} (타입: {})", savedRoom.getId(), savedRoom.getRoomType());
        
        return convertChatRoomToDto(savedRoom);
    }
    
    @Transactional(readOnly = true)
    public List<ChatDto.ChatRoomResponse> getChatRooms(Long userId) {
        // N+1 방지: participants와 user를 함께 로드
        List<ChatRoom> rooms = chatRoomRepository.findByUserIdWithParticipants(userId);

        // 읽지 않은 메시지 수를 일괄 조회
        Map<Long, Integer> unreadCounts = getUnreadMessageCounts(
            rooms.stream().map(ChatRoom::getId).collect(Collectors.toList()),
            userId
        );

        return rooms.stream()
            .map(room -> {
                ChatDto.ChatRoomResponse dto = convertChatRoomToDto(room);
                dto.setUnreadCount(unreadCounts.getOrDefault(room.getId(), 0));
                return dto;
            })
            .collect(Collectors.toList());
    }

    /**
     * 여러 채팅방의 읽지 않은 메시지 수를 일괄 조회
     */
    private Map<Long, Integer> getUnreadMessageCounts(List<Long> roomIds, Long userId) {
        if (roomIds.isEmpty()) {
            return Map.of();
        }
        return chatMessageRepository.countUnreadByRoomIds(roomIds, userId);
    }
    
    @Transactional(readOnly = true)
    public List<ChatDto.MessageResponse> getChatMessages(Long roomId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("sentAt").descending());
        List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdAndIsDeletedFalse(roomId, pageRequest);
        
        return messages.stream()
            .map(this::convertMessageToDto)
            .collect(Collectors.toList());
    }
    
    public void processMessage(ChatDto.MessageRequest request) {
        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
            .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다."));
        
        User sender = userRepository.findById(request.getSenderId())
            .orElseThrow(() -> new RuntimeException("발신자를 찾을 수 없습니다."));
        
        ChatMessage message = new ChatMessage();
        message.setChatRoom(chatRoom);
        message.setSender(sender);
        message.setContent(request.getContent());
        message.setMessageType(request.getMessageType());
        message.setImageUrl(request.getImageUrl());
        message.setLocationLatitude(request.getLocationLatitude());
        message.setLocationLongitude(request.getLocationLongitude());
        message.setLocationName(request.getLocationName());
        message.setIsDeleted(false);
        
        ChatMessage savedMessage = chatMessageRepository.save(message);
        
        // 채팅방 최근 메시지 업데이트
        chatRoom.setLastMessage(request.getContent());
        chatRoom.setLastMessageAt(LocalDateTime.now());
        chatRoomRepository.save(chatRoom);
        
        // 채팅방 참가자들에게 메시지 브로드캐스트
        ChatDto.MessageResponse messageDto = convertMessageToDto(savedMessage);
        messagingTemplate.convertAndSend("/topic/chat/" + request.getChatRoomId(), messageDto);
        
        log.debug("메시지 전송: 방 {} - 발신자 {}", request.getChatRoomId(), sender.getNickname());
    }
    
    public void joinChatRoom(ChatDto.JoinRequest request) {
        ChatRoom chatRoom = chatRoomRepository.findById(request.getChatRoomId())
            .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다."));
        
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 이미 참가자인지 확인
        if (!chatParticipantRepository.existsByChatRoomIdAndUserId(request.getChatRoomId(), request.getUserId())) {
            addParticipantToRoom(chatRoom, user);
            sendSystemMessage(request.getChatRoomId(), String.format("%s님이 입장했습니다.", user.getNickname()));
        }
        
        // 참가자에게 입장 알림
        messagingTemplate.convertAndSendToUser(
            request.getUserId().toString(),
            "/queue/chat/joined",
            "채팅방에 참여했습니다."
        );
        
        log.info("채팅방 참가: 방 {} - 사용자 {}", request.getChatRoomId(), user.getNickname());
    }
    
    public void leaveChatRoom(ChatDto.LeaveRequest request) {
        ChatParticipant participant = chatParticipantRepository.findByChatRoomIdAndUserId(
            request.getChatRoomId(), request.getUserId())
            .orElseThrow(() -> new RuntimeException("채팅방 참가자를 찾을 수 없습니다."));
        
        participant.setIsActive(false);
        chatParticipantRepository.save(participant);
        
        User user = participant.getUser();
        sendSystemMessage(request.getChatRoomId(), String.format("%s님이 퇴장했습니다.", user.getNickname()));
        
        log.info("채팅방 퇴장: 방 {} - 사용자 {}", request.getChatRoomId(), user.getNickname());
    }
    
    public void markAsRead(Long roomId, Long userId) {
        ChatParticipant participant = chatParticipantRepository.findByChatRoomIdAndUserId(roomId, userId)
            .orElseThrow(() -> new RuntimeException("채팅방 참가자를 찾을 수 없습니다."));
        
        // 최신 메시지 ID 조회
        ChatMessage latestMessage = chatMessageRepository.findTopByChatRoomIdOrderBySentAtDesc(roomId);
        if (latestMessage != null) {
            participant.setLastReadMessageId(latestMessage.getId());
            participant.setLastReadAt(LocalDateTime.now());
            chatParticipantRepository.save(participant);
        }
        
        log.debug("메시지 읽음 처리: 방 {} - 사용자 {}", roomId, userId);
    }
    
    private void addParticipantToRoom(ChatRoom chatRoom, User user) {
        if (!chatParticipantRepository.existsByChatRoomIdAndUserId(chatRoom.getId(), user.getId())) {
            ChatParticipant participant = new ChatParticipant();
            participant.setChatRoom(chatRoom);
            participant.setUser(user);
            participant.setIsActive(true);
            chatParticipantRepository.save(participant);
        }
    }
    
    private void sendSystemMessage(Long roomId, String content) {
        ChatMessage systemMessage = new ChatMessage();
        systemMessage.setChatRoom(chatRoomRepository.findById(roomId).orElse(null));
        systemMessage.setContent(content);
        systemMessage.setMessageType(ChatMessage.MessageType.SYSTEM);
        systemMessage.setIsDeleted(false);
        
        ChatMessage savedMessage = chatMessageRepository.save(systemMessage);
        
        ChatDto.MessageResponse messageDto = convertMessageToDto(savedMessage);
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, messageDto);
    }
    
    private Integer getUnreadMessageCount(Long roomId, Long userId) {
        ChatParticipant participant = chatParticipantRepository.findByChatRoomIdAndUserId(roomId, userId)
            .orElse(null);
        
        if (participant == null || participant.getLastReadMessageId() == null) {
            return chatMessageRepository.countByChatRoomIdAndIsDeletedFalse(roomId);
        }
        
        return chatMessageRepository.countByChatRoomIdAndIdGreaterThanAndIsDeletedFalse(
            roomId, participant.getLastReadMessageId());
    }
    
    private ChatDto.ChatRoomResponse convertChatRoomToDto(ChatRoom chatRoom) {
        ChatDto.ChatRoomResponse dto = new ChatDto.ChatRoomResponse();
        dto.setId(chatRoom.getId());
        dto.setRoomName(chatRoom.getRoomName());
        dto.setRoomType(chatRoom.getRoomType());
        dto.setTravelGroupId(chatRoom.getTravelGroup() != null ? chatRoom.getTravelGroup().getId() : null);
        dto.setLastMessage(chatRoom.getLastMessage());
        dto.setLastMessageAt(chatRoom.getLastMessageAt());
        dto.setCreatedAt(chatRoom.getCreatedAt());
        
        // 참가자 목록
        if (chatRoom.getParticipants() != null) {
            List<ChatDto.ParticipantDto> participants = chatRoom.getParticipants().stream()
                .map(this::convertParticipantToDto)
                .collect(Collectors.toList());
            dto.setParticipants(participants);
        }
        
        return dto;
    }
    
    private ChatDto.ParticipantDto convertParticipantToDto(ChatParticipant participant) {
        ChatDto.ParticipantDto dto = new ChatDto.ParticipantDto();
        dto.setUserId(participant.getUser().getId());
        dto.setNickname(participant.getUser().getNickname());
        dto.setProfileImageUrl(participant.getUser().getProfileImageUrl());
        dto.setLastReadAt(participant.getLastReadAt());
        dto.setIsActive(participant.getIsActive());
        return dto;
    }
    
    private ChatDto.MessageResponse convertMessageToDto(ChatMessage message) {
        ChatDto.MessageResponse dto = new ChatDto.MessageResponse();
        dto.setId(message.getId());
        dto.setChatRoomId(message.getChatRoom().getId());
        
        if (message.getSender() != null) {
            dto.setSender(convertUserToDto(message.getSender()));
        }
        
        dto.setContent(message.getContent());
        dto.setMessageType(message.getMessageType());
        dto.setImageUrl(message.getImageUrl());
        dto.setLocationLatitude(message.getLocationLatitude());
        dto.setLocationLongitude(message.getLocationLongitude());
        dto.setLocationName(message.getLocationName());
        dto.setSentAt(message.getSentAt());
        dto.setIsDeleted(message.getIsDeleted());
        
        return dto;
    }
    
    private UserDto.Response convertUserToDto(User user) {
        return UserDto.Response.builder()
            .id(user.getId())
            .nickname(user.getNickname())
            .profileImageUrl(user.getProfileImageUrl())
            .build();
    }
    
    @Transactional(readOnly = true)
    public ChatDto.ChatRoomDetailResponse getChatRoomDetail(Long roomId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다."));
        
        // 참가자 권한 확인
        if (!chatParticipantRepository.existsByChatRoomIdAndUserId(roomId, userId)) {
            throw new RuntimeException("채팅방 접근 권한이 없습니다.");
        }
        
        ChatDto.ChatRoomDetailResponse response = new ChatDto.ChatRoomDetailResponse();
        ChatDto.ChatRoomResponse basicDto = convertChatRoomToDto(chatRoom);
        
        // 기본 정보 복사
        response.setId(basicDto.getId());
        response.setRoomName(basicDto.getRoomName());
        response.setRoomType(basicDto.getRoomType());
        response.setTravelGroupId(basicDto.getTravelGroupId());
        response.setParticipants(basicDto.getParticipants());
        response.setLastMessage(basicDto.getLastMessage());
        response.setLastMessageAt(basicDto.getLastMessageAt());
        response.setCreatedAt(basicDto.getCreatedAt());
        
        // 최근 메시지 10개
        List<ChatDto.MessageResponse> recentMessages = getChatMessages(roomId, 0, 10);
        response.setRecentMessages(recentMessages);
        
        // 메시지 전송 권한
        response.setCanSendMessage(chatRoom.getIsActive());
        
        // 현재 타이핑 중인 사용자들
        response.setTypingUsers(getTypingUsers(roomId, userId));
        
        return response;
    }
    
    public void updateTypingStatus(Long roomId, Long userId, boolean isTyping) {
        String roomKey = "room_" + roomId;
        
        if (isTyping) {
            typingStatus.computeIfAbsent(roomKey, k -> new ConcurrentHashMap<>())
                .put(userId, LocalDateTime.now());
        } else {
            Map<Long, LocalDateTime> roomTyping = typingStatus.get(roomKey);
            if (roomTyping != null) {
                roomTyping.remove(userId);
                if (roomTyping.isEmpty()) {
                    typingStatus.remove(roomKey);
                }
            }
        }
        
        // 타이핑 상태 브로드캐스트
        List<String> typingUsers = getTypingUsers(roomId, userId);
        messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/typing", typingUsers);
    }
    
    private List<String> getTypingUsers(Long roomId, Long excludeUserId) {
        String roomKey = "room_" + roomId;
        Map<Long, LocalDateTime> roomTyping = typingStatus.get(roomKey);
        
        if (roomTyping == null) {
            return List.of();
        }
        
        // 30초 이상 지난 타이핑 상태는 제거
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(30);
        roomTyping.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
        
        return roomTyping.keySet().stream()
            .filter(userId -> !userId.equals(excludeUserId))
            .map(userId -> {
                User user = userRepository.findById(userId).orElse(null);
                return user != null ? user.getNickname() : "Unknown";
            })
            .collect(Collectors.toList());
    }
    
    public void deleteMessage(Long messageId, Long userId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("메시지를 찾을 수 없습니다."));
        
        // 메시지 작성자 또는 시스템 메시지만 삭제 가능
        if (message.getSender() == null || message.getSender().getId().equals(userId)) {
            message.setIsDeleted(true);
            message.setContent("[삭제된 메시지입니다]");
            chatMessageRepository.save(message);
            
            // 삭제 알림 브로드캐스트
            ChatDto.MessageResponse deletedMessage = convertMessageToDto(message);
            messagingTemplate.convertAndSend("/topic/chat/" + message.getChatRoom().getId() + "/delete", deletedMessage);
            
            log.info("메시지 삭제: {} by {}", messageId, userId);
        } else {
            throw new RuntimeException("메시지 삭제 권한이 없습니다.");
        }
    }
    
    @Transactional(readOnly = true)
    public List<ChatDto.ReadStatusDto> getMessageReadStatus(Long messageId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("메시지를 찾을 수 없습니다."));
        
        List<ChatParticipant> participants = chatParticipantRepository.findByChatRoomId(message.getChatRoom().getId());
        
        return participants.stream()
            .filter(p -> p.getLastReadMessageId() != null && p.getLastReadMessageId() >= messageId)
            .map(p -> {
                ChatDto.ReadStatusDto dto = new ChatDto.ReadStatusDto();
                dto.setUserId(p.getUser().getId());
                dto.setNickname(p.getUser().getNickname());
                dto.setReadAt(p.getLastReadAt());
                return dto;
            })
            .collect(Collectors.toList());
    }
}