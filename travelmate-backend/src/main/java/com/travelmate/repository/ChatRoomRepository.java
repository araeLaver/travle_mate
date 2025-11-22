package com.travelmate.repository;

import com.travelmate.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
    @Query("SELECT DISTINCT cr FROM ChatRoom cr " +
           "JOIN cr.participants cp " +
           "WHERE cp.user.id = :userId AND cp.isActive = true " +
           "ORDER BY cr.lastMessageAt DESC")
    List<ChatRoom> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT cr FROM ChatRoom cr " +
           "WHERE cr.roomType = 'PRIVATE' " +
           "AND EXISTS (SELECT 1 FROM ChatParticipant cp1 WHERE cp1.chatRoom = cr AND cp1.user.id = :user1Id) " +
           "AND EXISTS (SELECT 1 FROM ChatParticipant cp2 WHERE cp2.chatRoom = cr AND cp2.user.id = :user2Id)")
    Optional<ChatRoom> findPrivateRoomBetweenUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
    
    Optional<ChatRoom> findByTravelGroupId(Long travelGroupId);
    
    List<ChatRoom> findByIsActiveTrueOrderByLastMessageAtDesc();
}