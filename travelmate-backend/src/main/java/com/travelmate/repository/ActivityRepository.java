package com.travelmate.repository;

import com.travelmate.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    /**
     * 특정 사용자의 활동 목록 조회
     */
    @Query("SELECT a FROM Activity a " +
            "JOIN FETCH a.actor " +
            "WHERE a.actor.id = :userId " +
            "ORDER BY a.createdAt DESC")
    Page<Activity> findByActorId(@Param("userId") Long userId, Pageable pageable);

    /**
     * 특정 사용자의 공개 활동 목록 조회
     */
    @Query("SELECT a FROM Activity a " +
            "JOIN FETCH a.actor " +
            "WHERE a.actor.id = :userId AND a.isPublic = true " +
            "ORDER BY a.createdAt DESC")
    Page<Activity> findPublicByActorId(@Param("userId") Long userId, Pageable pageable);

    /**
     * 팔로잉 사용자들의 활동 피드 조회 (타임라인)
     */
    @Query("SELECT a FROM Activity a " +
            "JOIN FETCH a.actor " +
            "WHERE a.actor.id IN :followingIds AND a.isPublic = true " +
            "ORDER BY a.createdAt DESC")
    Page<Activity> findFollowingActivities(@Param("followingIds") List<Long> followingIds, Pageable pageable);

    /**
     * 타임라인 피드 (팔로잉 + 본인 활동)
     */
    @Query("SELECT a FROM Activity a " +
            "JOIN FETCH a.actor " +
            "WHERE (a.actor.id = :userId OR (a.actor.id IN :followingIds AND a.isPublic = true)) " +
            "ORDER BY a.createdAt DESC")
    Page<Activity> findTimelineFeed(@Param("userId") Long userId,
                                    @Param("followingIds") List<Long> followingIds,
                                    Pageable pageable);

    /**
     * 특정 타입의 활동 조회
     */
    @Query("SELECT a FROM Activity a " +
            "JOIN FETCH a.actor " +
            "WHERE a.type = :type AND a.isPublic = true " +
            "ORDER BY a.createdAt DESC")
    Page<Activity> findByType(@Param("type") Activity.ActivityType type, Pageable pageable);

    /**
     * 특정 대상에 대한 활동 조회
     */
    @Query("SELECT a FROM Activity a " +
            "JOIN FETCH a.actor " +
            "WHERE a.targetType = :targetType AND a.targetId = :targetId " +
            "ORDER BY a.createdAt DESC")
    List<Activity> findByTarget(@Param("targetType") String targetType, @Param("targetId") Long targetId);

    /**
     * 전체 공개 피드 (탐색 피드)
     */
    @Query("SELECT a FROM Activity a " +
            "JOIN FETCH a.actor " +
            "WHERE a.isPublic = true " +
            "ORDER BY a.createdAt DESC")
    Page<Activity> findPublicFeed(Pageable pageable);

    /**
     * 인기 활동 조회 (최근 활동 중 특정 타입)
     */
    @Query("SELECT a FROM Activity a " +
            "JOIN FETCH a.actor " +
            "WHERE a.isPublic = true AND a.createdAt >= :since " +
            "AND a.type IN :types " +
            "ORDER BY a.createdAt DESC")
    Page<Activity> findPopularActivities(@Param("since") LocalDateTime since,
                                         @Param("types") List<Activity.ActivityType> types,
                                         Pageable pageable);

    /**
     * 특정 사용자의 특정 타입 활동 조회
     */
    @Query("SELECT a FROM Activity a " +
            "WHERE a.actor.id = :userId AND a.type = :type " +
            "ORDER BY a.createdAt DESC")
    Page<Activity> findByActorIdAndType(@Param("userId") Long userId,
                                        @Param("type") Activity.ActivityType type,
                                        Pageable pageable);

    /**
     * 중복 활동 체크 (같은 사용자가 같은 대상에 같은 활동)
     */
    @Query("SELECT COUNT(a) > 0 FROM Activity a " +
            "WHERE a.actor.id = :actorId AND a.type = :type " +
            "AND a.targetType = :targetType AND a.targetId = :targetId")
    boolean existsByActorAndTypeAndTarget(@Param("actorId") Long actorId,
                                          @Param("type") Activity.ActivityType type,
                                          @Param("targetType") String targetType,
                                          @Param("targetId") Long targetId);

    /**
     * 오래된 활동 삭제 (정리용)
     */
    @Query("DELETE FROM Activity a WHERE a.createdAt < :beforeDate")
    void deleteOldActivities(@Param("beforeDate") LocalDateTime beforeDate);

    /**
     * 사용자의 활동 통계
     */
    @Query("SELECT a.type, COUNT(a) FROM Activity a " +
            "WHERE a.actor.id = :userId " +
            "GROUP BY a.type")
    List<Object[]> getActivityStatsByUser(@Param("userId") Long userId);

    /**
     * 최근 N일간 활동 수
     */
    @Query("SELECT COUNT(a) FROM Activity a " +
            "WHERE a.actor.id = :userId AND a.createdAt >= :since")
    long countRecentActivities(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
