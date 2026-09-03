package com.travelmate.repository;

import com.travelmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);

    Optional<User> findByProviderAndProviderId(User.AuthProvider provider, String providerId);
    
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

    @Query("SELECT u FROM User u WHERE u.isMatchingEnabled = true AND u.isActive = true " +
           "AND u.id NOT IN :excludeIds " +
           "ORDER BY u.lastActivityAt DESC NULLS LAST")
    List<User> findMatchingCandidates(@Param("excludeIds") List<Long> excludeIds, Pageable pageable);

    // Admin Dashboard methods
    long countByCreatedAtAfter(LocalDateTime dateTime);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(u) FROM User u WHERE u.lastActivityAt >= :since")
    long countActiveUsersSince(@Param("since") LocalDateTime since);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR u.email LIKE %:search% OR u.nickname LIKE %:search%) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive)")
    Page<User> findUsersForAdmin(
            @Param("search") String search,
            @Param("role") String role,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}
