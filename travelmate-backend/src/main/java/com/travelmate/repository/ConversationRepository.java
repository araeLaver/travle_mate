package com.travelmate.repository;

import com.travelmate.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * 두 사용자 간 기존 대화 조회 (순서 무관)
     */
    @Query("SELECT c FROM Conversation c " +
           "WHERE (c.participant1.id = :userId1 AND c.participant2.id = :userId2) " +
           "   OR (c.participant1.id = :userId2 AND c.participant2.id = :userId1)")
    Optional<Conversation> findByParticipants(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2);

    /**
     * 내 대화 목록 (최신 메시지순) - 참여자 정보 함께 로드
     */
    @Query("SELECT c FROM Conversation c " +
           "JOIN FETCH c.participant1 " +
           "JOIN FETCH c.participant2 " +
           "WHERE c.participant1.id = :userId OR c.participant2.id = :userId " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST")
    List<Conversation> findMyConversationsWithParticipants(@Param("userId") Long userId);
}
