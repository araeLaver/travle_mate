package com.travelmate.repository.nft;

import com.travelmate.entity.nft.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    /**
     * 사용자의 모든 업적 조회
     */
    List<UserAchievement> findByUserId(Long userId);

    /**
     * 사용자의 완료된 업적 조회
     */
    List<UserAchievement> findByUserIdAndIsCompletedTrue(Long userId);

    /**
     * 사용자의 진행 중인 업적 조회
     */
    List<UserAchievement> findByUserIdAndIsCompletedFalse(Long userId);

    /**
     * 사용자의 특정 업적 조회
     */
    Optional<UserAchievement> findByUserIdAndAchievementId(Long userId, Long achievementId);

    /**
     * 사용자의 특정 업적 코드로 조회
     */
    @Query("SELECT ua FROM UserAchievement ua WHERE ua.user.id = :userId " +
           "AND ua.achievement.code = :code")
    Optional<UserAchievement> findByUserIdAndAchievementCode(
            @Param("userId") Long userId,
            @Param("code") String code);

    /**
     * 사용자가 특정 업적을 가지고 있는지 확인
     */
    boolean existsByUserIdAndAchievementId(Long userId, Long achievementId);

    /**
     * 사용자의 완료된 업적 수
     */
    int countByUserIdAndIsCompletedTrue(Long userId);

    /**
     * 사용자의 총 업적 수
     */
    int countByUserId(Long userId);

    /**
     * 최근 완료된 업적 조회
     */
    @Query("SELECT ua FROM UserAchievement ua WHERE ua.user.id = :userId " +
           "AND ua.isCompleted = true ORDER BY ua.completedAt DESC")
    List<UserAchievement> findRecentlyCompletedByUserId(@Param("userId") Long userId);

    /**
     * 사용자의 모든 업적을 Achievement와 함께 로드 (N+1 방지)
     */
    @Query("SELECT ua FROM UserAchievement ua " +
           "LEFT JOIN FETCH ua.achievement " +
           "WHERE ua.user.id = :userId")
    List<UserAchievement> findByUserIdWithAchievement(@Param("userId") Long userId);

    /**
     * 사용자의 여러 업적을 한 번에 조회 (배치 조회)
     */
    @Query("SELECT ua FROM UserAchievement ua " +
           "LEFT JOIN FETCH ua.achievement " +
           "WHERE ua.user.id = :userId AND ua.achievement.id IN :achievementIds")
    List<UserAchievement> findByUserIdAndAchievementIds(
            @Param("userId") Long userId,
            @Param("achievementIds") List<Long> achievementIds);
}
