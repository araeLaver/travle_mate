package com.travelmate.repository;

import com.travelmate.entity.UserTrustScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserTrustScoreRepository extends JpaRepository<UserTrustScore, Long> {

    Optional<UserTrustScore> findByUserId(Long userId);
}
