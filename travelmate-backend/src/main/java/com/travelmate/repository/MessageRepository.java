package com.travelmate.repository;

import com.travelmate.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * 대화 메시지 목록 (최신순 페이지네이션)
     * idx_messages_conv_created 인덱스 활용
     */
    Page<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    /**
     * 대화의 최근 메시지 1개 (lastMessage 표시용)
     */
    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    /**
     * 읽지 않은 메시지 수 (상대방이 보낸 것 중 읽지 않은 것)
     * idx_messages_conv_read 인덱스 활용
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id <> :myUserId " +
           "AND m.isRead = false")
    long countUnread(
            @Param("conversationId") Long conversationId,
            @Param("myUserId") Long myUserId);

    /**
     * 읽음 처리 (상대방이 보낸 메시지 일괄)
     */
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id <> :myUserId " +
           "AND m.isRead = false")
    int markAllAsRead(
            @Param("conversationId") Long conversationId,
            @Param("myUserId") Long myUserId);

    /**
     * 여러 대화의 읽지 않은 메시지 수를 한 번에 조회 (N+1 방지)
     */
    @Query("SELECT m.conversation.id, COUNT(m) FROM Message m " +
           "WHERE m.conversation.id IN :conversationIds " +
           "AND m.sender.id <> :myUserId " +
           "AND m.isRead = false " +
           "GROUP BY m.conversation.id")
    List<Object[]> countUnreadByConversationIds(
            @Param("conversationIds") List<Long> conversationIds,
            @Param("myUserId") Long myUserId);

    /**
     * 여러 대화의 최신 메시지를 한 번에 조회 (N+1 방지)
     * 각 conversationId별 created_at 최대값 메시지
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.id IN (" +
           "  SELECT MAX(m2.id) FROM Message m2 " +
           "  WHERE m2.conversation.id IN :conversationIds " +
           "  GROUP BY m2.conversation.id" +
           ")")
    List<Message> findLatestByConversationIds(
            @Param("conversationIds") List<Long> conversationIds);
}
