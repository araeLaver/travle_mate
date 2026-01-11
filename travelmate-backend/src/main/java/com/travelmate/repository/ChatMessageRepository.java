package com.travelmate.repository;

import com.travelmate.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 여러 채팅방의 읽지 않은 메시지 수를 일괄 조회 (N+1 방지)
     */
    @Query("SELECT cm.chatRoom.id as roomId, COUNT(cm) as cnt FROM ChatMessage cm " +
           "WHERE cm.chatRoom.id IN :roomIds " +
           "AND cm.isDeleted = false " +
           "AND cm.id > (SELECT COALESCE(cp.lastReadMessageId, 0) FROM ChatParticipant cp " +
           "              WHERE cp.chatRoom.id = cm.chatRoom.id AND cp.user.id = :userId) " +
           "GROUP BY cm.chatRoom.id")
    List<Object[]> countUnreadByRoomIdsRaw(@Param("roomIds") List<Long> roomIds, @Param("userId") Long userId);

    /**
     * 여러 채팅방의 읽지 않은 메시지 수를 Map으로 반환
     */
    default Map<Long, Integer> countUnreadByRoomIds(List<Long> roomIds, Long userId) {
        return countUnreadByRoomIdsRaw(roomIds, userId).stream()
            .collect(Collectors.toMap(
                row -> (Long) row[0],
                row -> ((Number) row[1]).intValue()
            ));
    }
    
    List<ChatMessage> findByChatRoomIdAndIsDeletedFalse(Long chatRoomId, Pageable pageable);
    
    ChatMessage findTopByChatRoomIdOrderBySentAtDesc(Long chatRoomId);
    
    Integer countByChatRoomIdAndIsDeletedFalse(Long chatRoomId);
    
    Integer countByChatRoomIdAndIdGreaterThanAndIsDeletedFalse(Long chatRoomId, Long messageId);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.chatRoom.id = :chatRoomId " +
           "AND cm.isDeleted = false AND cm.messageType != 'SYSTEM' " +
           "ORDER BY cm.sentAt DESC")
    List<ChatMessage> findRecentMessagesByRoomId(@Param("chatRoomId") Long chatRoomId, Pageable pageable);
    
    void deleteByChatRoomId(Long chatRoomId);
}