package com.travelmate.repository;

import com.travelmate.entity.BetaInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BetaInviteRepository extends JpaRepository<BetaInvite, Long> {

    Optional<BetaInvite> findByInviteCode(String inviteCode);

    Optional<BetaInvite> findByEmail(String email);

    List<BetaInvite> findByStatus(BetaInvite.InviteStatus status);

    @Query("SELECT COUNT(b) FROM BetaInvite b WHERE b.status = 'AVAILABLE'")
    long countAvailable();

    @Query("SELECT COUNT(b) FROM BetaInvite b WHERE b.status = 'USED'")
    long countUsed();

    boolean existsByInviteCode(String inviteCode);
}
