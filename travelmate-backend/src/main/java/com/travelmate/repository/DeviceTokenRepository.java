package com.travelmate.repository;

import com.travelmate.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    /**
     * Find device token by token string
     */
    Optional<DeviceToken> findByToken(String token);

    /**
     * Find all active tokens for a user
     */
    List<DeviceToken> findByUserIdAndActiveTrue(Long userId);

    /**
     * Find all active tokens for multiple users
     */
    @Query("SELECT dt FROM DeviceToken dt WHERE dt.user.id IN :userIds AND dt.active = true")
    List<DeviceToken> findByUserIdsAndActiveTrue(@Param("userIds") List<Long> userIds);

    /**
     * Check if token exists
     */
    boolean existsByToken(String token);

    /**
     * Deactivate all tokens for a user
     */
    @Modifying
    @Query("UPDATE DeviceToken dt SET dt.active = false WHERE dt.user.id = :userId")
    void deactivateAllByUserId(@Param("userId") Long userId);

    /**
     * Deactivate specific token
     */
    @Modifying
    @Query("UPDATE DeviceToken dt SET dt.active = false WHERE dt.token = :token")
    void deactivateByToken(@Param("token") String token);

    /**
     * Delete inactive tokens older than specified date
     */
    @Modifying
    @Query("DELETE FROM DeviceToken dt WHERE dt.active = false AND dt.updatedAt < :before")
    int deleteInactiveTokensBefore(@Param("before") LocalDateTime before);

    /**
     * Count active tokens for a user
     */
    int countByUserIdAndActiveTrue(Long userId);

    /**
     * Find tokens not used since specified date
     */
    @Query("SELECT dt FROM DeviceToken dt WHERE dt.active = true AND dt.lastUsedAt < :since")
    List<DeviceToken> findInactiveTokensSince(@Param("since") LocalDateTime since);
}
