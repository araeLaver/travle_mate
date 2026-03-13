package com.travelmate.repository;

import com.travelmate.entity.MatchingRequest;
import com.travelmate.entity.MatchingRequest.MatchingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 동반자 매칭 요청 Repository
 * - matching_requests 테이블 기반
 * - MatchingRequest Entity (MatchRequest와 별개)
 */
@Repository
public interface MatchingRequestRepository extends JpaRepository<MatchingRequest, Long> {

    /**
     * 두 사용자 간 PENDING 상태의 매칭 요청 조회 (양방향)
     */
    @Query("SELECT mr FROM MatchingRequest mr " +
           "WHERE mr.status = 'PENDING' " +
           "AND ((mr.fromUser.id = :userId1 AND mr.toUser.id = :userId2) " +
           "  OR (mr.fromUser.id = :userId2 AND mr.toUser.id = :userId1))")
    Optional<MatchingRequest> findPendingRequestBetween(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2);

    /**
     * 이미 요청을 보냈거나 받은 사용자 ID 목록 조회 (PENDING, ACCEPTED 포함)
     * - 추천 목록에서 제외할 사용자 식별용
     */
    @Query("SELECT CASE WHEN mr.fromUser.id = :userId THEN mr.toUser.id ELSE mr.fromUser.id END " +
           "FROM MatchingRequest mr " +
           "WHERE (mr.fromUser.id = :userId OR mr.toUser.id = :userId) " +
           "AND mr.status IN ('PENDING', 'ACCEPTED')")
    List<Long> findAlreadyInteractedUserIds(@Param("userId") Long userId);

    /**
     * 내가 보낸 요청 중 fromUser가 userId인 모든 toUser ID 조회
     * - 이미 요청 보낸 사용자 제외 목적
     */
    @Query("SELECT mr.toUser.id FROM MatchingRequest mr " +
           "WHERE mr.fromUser.id = :userId " +
           "AND mr.status IN ('PENDING', 'ACCEPTED', 'REJECTED')")
    List<Long> findSentRequestTargetIds(@Param("userId") Long userId);

    /**
     * 받은 매칭 요청 (PENDING) 페이징 조회
     */
    Page<MatchingRequest> findByToUserIdAndStatusOrderByCreatedAtDesc(
            Long toUserId, MatchingStatus status, Pageable pageable);

    /**
     * 보낸 매칭 요청 (PENDING) 페이징 조회
     */
    Page<MatchingRequest> findByFromUserIdAndStatusOrderByCreatedAtDesc(
            Long fromUserId, MatchingStatus status, Pageable pageable);

    /**
     * 매칭 히스토리 조회 - ACCEPTED 상태이며 from 또는 to가 userId인 요청
     */
    @Query("SELECT mr FROM MatchingRequest mr " +
           "WHERE mr.status = 'ACCEPTED' " +
           "AND (mr.fromUser.id = :userId OR mr.toUser.id = :userId) " +
           "ORDER BY mr.respondedAt DESC")
    Page<MatchingRequest> findAcceptedMatchHistory(
            @Param("userId") Long userId, Pageable pageable);

    /**
     * PENDING 상태 요청 수 조회 (받은 요청)
     */
    long countByToUserIdAndStatus(Long toUserId, MatchingStatus status);

    /**
     * 두 사용자 간 매칭 요청 존재 여부 확인 (방향 무관)
     */
    @Query("SELECT COUNT(mr) > 0 FROM MatchingRequest mr " +
           "WHERE ((mr.fromUser.id = :userId1 AND mr.toUser.id = :userId2) " +
           "    OR (mr.fromUser.id = :userId2 AND mr.toUser.id = :userId1)) " +
           "AND mr.status IN ('PENDING', 'ACCEPTED')")
    boolean existsActiveRequestBetween(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2);
}
