package com.travelmate.repository.nft;

import com.travelmate.entity.nft.UserPoint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPointRepository extends JpaRepository<UserPoint, Long> {

    /**
     * 사용자 ID로 포인트 정보 조회
     */
    Optional<UserPoint> findByUserId(Long userId);

    /**
     * 사용자 ID로 포인트 정보 조회 (없으면 생성)
     */
    default UserPoint findOrCreateByUserId(Long userId, com.travelmate.entity.User user) {
        return findByUserId(userId).orElseGet(() -> {
            UserPoint newPoint = UserPoint.builder()
                    .user(user)
                    .totalPoints(0L)
                    .lifetimeEarned(0L)
                    .lifetimeSpent(0L)
                    .seasonPoints(0L)
                    .build();
            return save(newPoint);
        });
    }

    /**
     * 전체 랭킹 조회 (포인트 기준)
     */
    @Query("SELECT up FROM UserPoint up ORDER BY up.totalPoints DESC")
    List<UserPoint> findTopByTotalPoints(Pageable pageable);

    /**
     * 시즌 랭킹 조회
     */
    @Query("SELECT up FROM UserPoint up ORDER BY up.seasonPoints DESC")
    List<UserPoint> findTopBySeasonPoints(Pageable pageable);

    /**
     * 랭킹 업데이트
     */
    @Modifying
    @Query(value = """
        UPDATE user_points up
        SET current_rank = (
            SELECT ranking FROM (
                SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as ranking
                FROM user_points
            ) r WHERE r.user_id = up.user_id
        )
        """, nativeQuery = true)
    void updateAllRanks();

    /**
     * 사용자의 현재 랭킹 조회
     */
    @Query(value = """
        SELECT COUNT(*) + 1 FROM user_points
        WHERE total_points > (SELECT total_points FROM user_points WHERE user_id = :userId)
        """, nativeQuery = true)
    int getUserRank(@Param("userId") Long userId);

    /**
     * 시즌 리셋
     */
    @Modifying
    @Query("UPDATE UserPoint up SET up.seasonPoints = 0, up.currentRank = null")
    void resetAllSeasonPoints();

    /**
     * 총 포인트 합계 조회
     */
    @Query("SELECT SUM(up.totalPoints) FROM UserPoint up")
    Long getTotalPointsInSystem();
}
