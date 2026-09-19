package com.travelmate.repository;

import com.travelmate.entity.MatchRequest;
import com.travelmate.entity.MatchRequest.MatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRequestRepository extends JpaRepository<MatchRequest, Long> {

    @Query("SELECT mr FROM MatchRequest mr " +
           "WHERE mr.status = 'PENDING' " +
           "AND ((mr.requester.id = :userId1 AND mr.receiver.id = :userId2) " +
           "  OR (mr.requester.id = :userId2 AND mr.receiver.id = :userId1))")
    Optional<MatchRequest> findActiveRequestBetween(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2);

    Page<MatchRequest> findByReceiverIdAndStatusOrderByCreatedAtDesc(
            Long receiverId, MatchStatus status, Pageable pageable);

    Page<MatchRequest> findByRequesterIdAndStatusOrderByCreatedAtDesc(
            Long requesterId, MatchStatus status, Pageable pageable);

    @Query("SELECT mr FROM MatchRequest mr " +
           "WHERE mr.status IN ('ACCEPTED', 'MATCHED', 'COMPLETED') " +
           "AND (mr.requester.id = :userId OR mr.receiver.id = :userId) " +
           "ORDER BY COALESCE(mr.respondedAt, mr.createdAt) DESC")
    List<MatchRequest> findMatchHistory(@Param("userId") Long userId);

    @Query("SELECT CASE WHEN mr.requester.id = :userId THEN mr.receiver.id ELSE mr.requester.id END " +
           "FROM MatchRequest mr " +
           "WHERE (mr.requester.id = :userId OR mr.receiver.id = :userId) " +
           "AND mr.status IN ('PENDING', 'ACCEPTED', 'MATCHED', 'COMPLETED')")
    List<Long> findMatchedOrRequestedUserIds(@Param("userId") Long userId);

    long countByReceiverIdAndStatus(Long receiverId, MatchStatus status);
}
