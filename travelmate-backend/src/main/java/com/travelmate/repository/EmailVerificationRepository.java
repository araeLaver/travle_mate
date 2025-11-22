package com.travelmate.repository;

import com.travelmate.entity.EmailVerification;
import com.travelmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    
    Optional<EmailVerification> findByToken(String token);
    
    Optional<EmailVerification> findByUserAndTypeAndIsVerifiedFalse(User user, EmailVerification.VerificationType type);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerification ev WHERE ev.expiresAt < :now")
    void deleteExpiredVerifications(@Param("now") LocalDateTime now);
    
    @Query("SELECT COUNT(ev) FROM EmailVerification ev WHERE ev.user = :user AND ev.type = :type AND ev.createdAt > :since")
    int countRecentVerificationsByUserAndType(@Param("user") User user, 
                                            @Param("type") EmailVerification.VerificationType type,
                                            @Param("since") LocalDateTime since);
}