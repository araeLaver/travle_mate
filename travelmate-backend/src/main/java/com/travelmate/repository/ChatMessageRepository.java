package com.travelmate.repository;

import com.travelmate.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
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