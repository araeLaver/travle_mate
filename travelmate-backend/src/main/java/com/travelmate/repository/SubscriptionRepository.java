package com.travelmate.repository;

import com.travelmate.entity.Subscription;
import com.travelmate.entity.Subscription.SubscriptionStatus;
import com.travelmate.entity.Subscription.SubscriptionTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 구독 레포지토리
 */
@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUserId(Long userId);

    Optional<Subscription> findByUserIdAndStatus(Long userId, SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s WHERE s.user.id = :userId AND s.status = 'ACTIVE' " +
           "AND s.endDate > CURRENT_TIMESTAMP")
    Optional<Subscription> findActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.autoRenew = true " +
           "AND s.nextBillingDate <= :targetDate")
    List<Subscription> findSubscriptionsToRenew(@Param("targetDate") LocalDateTime targetDate);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate <= :targetDate")
    List<Subscription> findExpiredSubscriptions(@Param("targetDate") LocalDateTime targetDate);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'CANCELLED' AND s.endDate <= :targetDate")
    List<Subscription> findCancelledToExpire(@Param("targetDate") LocalDateTime targetDate);

    long countByStatus(SubscriptionStatus status);

    long countByTier(SubscriptionTier tier);

    @Query("SELECT s.tier, COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' GROUP BY s.tier")
    List<Object[]> countActiveByTier();

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' " +
           "AND s.createdAt >= :startDate")
    long countNewSubscriptionsAfter(@Param("startDate") LocalDateTime startDate);
}
