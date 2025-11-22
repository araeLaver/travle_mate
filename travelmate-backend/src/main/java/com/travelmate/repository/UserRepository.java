package com.travelmate.repository;

import com.travelmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    boolean existsByNickname(String nickname);
    
    @Query("SELECT u FROM User u WHERE u.isLocationEnabled = true AND u.isMatchingEnabled = true " +
           "AND u.currentLatitude IS NOT NULL AND u.currentLongitude IS NOT NULL " +
           "AND u.id != :userId " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude)))) <= :radiusKm")
    List<User> findNearbyUsers(@Param("userId") Long userId, 
                              @Param("latitude") Double latitude, 
                              @Param("longitude") Double longitude, 
                              @Param("radiusKm") Double radiusKm);
    
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.isLocationEnabled = true " +
           "AND u.currentLatitude IS NOT NULL AND u.currentLongitude IS NOT NULL " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude)))) <= :radiusKm " +
           "ORDER BY (6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude))))")
    List<User> findUsersForShake(@Param("latitude") Double latitude,
                                @Param("longitude") Double longitude,
                                @Param("radiusKm") Double radiusKm);
}