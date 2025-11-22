package com.travelmate.repository;

import com.travelmate.entity.LoginHistory;
import com.travelmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    
    Page<LoginHistory> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    List<LoginHistory> findByUserAndStatusOrderByCreatedAtDesc(User user, LoginHistory.LoginStatus status);
    
    @Query("SELECT lh FROM LoginHistory lh WHERE lh.user = :user AND lh.createdAt > :since")
    List<LoginHistory> findRecentLoginsByUser(@Param("user") User user, @Param("since") LocalDateTime since);
    
    @Query("SELECT lh FROM LoginHistory lh WHERE lh.status = :status AND lh.createdAt > :since")
    List<LoginHistory> findRecentLoginsByStatus(@Param("status") LoginHistory.LoginStatus status, 
                                               @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(lh) FROM LoginHistory lh WHERE lh.user = :user AND lh.status = 'SUCCESS' AND lh.createdAt > :since")
    long countSuccessfulLoginsSince(@Param("user") User user, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(lh) FROM LoginHistory lh WHERE lh.ipAddress = :ipAddress AND lh.status = 'FAILED' AND lh.createdAt > :since")
    long countFailedLoginsByIpSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);
}