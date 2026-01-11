package com.travelmate.repository;

import com.travelmate.entity.ChatRoom;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    /**
     * ID로 채팅방 조회 - participants와 user를 함께 로드하여 N+1 방지
     */
    @EntityGraph(attributePaths = {"participants", "participants.user"})
    Optional<ChatRoom> findById(Long id);

    /**
     * 사용자의 채팅방 목록 조회 - participants 함께 로드
     */
    @Query("SELECT DISTINCT cr FROM ChatRoom cr " +
           "LEFT JOIN FETCH cr.participants cp " +
           "LEFT JOIN FETCH cp.user " +
           "WHERE EXISTS (SELECT 1 FROM ChatParticipant p WHERE p.chatRoom = cr AND p.user.id = :userId AND p.isActive = true) " +
           "ORDER BY cr.lastMessageAt DESC")
    List<ChatRoom> findByUserIdWithParticipants(@Param("userId") Long userId);

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