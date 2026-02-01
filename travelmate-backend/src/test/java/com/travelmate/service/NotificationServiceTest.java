package com.travelmate.service;

import com.travelmate.entity.Notification;
import com.travelmate.entity.Notification.NotificationType;
import com.travelmate.entity.User;
import com.travelmate.entity.Post;
import com.travelmate.entity.Comment;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.NotificationRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService 테스트")
class NotificationServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("테스터");
        testUser.setFcmToken("test-fcm-token");

        testNotification = Notification.builder()
                .id(100L)
                .user(testUser)
                .type(NotificationType.SYSTEM)
                .title("테스트 알림")
                .message("테스트 메시지입니다")
                .actionUrl("/test")
                .isRead(false)
                .build();
    }

    @Nested
    @DisplayName("sendNotification 테스트")
    class SendNotificationTest {

        @Test
        @DisplayName("성공 - WebSocket으로 알림 전송")
        void sendNotification_Success() {
            // When
            notificationService.sendNotification(1L, "테스트 메시지");

            // Then
            verify(messagingTemplate).convertAndSendToUser(
                    eq("1"),
                    eq("/topic/notifications"),
                    argThat(notification -> {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> map = (java.util.Map<String, Object>) notification;
                        return "테스트 메시지".equals(map.get("message"))
                                && "SYSTEM".equals(map.get("type"));
                    })
            );
        }
    }

    @Nested
    @DisplayName("sendGroupNotification 테스트")
    class SendGroupNotificationTest {

        @Test
        @DisplayName("성공 - 그룹 채널로 알림 브로드캐스트")
        void sendGroupNotification_Success() {
            // When
            notificationService.sendGroupNotification(100L, "그룹 알림 메시지");

            // Then
            verify(messagingTemplate).convertAndSend(
                    eq("/topic/group/100"),
                    any(java.util.Map.class)
            );
        }
    }

    @Nested
    @DisplayName("sendLocationShareNotification 테스트")
    class SendLocationShareNotificationTest {

        @Test
        @DisplayName("성공 - 위치 공유 알림 전송")
        void sendLocationShareNotification_Success() {
            // When
            notificationService.sendLocationShareNotification(1L, 37.5665, 126.9780, "서울역");

            // Then
            verify(messagingTemplate).convertAndSendToUser(
                    eq("1"),
                    eq("/topic/location"),
                    argThat(notification -> {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> map = (java.util.Map<String, Object>) notification;
                        return "LOCATION_SHARE".equals(map.get("type"))
                                && Double.valueOf(37.5665).equals(map.get("latitude"))
                                && Double.valueOf(126.9780).equals(map.get("longitude"))
                                && "서울역".equals(map.get("locationName"));
                    })
            );
        }
    }

    @Nested
    @DisplayName("sendMatchingNotification 테스트")
    class SendMatchingNotificationTest {

        @Test
        @DisplayName("성공 - 매칭 알림 전송")
        void sendMatchingNotification_Success() {
            // When
            notificationService.sendMatchingNotification(1L, 2L, "매칭유저");

            // Then
            verify(messagingTemplate).convertAndSendToUser(
                    eq("1"),
                    eq("/topic/matching"),
                    argThat(notification -> {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> map = (java.util.Map<String, Object>) notification;
                        return "MATCHING".equals(map.get("type"))
                                && Long.valueOf(2L).equals(map.get("matchedUserId"))
                                && "매칭유저".equals(map.get("matchedUserNickname"))
                                && map.get("message").toString().contains("매칭유저님과 매칭");
                    })
            );
        }
    }

    @Nested
    @DisplayName("sendJoinRequestNotification 테스트")
    class SendJoinRequestNotificationTest {

        @Test
        @DisplayName("성공 - 가입 요청 알림 전송")
        void sendJoinRequestNotification_Success() {
            // When
            notificationService.sendJoinRequestNotification(100L, 2L, "요청자");

            // Then
            verify(messagingTemplate).convertAndSend(
                    eq("/topic/group/100/admin"),
                    any(java.util.Map.class)
            );
        }
    }

    @Nested
    @DisplayName("getNotifications 테스트")
    class GetNotificationsTest {

        @Test
        @DisplayName("성공 - 페이지네이션 알림 조회")
        void getNotifications_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Notification> page = new PageImpl<>(List.of(testNotification));
            when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, pageable))
                    .thenReturn(page);

            // When
            Page<NotificationService.NotificationDto> result =
                    notificationService.getNotifications(1L, pageable);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.getContent().get(0).getId()).isEqualTo(100L);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("테스트 알림");
        }
    }

    @Nested
    @DisplayName("getUnreadNotifications 테스트")
    class GetUnreadNotificationsTest {

        @Test
        @DisplayName("성공 - 읽지 않은 알림 조회")
        void getUnreadNotifications_Success() {
            // Given
            when(notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(1L))
                    .thenReturn(List.of(testNotification));

            // When
            List<NotificationService.NotificationDto> result =
                    notificationService.getUnreadNotifications(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).isRead()).isFalse();
        }
    }

    @Nested
    @DisplayName("getUnreadCount 테스트")
    class GetUnreadCountTest {

        @Test
        @DisplayName("성공 - 읽지 않은 알림 수 조회")
        void getUnreadCount_Success() {
            // Given
            when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(5L);

            // When
            long count = notificationService.getUnreadCount(1L);

            // Then
            assertThat(count).isEqualTo(5L);
        }
    }

    @Nested
    @DisplayName("markAsRead 테스트")
    class MarkAsReadTest {

        @Test
        @DisplayName("성공 - 특정 알림들 읽음 처리")
        void markAsRead_Success() {
            // Given
            List<Long> notificationIds = List.of(1L, 2L, 3L);
            when(notificationRepository.markAsRead(eq(notificationIds), eq(1L), any(LocalDateTime.class)))
                    .thenReturn(3);

            // When
            notificationService.markAsRead(notificationIds, 1L);

            // Then
            verify(notificationRepository).markAsRead(eq(notificationIds), eq(1L), any(LocalDateTime.class));
        }
    }

    @Nested
    @DisplayName("markAllAsRead 테스트")
    class MarkAllAsReadTest {

        @Test
        @DisplayName("성공 - 모든 알림 읽음 처리")
        void markAllAsRead_Success() {
            // Given
            when(notificationRepository.markAllAsRead(eq(1L), any(LocalDateTime.class)))
                    .thenReturn(10);

            // When
            notificationService.markAllAsRead(1L);

            // Then
            verify(notificationRepository).markAllAsRead(eq(1L), any(LocalDateTime.class));
        }
    }

    @Nested
    @DisplayName("deleteNotification 테스트")
    class DeleteNotificationTest {

        @Test
        @DisplayName("성공 - 알림 삭제")
        void deleteNotification_Success() {
            // Given
            when(notificationRepository.findById(100L)).thenReturn(Optional.of(testNotification));

            // When
            notificationService.deleteNotification(100L, 1L);

            // Then
            verify(notificationRepository).delete(testNotification);
        }

        @Test
        @DisplayName("알림을 찾을 수 없으면 예외 발생")
        void deleteNotification_NotFound() {
            // Given
            when(notificationRepository.findById(100L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> notificationService.deleteNotification(100L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("요청한 리소스를 찾을 수 없습니다");
        }

        @Test
        @DisplayName("다른 사용자의 알림 삭제 시 예외 발생")
        void deleteNotification_Unauthorized() {
            // Given
            when(notificationRepository.findById(100L)).thenReturn(Optional.of(testNotification));

            // When & Then
            assertThatThrownBy(() -> notificationService.deleteNotification(100L, 999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("인증이 필요합니다");
        }
    }

    @Nested
    @DisplayName("cleanupOldNotifications 테스트")
    class CleanupOldNotificationsTest {

        @Test
        @DisplayName("성공 - 오래된 알림 삭제")
        void cleanupOldNotifications_Success() {
            // Given
            when(notificationRepository.deleteOldNotifications(any(LocalDateTime.class)))
                    .thenReturn(100);

            // When
            notificationService.cleanupOldNotifications(30);

            // Then
            ArgumentCaptor<LocalDateTime> dateCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
            verify(notificationRepository).deleteOldNotifications(dateCaptor.capture());

            LocalDateTime capturedDate = dateCaptor.getValue();
            assertThat(capturedDate).isBefore(LocalDateTime.now().minusDays(29));
            assertThat(capturedDate).isAfter(LocalDateTime.now().minusDays(31));
        }
    }

    @Nested
    @DisplayName("도메인 특화 알림 테스트")
    class DomainSpecificNotificationsTest {

        @Test
        @DisplayName("그룹 초대 알림")
        void notifyGroupInvite() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.notifyGroupInvite(1L, 100L, "제주도 여행", "초대자");

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getType()).isEqualTo(NotificationType.GROUP_INVITE);
            assertThat(saved.getTitle()).isEqualTo("그룹 초대");
            assertThat(saved.getMessage()).contains("제주도 여행");
            assertThat(saved.getMessage()).contains("초대자");
        }

        @Test
        @DisplayName("새 멤버 가입 알림")
        void notifyGroupJoin() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.notifyGroupJoin(1L, 100L, "서울 투어", "새멤버");

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getType()).isEqualTo(NotificationType.GROUP_JOIN);
            assertThat(saved.getMessage()).contains("새멤버");
        }

        @Test
        @DisplayName("새 메시지 알림")
        void notifyNewMessage() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.notifyNewMessage(1L, 200L, "발신자", "안녕하세요!");

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getType()).isEqualTo(NotificationType.NEW_MESSAGE);
            assertThat(saved.getMessage()).contains("발신자");
            assertThat(saved.getMessage()).contains("안녕하세요!");
        }

        @Test
        @DisplayName("팔로우 알림")
        void notifyFollow() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.notifyFollow(1L, 2L, "팔로워");

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getType()).isEqualTo(NotificationType.FOLLOW);
            assertThat(saved.getTitle()).isEqualTo("새 팔로워");
        }

        @Test
        @DisplayName("NFT 수집 완료 알림")
        void notifyNftCollected() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.notifyNftCollected(1L, 300L, "경복궁", 100);

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getType()).isEqualTo(NotificationType.NFT_COLLECTED);
            assertThat(saved.getMessage()).contains("경복궁");
            assertThat(saved.getMessage()).contains("100P");
        }

        @Test
        @DisplayName("업적 달성 알림")
        void notifyAchievementUnlocked() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.notifyAchievementUnlocked(1L, "첫 여행", "첫 번째 여행을 시작했습니다");

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getType()).isEqualTo(NotificationType.ACHIEVEMENT_UNLOCKED);
            assertThat(saved.getTitle()).isEqualTo("업적 달성!");
        }

        @Test
        @DisplayName("마켓플레이스 판매 알림")
        void notifyMarketplaceSold() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.notifyMarketplaceSold(1L, 400L, "레어 NFT", 500);

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getType()).isEqualTo(NotificationType.MARKETPLACE_SOLD);
            assertThat(saved.getMessage()).contains("500P");
        }

        @Test
        @DisplayName("포인트 획득 알림")
        void notifyPointsReceived() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.notifyPointsReceived(1L, 50, "출석 보상");

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getType()).isEqualTo(NotificationType.POINTS_RECEIVED);
            assertThat(saved.getMessage()).contains("50P");
            assertThat(saved.getMessage()).contains("출석 보상");
        }
    }

    @Nested
    @DisplayName("댓글 알림 테스트")
    class CommentNotificationsTest {

        private User postAuthor;
        private User commentAuthor;
        private Post post;
        private Comment comment;

        @BeforeEach
        void setUp() {
            postAuthor = new User();
            postAuthor.setId(1L);
            postAuthor.setNickname("글작성자");

            commentAuthor = new User();
            commentAuthor.setId(2L);
            commentAuthor.setNickname("댓글작성자");

            post = new Post();
            post.setId(100L);

            comment = new Comment();
            comment.setId(200L);
            comment.setContent("테스트 댓글입니다");
            comment.setPost(post);
        }

        @Test
        @DisplayName("댓글 알림 - 짧은 댓글")
        void sendCommentNotification_ShortComment() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(postAuthor));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.sendCommentNotification(postAuthor, commentAuthor, post, comment);

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getMessage()).contains("댓글작성자");
            assertThat(saved.getMessage()).contains("테스트 댓글입니다");
        }

        @Test
        @DisplayName("댓글 알림 - 긴 댓글은 30자로 잘림")
        void sendCommentNotification_LongComment() {
            // Given
            comment.setContent("이것은 매우 긴 댓글입니다. 30자가 넘으면 잘려서 표시됩니다.");
            when(userRepository.findById(1L)).thenReturn(Optional.of(postAuthor));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.sendCommentNotification(postAuthor, commentAuthor, post, comment);

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getMessage()).contains("...");
        }

        @Test
        @DisplayName("답글 알림")
        void sendCommentReplyNotification() {
            // Given
            User parentAuthor = new User();
            parentAuthor.setId(3L);
            parentAuthor.setNickname("부모댓글작성자");

            when(userRepository.findById(3L)).thenReturn(Optional.of(parentAuthor));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.sendCommentReplyNotification(parentAuthor, commentAuthor, post, comment);

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getTitle()).isEqualTo("새 답글");
        }

        @Test
        @DisplayName("댓글 좋아요 알림")
        void sendCommentLikeNotification() {
            // Given
            User liker = new User();
            liker.setId(4L);
            liker.setNickname("좋아요누른사람");

            when(userRepository.findById(2L)).thenReturn(Optional.of(commentAuthor));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.sendCommentLikeNotification(commentAuthor, liker, comment);

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getTitle()).isEqualTo("댓글 좋아요");
            assertThat(saved.getMessage()).contains("좋아요누른사람");
        }

        @Test
        @DisplayName("멘션 알림")
        void sendMentionNotification() {
            // Given
            User mentionedUser = new User();
            mentionedUser.setId(5L);
            mentionedUser.setNickname("언급된사람");

            when(userRepository.findById(5L)).thenReturn(Optional.of(mentionedUser));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            notificationService.sendMentionNotification(mentionedUser, commentAuthor, post, comment);

            // Then
            ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
            verify(notificationRepository).save(captor.capture());

            Notification saved = captor.getValue();
            assertThat(saved.getTitle()).isEqualTo("멘션");
            assertThat(saved.getRelatedType()).isEqualTo("MENTION");
        }
    }
}
