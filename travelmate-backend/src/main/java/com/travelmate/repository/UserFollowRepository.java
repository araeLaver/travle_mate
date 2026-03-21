package com.travelmate.repository;

import com.travelmate.entity.UserFollow;
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
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    /**
     * 특정 사용자가 팔로우하는 사람들 조회 (팔로잉 목록)
     */
    @Query("SELECT uf FROM UserFollow uf " +
            "JOIN FETCH uf.following " +
            "WHERE uf.follower.id = :followerId " +
            "ORDER BY uf.createdAt DESC")
    Page<UserFollow> findByFollowerId(@Param("followerId") Long followerId, Pageable pageable);

    /**
     * 특정 사용자를 팔로우하는 사람들 조회 (팔로워 목록)
     */
    @Query("SELECT uf FROM UserFollow uf " +
            "JOIN FETCH uf.follower " +
            "WHERE uf.following.id = :followingId " +
            "ORDER BY uf.createdAt DESC")
    Page<UserFollow> findByFollowingId(@Param("followingId") Long followingId, Pageable pageable);

    /**
     * 팔로우 관계 존재 여부 확인
     */
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    /**
     * 팔로우 관계 조회
     */
    Optional<UserFollow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    /**
     * 팔로잉 수 (내가 팔로우하는 사람 수)
     */
    long countByFollowerId(Long followerId);

    /**
     * 팔로워 수 (나를 팔로우하는 사람 수)
     */
    long countByFollowingId(Long followingId);

    /**
     * 팔로우 삭제 (언팔로우)
     */
    @Modifying
    @Query("DELETE FROM UserFollow uf WHERE uf.follower.id = :followerId AND uf.following.id = :followingId")
    int deleteByFollowerIdAndFollowingId(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    /**
     * 맞팔로우 여부 확인 (서로 팔로우)
     */
    @Query("SELECT COUNT(uf) = 2 FROM UserFollow uf " +
            "WHERE (uf.follower.id = :userId1 AND uf.following.id = :userId2) " +
            "   OR (uf.follower.id = :userId2 AND uf.following.id = :userId1)")
    boolean isMutualFollow(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * 특정 사용자들 중 내가 팔로우하는 사람 ID 목록 (배치 조회)
     */
    @Query("SELECT uf.following.id FROM UserFollow uf " +
            "WHERE uf.follower.id = :followerId " +
            "AND uf.following.id IN :userIds")
    List<Long> findFollowingIdsInUserIds(@Param("followerId") Long followerId, @Param("userIds") List<Long> userIds);

    /**
     * 공통 팔로워 조회 (두 사용자가 공통으로 팔로우하는 사람)
     */
    @Query("SELECT uf1.following.id FROM UserFollow uf1 " +
            "INNER JOIN UserFollow uf2 ON uf1.following.id = uf2.following.id " +
            "WHERE uf1.follower.id = :userId1 AND uf2.follower.id = :userId2")
    List<Long> findCommonFollowingIds(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * 맞팔로우 사용자 목록 조회
     */
    @Query("SELECT uf1.following FROM UserFollow uf1 " +
            "INNER JOIN UserFollow uf2 ON uf1.following.id = uf2.follower.id " +
            "WHERE uf1.follower.id = :userId AND uf2.following.id = :userId " +
            "ORDER BY uf1.createdAt DESC")
    Page<com.travelmate.entity.User> findMutualFollowers(@Param("userId") Long userId, Pageable pageable);

    /**
     * 사용자 탈퇴 시 모든 팔로우 관계 삭제
     */
    @Modifying
    @Query("DELETE FROM UserFollow uf WHERE uf.follower.id = :userId OR uf.following.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
