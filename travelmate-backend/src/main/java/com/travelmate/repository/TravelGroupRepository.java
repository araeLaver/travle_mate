package com.travelmate.repository;

import com.travelmate.entity.TravelGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TravelGroupRepository extends JpaRepository<TravelGroup, Long> {
    
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