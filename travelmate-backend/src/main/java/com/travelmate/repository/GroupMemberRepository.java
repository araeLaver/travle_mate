package com.travelmate.repository;

import com.travelmate.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    
    boolean existsByTravelGroupIdAndUserId(Long travelGroupId, Long userId);
    
    Optional<GroupMember> findByTravelGroupIdAndUserId(Long travelGroupId, Long userId);
    
    @Query("SELECT COUNT(gm) FROM GroupMember gm WHERE gm.travelGroup.id = :groupId AND gm.status = 'ACCEPTED'")
    Long countAcceptedMembersByGroupId(@Param("groupId") Long groupId);
    
    void deleteByTravelGroupIdAndUserId(Long travelGroupId, Long userId);
}