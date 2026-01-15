package com.travelmate.repository;

import com.travelmate.entity.UserBlock;
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
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    /**
     * 차단 관계 존재 여부 확인
     */
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    /**
     * 차단 관계 조회
     */
    Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    /**
     * 내가 차단한 사용자 목록 조회
     */
    @Query("SELECT ub FROM UserBlock ub " +
            "JOIN FETCH ub.blocked " +
            "WHERE ub.blocker.id = :blockerId " +
            "ORDER BY ub.createdAt DESC")
    Page<UserBlock> findByBlockerId(@Param("blockerId") Long blockerId, Pageable pageable);

    /**
     * 나를 차단한 사용자 목록 조회 (관리자용)
     */
    @Query("SELECT ub FROM UserBlock ub " +
            "JOIN FETCH ub.blocker " +
            "WHERE ub.blocked.id = :blockedId " +
            "ORDER BY ub.createdAt DESC")
    Page<UserBlock> findByBlockedId(@Param("blockedId") Long blockedId, Pageable pageable);

    /**
     * 차단 삭제 (차단 해제)
     */
    @Modifying
    @Query("DELETE FROM UserBlock ub WHERE ub.blocker.id = :blockerId AND ub.blocked.id = :blockedId")
    int deleteByBlockerIdAndBlockedId(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId);

    /**
     * 내가 차단한 사용자 ID 목록
     */
    @Query("SELECT ub.blocked.id FROM UserBlock ub WHERE ub.blocker.id = :blockerId")
    List<Long> findBlockedUserIds(@Param("blockerId") Long blockerId);

    /**
     * 나를 차단한 사용자 ID 목록
     */
    @Query("SELECT ub.blocker.id FROM UserBlock ub WHERE ub.blocked.id = :blockedId")
    List<Long> findBlockerUserIds(@Param("blockedId") Long blockedId);

    /**
     * 양방향 차단 관계 확인 (둘 중 하나라도 차단 중인지)
     */
    @Query("SELECT COUNT(ub) > 0 FROM UserBlock ub " +
            "WHERE (ub.blocker.id = :userId1 AND ub.blocked.id = :userId2) " +
            "   OR (ub.blocker.id = :userId2 AND ub.blocked.id = :userId1)")
    boolean isBlockedEitherWay(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * 차단 수
     */
    long countByBlockerId(Long blockerId);

    /**
     * 특정 사용자들 중 내가 차단한 사용자 ID 목록 (배치 조회)
     */
    @Query("SELECT ub.blocked.id FROM UserBlock ub " +
            "WHERE ub.blocker.id = :blockerId " +
            "AND ub.blocked.id IN :userIds")
    List<Long> findBlockedUserIdsInUserIds(@Param("blockerId") Long blockerId, @Param("userIds") List<Long> userIds);

    /**
     * 사용자 탈퇴 시 모든 차단 관계 삭제
     */
    @Modifying
    @Query("DELETE FROM UserBlock ub WHERE ub.blocker.id = :userId OR ub.blocked.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
