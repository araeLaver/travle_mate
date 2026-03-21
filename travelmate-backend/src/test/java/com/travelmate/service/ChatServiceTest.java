package com.travelmate.service;

import com.travelmate.dto.ChatDto;
import com.travelmate.entity.*;
import com.travelmate.exception.BusinessException;
import com.travelmate.exception.ChatException;
import com.travelmate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService 테스트")
class ChatServiceTest {

    @Mock
    private ChatRoomRepository chatRoomRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ChatParticipantRepository chatParticipantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TravelGroupRepository travelGroupRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ChatService chatService;

    private User testUser;
    private User otherUser;
    private ChatRoom testChatRoom;
    private ChatParticipant testParticipant;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setNickname("테스터");
        testUser.setEmail("test@example.com");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setNickname("상대방");
        otherUser.setEmail("other@example.com");

        testChatRoom = new ChatRoom();
        testChatRoom.setId(100L);
        testChatRoom.setRoomName("테스트 채팅방");
        testChatRoom.setRoomType(ChatRoom.RoomType.PRIVATE);
        testChatRoom.setIsActive(true);
        testChatRoom.setCreatedAt(LocalDateTime.now());

        testParticipant = new ChatParticipant();
        testParticipant.setId(1L);
        testParticipant.setChatRoom(testChatRoom);
        testParticipant.setUser(testUser);
        testParticipant.setIsActive(true);
    }

    @Nested
    @DisplayName("createChatRoom 테스트")
    class CreateChatRoomTest {

        @Test
        @DisplayName("성공 - 개인 채팅방 생성")
        void createChatRoom_Private_Success() {
            // Given
            ChatDto.CreateChatRoomRequest request = new ChatDto.CreateChatRoomRequest();
            request.setRoomName("새 채팅방");
            request.setRoomType(ChatRoom.RoomType.PRIVATE);
            request.setParticipantIds(List.of(2L));

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(chatRoomRepository.save(any(ChatRoom.class))).thenAnswer(inv -> {
                ChatRoom room = inv.getArgument(0);
                room.setId(100L);
                return room;
            });
            when(chatParticipantRepository.existsByChatRoomIdAndUserId(anyLong(), anyLong())).thenReturn(false);
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
                ChatMessage msg = inv.getArgument(0);
                msg.setId(1L);
                // chatRoom이 설정되어 있지 않으면 테스트용 chatRoom 설정
                if (msg.getChatRoom() == null) {
                    ChatRoom room = new ChatRoom();
                    room.setId(100L);
                    msg.setChatRoom(room);
                }
                return msg;
            });

            // When
            ChatDto.ChatRoomResponse response = chatService.createChatRoom(1L, request);

            // Then
            assertThat(response.getId()).isEqualTo(100L);
            assertThat(response.getRoomName()).isEqualTo("새 채팅방");

            // 시스템 메시지 전송 확인
            verify(messagingTemplate).convertAndSend(eq("/topic/chat/100"), any(ChatDto.MessageResponse.class));
        }

        @Test
        @DisplayName("성공 - 그룹 채팅방 생성")
        void createChatRoom_Group_Success() {
            // Given
            TravelGroup travelGroup = new TravelGroup();
            travelGroup.setId(200L);
            travelGroup.setTitle("제주도 여행");

            ChatDto.CreateChatRoomRequest request = new ChatDto.CreateChatRoomRequest();
            request.setRoomType(ChatRoom.RoomType.GROUP);
            request.setTravelGroupId(200L);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(travelGroupRepository.findById(200L)).thenReturn(Optional.of(travelGroup));
            when(chatRoomRepository.save(any(ChatRoom.class))).thenAnswer(inv -> {
                ChatRoom room = inv.getArgument(0);
                room.setId(100L);
                return room;
            });
            when(chatParticipantRepository.existsByChatRoomIdAndUserId(anyLong(), anyLong())).thenReturn(false);
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
                ChatMessage msg = inv.getArgument(0);
                msg.setId(1L);
                if (msg.getChatRoom() == null) {
                    ChatRoom room = new ChatRoom();
                    room.setId(100L);
                    msg.setChatRoom(room);
                }
                return msg;
            });

            // When
            ChatDto.ChatRoomResponse response = chatService.createChatRoom(1L, request);

            // Then
            assertThat(response.getRoomName()).isEqualTo("제주도 여행 채팅");
            assertThat(response.getTravelGroupId()).isEqualTo(200L);
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void createChatRoom_UserNotFound() {
            // Given
            ChatDto.CreateChatRoomRequest request = new ChatDto.CreateChatRoomRequest();
            request.setRoomName("새 채팅방");

            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> chatService.createChatRoom(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("getChatRooms 테스트")
    class GetChatRoomsTest {

        @Test
        @DisplayName("성공 - 채팅방 목록 조회")
        void getChatRooms_Success() {
            // Given
            testChatRoom.setParticipants(List.of(testParticipant));

            when(chatRoomRepository.findByUserIdWithParticipants(1L))
                    .thenReturn(List.of(testChatRoom));
            when(chatMessageRepository.countUnreadByRoomIds(anyList(), eq(1L)))
                    .thenReturn(Map.of(100L, 5));

            // When
            List<ChatDto.ChatRoomResponse> result = chatService.getChatRooms(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo(100L);
            assertThat(result.get(0).getUnreadCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("빈 목록 - 채팅방 없음")
        void getChatRooms_Empty() {
            // Given
            when(chatRoomRepository.findByUserIdWithParticipants(1L))
                    .thenReturn(List.of());

            // When
            List<ChatDto.ChatRoomResponse> result = chatService.getChatRooms(1L);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getChatMessages 테스트")
    class GetChatMessagesTest {

        @Test
        @DisplayName("성공 - 메시지 목록 조회")
        void getChatMessages_Success() {
            // Given
            ChatMessage message = new ChatMessage();
            message.setId(1L);
            message.setChatRoom(testChatRoom);
            message.setSender(testUser);
            message.setContent("안녕하세요");
            message.setMessageType(ChatMessage.MessageType.TEXT);
            message.setSentAt(LocalDateTime.now());
            message.setIsDeleted(false);

            when(chatMessageRepository.findByChatRoomIdAndIsDeletedFalse(eq(100L), any(PageRequest.class)))
                    .thenReturn(List.of(message));

            // When
            List<ChatDto.MessageResponse> result = chatService.getChatMessages(100L, 0, 20);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getContent()).isEqualTo("안녕하세요");
        }
    }

    @Nested
    @DisplayName("processMessage 테스트")
    class ProcessMessageTest {

        @Test
        @DisplayName("성공 - 메시지 전송")
        void processMessage_Success() {
            // Given
            ChatDto.MessageRequest request = new ChatDto.MessageRequest();
            request.setChatRoomId(100L);
            request.setSenderId(1L);
            request.setContent("테스트 메시지");
            request.setMessageType(ChatMessage.MessageType.TEXT);

            when(chatRoomRepository.findById(100L)).thenReturn(Optional.of(testChatRoom));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
                ChatMessage msg = inv.getArgument(0);
                msg.setId(1L);
                msg.setSentAt(LocalDateTime.now());
                return msg;
            });

            // When
            chatService.processMessage(request);

            // Then
            verify(chatMessageRepository).save(any(ChatMessage.class));
            verify(chatRoomRepository).save(testChatRoom);
            verify(messagingTemplate).convertAndSend(eq("/topic/chat/100"), any(ChatDto.MessageResponse.class));

            assertThat(testChatRoom.getLastMessage()).isEqualTo("테스트 메시지");
        }

        @Test
        @DisplayName("성공 - 위치 메시지 전송")
        void processMessage_LocationMessage() {
            // Given
            ChatDto.MessageRequest request = new ChatDto.MessageRequest();
            request.setChatRoomId(100L);
            request.setSenderId(1L);
            request.setContent("현재 위치");
            request.setMessageType(ChatMessage.MessageType.LOCATION);
            request.setLocationLatitude(37.5665);
            request.setLocationLongitude(126.9780);
            request.setLocationName("서울역");

            when(chatRoomRepository.findById(100L)).thenReturn(Optional.of(testChatRoom));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
                ChatMessage msg = inv.getArgument(0);
                msg.setId(1L);
                msg.setSentAt(LocalDateTime.now());
                return msg;
            });

            // When
            chatService.processMessage(request);

            // Then
            ArgumentCaptor<ChatMessage> messageCaptor = ArgumentCaptor.forClass(ChatMessage.class);
            verify(chatMessageRepository).save(messageCaptor.capture());

            ChatMessage saved = messageCaptor.getValue();
            assertThat(saved.getMessageType()).isEqualTo(ChatMessage.MessageType.LOCATION);
            assertThat(saved.getLocationLatitude()).isEqualTo(37.5665);
            assertThat(saved.getLocationName()).isEqualTo("서울역");
        }
    }

    @Nested
    @DisplayName("joinChatRoom 테스트")
    class JoinChatRoomTest {

        @Test
        @DisplayName("성공 - 채팅방 참가")
        void joinChatRoom_Success() {
            // Given
            ChatDto.JoinRequest request = new ChatDto.JoinRequest();
            request.setChatRoomId(100L);
            request.setUserId(2L);

            when(chatRoomRepository.findById(100L)).thenReturn(Optional.of(testChatRoom));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(chatParticipantRepository.existsByChatRoomIdAndUserId(100L, 2L)).thenReturn(false);
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
                ChatMessage msg = inv.getArgument(0);
                msg.setId(1L);
                return msg;
            });

            // When
            chatService.joinChatRoom(request);

            // Then
            verify(chatParticipantRepository).save(any(ChatParticipant.class));
            verify(messagingTemplate).convertAndSendToUser(eq("2"), eq("/queue/chat/joined"), anyString());
        }

        @Test
        @DisplayName("이미 참가자인 경우 참가자 추가 안함")
        void joinChatRoom_AlreadyParticipant() {
            // Given
            ChatDto.JoinRequest request = new ChatDto.JoinRequest();
            request.setChatRoomId(100L);
            request.setUserId(1L);

            when(chatRoomRepository.findById(100L)).thenReturn(Optional.of(testChatRoom));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(chatParticipantRepository.existsByChatRoomIdAndUserId(100L, 1L)).thenReturn(true);

            // When
            chatService.joinChatRoom(request);

            // Then
            verify(chatParticipantRepository, never()).save(any(ChatParticipant.class));
        }
    }

    @Nested
    @DisplayName("leaveChatRoom 테스트")
    class LeaveChatRoomTest {

        @Test
        @DisplayName("성공 - 채팅방 퇴장")
        void leaveChatRoom_Success() {
            // Given
            ChatDto.LeaveRequest request = new ChatDto.LeaveRequest();
            request.setChatRoomId(100L);
            request.setUserId(1L);

            when(chatParticipantRepository.findByChatRoomIdAndUserId(100L, 1L))
                    .thenReturn(Optional.of(testParticipant));
            when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
                ChatMessage msg = inv.getArgument(0);
                msg.setId(1L);
                if (msg.getChatRoom() == null) {
                    msg.setChatRoom(testChatRoom);
                }
                return msg;
            });

            // When
            chatService.leaveChatRoom(request);

            // Then
            assertThat(testParticipant.getIsActive()).isFalse();
            verify(chatParticipantRepository).save(testParticipant);
        }

        @Test
        @DisplayName("실패 - 참가자 없음")
        void leaveChatRoom_ParticipantNotFound() {
            // Given
            ChatDto.LeaveRequest request = new ChatDto.LeaveRequest();
            request.setChatRoomId(100L);
            request.setUserId(999L);

            when(chatParticipantRepository.findByChatRoomIdAndUserId(100L, 999L))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> chatService.leaveChatRoom(request))
                    .isInstanceOf(ChatException.UnauthorizedChatAccessException.class)
                    .hasMessageContaining("채팅 참여자가 아닙니다");
        }
    }

    @Nested
    @DisplayName("markAsRead 테스트")
    class MarkAsReadTest {

        @Test
        @DisplayName("성공 - 메시지 읽음 처리")
        void markAsRead_Success() {
            // Given
            ChatMessage latestMessage = new ChatMessage();
            latestMessage.setId(50L);
            latestMessage.setChatRoom(testChatRoom);

            when(chatParticipantRepository.findByChatRoomIdAndUserId(100L, 1L))
                    .thenReturn(Optional.of(testParticipant));
            when(chatMessageRepository.findTopByChatRoomIdOrderBySentAtDesc(100L))
                    .thenReturn(latestMessage);

            // When
            chatService.markAsRead(100L, 1L);

            // Then
            assertThat(testParticipant.getLastReadMessageId()).isEqualTo(50L);
            assertThat(testParticipant.getLastReadAt()).isNotNull();
            verify(chatParticipantRepository).save(testParticipant);
        }

        @Test
        @DisplayName("메시지가 없으면 업데이트 안함")
        void markAsRead_NoMessages() {
            // Given
            when(chatParticipantRepository.findByChatRoomIdAndUserId(100L, 1L))
                    .thenReturn(Optional.of(testParticipant));
            when(chatMessageRepository.findTopByChatRoomIdOrderBySentAtDesc(100L))
                    .thenReturn(null);

            // When
            chatService.markAsRead(100L, 1L);

            // Then
            verify(chatParticipantRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getChatRoomDetail 테스트")
    class GetChatRoomDetailTest {

        @Test
        @DisplayName("성공 - 채팅방 상세 조회")
        void getChatRoomDetail_Success() {
            // Given
            testChatRoom.setParticipants(List.of(testParticipant));

            when(chatRoomRepository.findById(100L)).thenReturn(Optional.of(testChatRoom));
            when(chatParticipantRepository.existsByChatRoomIdAndUserId(100L, 1L)).thenReturn(true);
            when(chatMessageRepository.findByChatRoomIdAndIsDeletedFalse(eq(100L), any(PageRequest.class)))
                    .thenReturn(List.of());

            // When
            ChatDto.ChatRoomDetailResponse response = chatService.getChatRoomDetail(100L, 1L);

            // Then
            assertThat(response.getId()).isEqualTo(100L);
            assertThat(response.getRoomName()).isEqualTo("테스트 채팅방");
            assertThat(response.getCanSendMessage()).isTrue();
        }

        @Test
        @DisplayName("실패 - 접근 권한 없음")
        void getChatRoomDetail_Unauthorized() {
            // Given
            when(chatRoomRepository.findById(100L)).thenReturn(Optional.of(testChatRoom));
            when(chatParticipantRepository.existsByChatRoomIdAndUserId(100L, 999L)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> chatService.getChatRoomDetail(100L, 999L))
                    .isInstanceOf(ChatException.UnauthorizedChatAccessException.class)
                    .hasMessageContaining("채팅 참여자가 아닙니다");
        }
    }

    @Nested
    @DisplayName("updateTypingStatus 테스트")
    class UpdateTypingStatusTest {

        @Test
        @DisplayName("타이핑 시작 - 상태 브로드캐스트")
        void updateTypingStatus_StartTyping() {
            // When
            chatService.updateTypingStatus(100L, 1L, true);

            // Then
            verify(messagingTemplate).convertAndSend(eq("/topic/chat/100/typing"), anyList());
        }

        @Test
        @DisplayName("타이핑 종료")
        void updateTypingStatus_StopTyping() {
            // Given - 먼저 타이핑 시작
            chatService.updateTypingStatus(100L, 1L, true);

            // When - 타이핑 종료
            chatService.updateTypingStatus(100L, 1L, false);

            // Then
            verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/chat/100/typing"), anyList());
        }
    }

    @Nested
    @DisplayName("deleteMessage 테스트")
    class DeleteMessageTest {

        @Test
        @DisplayName("성공 - 본인 메시지 삭제")
        void deleteMessage_Success() {
            // Given
            ChatMessage message = new ChatMessage();
            message.setId(1L);
            message.setChatRoom(testChatRoom);
            message.setSender(testUser);
            message.setContent("원본 메시지");
            message.setIsDeleted(false);

            when(chatMessageRepository.findById(1L)).thenReturn(Optional.of(message));

            // When
            chatService.deleteMessage(1L, 1L);

            // Then
            assertThat(message.getIsDeleted()).isTrue();
            assertThat(message.getContent()).isEqualTo("[삭제된 메시지입니다]");
            verify(chatMessageRepository).save(message);
            verify(messagingTemplate).convertAndSend(eq("/topic/chat/100/delete"), any(ChatDto.MessageResponse.class));
        }

        @Test
        @DisplayName("실패 - 다른 사람 메시지 삭제 시도")
        void deleteMessage_Unauthorized() {
            // Given
            ChatMessage message = new ChatMessage();
            message.setId(1L);
            message.setChatRoom(testChatRoom);
            message.setSender(otherUser); // 다른 사용자의 메시지
            message.setContent("다른 사람 메시지");

            when(chatMessageRepository.findById(1L)).thenReturn(Optional.of(message));

            // When & Then
            assertThatThrownBy(() -> chatService.deleteMessage(1L, 1L))
                    .isInstanceOf(ChatException.UnauthorizedChatAccessException.class)
                    .hasMessageContaining("채팅 참여자가 아닙니다");
        }

        @Test
        @DisplayName("성공 - 시스템 메시지는 누구나 삭제 가능")
        void deleteMessage_SystemMessage() {
            // Given
            ChatMessage systemMessage = new ChatMessage();
            systemMessage.setId(1L);
            systemMessage.setChatRoom(testChatRoom);
            systemMessage.setSender(null); // 시스템 메시지
            systemMessage.setContent("시스템 메시지");
            systemMessage.setIsDeleted(false);

            when(chatMessageRepository.findById(1L)).thenReturn(Optional.of(systemMessage));

            // When
            chatService.deleteMessage(1L, 999L);

            // Then
            assertThat(systemMessage.getIsDeleted()).isTrue();
        }
    }

    @Nested
    @DisplayName("getMessageReadStatus 테스트")
    class GetMessageReadStatusTest {

        @Test
        @DisplayName("성공 - 메시지 읽음 상태 조회")
        void getMessageReadStatus_Success() {
            // Given
            ChatMessage message = new ChatMessage();
            message.setId(10L);
            message.setChatRoom(testChatRoom);

            ChatParticipant readParticipant = new ChatParticipant();
            readParticipant.setUser(otherUser);
            readParticipant.setLastReadMessageId(15L); // 10보다 큼
            readParticipant.setLastReadAt(LocalDateTime.now());

            when(chatMessageRepository.findById(10L)).thenReturn(Optional.of(message));
            when(chatParticipantRepository.findByChatRoomId(100L))
                    .thenReturn(List.of(testParticipant, readParticipant));

            // testParticipant는 아직 읽지 않음 (lastReadMessageId가 null)

            // When
            List<ChatDto.ReadStatusDto> result = chatService.getMessageReadStatus(10L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getNickname()).isEqualTo("상대방");
        }
    }
}
