package com.travelmate.repository.nft;

import com.travelmate.entity.nft.CollectionSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectionSetRepository extends JpaRepository<CollectionSet, Long> {
    List<CollectionSet> findByIsActiveTrue();

    @Query("SELECT cs FROM CollectionSet cs WHERE cs.isActive = true AND cs.region = :region")
    List<CollectionSet> findActiveByRegion(String region);

    @Query("SELECT cs FROM CollectionSet cs WHERE cs.isActive = true " +
           "AND (cs.isLimitedTime = false OR (cs.startAt <= CURRENT_TIMESTAMP AND cs.endAt >= CURRENT_TIMESTAMP))")
    List<CollectionSet> findAvailableSets();
}
