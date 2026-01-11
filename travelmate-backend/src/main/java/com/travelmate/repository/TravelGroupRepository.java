package com.travelmate.repository;

import com.travelmate.entity.TravelGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TravelGroupRepository extends JpaRepository<TravelGroup, Long> {

    /**
     * ID로 그룹 조회 - creator와 members.user를 함께 로드하여 N+1 방지
     */
    @EntityGraph(attributePaths = {"creator", "members", "members.user"})
    Optional<TravelGroup> findById(Long id);

    /**
     * ID로 그룹 조회 - 멤버 포함
     */
    @Query("SELECT DISTINCT tg FROM TravelGroup tg " +
           "LEFT JOIN FETCH tg.creator " +
           "LEFT JOIN FETCH tg.members m " +
           "LEFT JOIN FETCH m.user " +
           "WHERE tg.id = :id")
    Optional<TravelGroup> findByIdWithMembers(@Param("id") Long id);
    
    @Query("SELECT tg FROM TravelGroup tg WHERE tg.status = 'RECRUITING' AND " +
           "(:purpose IS NULL OR tg.purpose = :purpose) AND " +
           "(:latitude IS NULL OR :longitude IS NULL OR " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(tg.meetingLatitude)) * " +
           "cos(radians(tg.meetingLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(tg.meetingLatitude)))) <= :radiusKm) " +
           "ORDER BY tg.createdAt DESC")
    List<TravelGroup> findAvailableGroups(@Param("purpose") TravelGroup.Purpose purpose,
                                         @Param("latitude") Double latitude,
                                         @Param("longitude") Double longitude,
                                         @Param("radiusKm") Double radiusKm);
    
    @Query("SELECT tg FROM TravelGroup tg JOIN tg.members gm WHERE gm.user.id = :userId " +
           "AND gm.status = 'ACCEPTED' ORDER BY tg.createdAt DESC")
    List<TravelGroup> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT tg FROM TravelGroup tg WHERE tg.creator.id = :userId ORDER BY tg.createdAt DESC")
    List<TravelGroup> findByCreatorId(@Param("userId") Long userId);
    
    List<TravelGroup> findByStatus(TravelGroup.Status status);
}