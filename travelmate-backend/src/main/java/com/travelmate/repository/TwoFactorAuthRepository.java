package com.travelmate.repository;

import com.travelmate.entity.TwoFactorAuth;
import com.travelmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TwoFactorAuthRepository extends JpaRepository<TwoFactorAuth, Long> {
    
    Optional<TwoFactorAuth> findByUser(User user);
    
    boolean existsByUserAndIsEnabledTrue(User user);
}