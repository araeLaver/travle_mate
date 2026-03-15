package com.travelmate.repository;

import com.travelmate.entity.BetaConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BetaConfigRepository extends JpaRepository<BetaConfig, String> {
}
