package com.travelmate.repository;

import com.travelmate.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {
    
    boolean existsByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    
    Optional<ChatParticipant> findByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    
    List<ChatParticipant> findByChatRoomId(Long chatRoomId);

    List<ChatParticipant> findByChatRoomIdAndIsActiveTrue(Long chatRoomId);

    List<ChatParticipant> findByUserIdAndIsActiveTrue(Long userId);
    
    void deleteByChatRoomId(Long chatRoomId);
}