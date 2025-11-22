package com.travelmate.repository;

import com.travelmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepositoryEnhanced extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    @EntityGraph(attributePaths = {"interests", "languages", "refreshTokens", "twoFactorAuth"})
    Optional<User> findWithDetailsById(Long id);
    
    @EntityGraph(attributePaths = {"interests", "languages"})
    Optional<User> findWithDetailsByEmail(String email);
    
    boolean existsByEmail(String email);
    
    boolean existsByNickname(String nickname);
    
    boolean existsByPhoneNumber(String phoneNumber);
    
    Optional<User> findByProviderAndProviderId(User.AuthProvider provider, String providerId);
    
    // Search and filtering
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.privacyProfileVisible = true AND (" +
           "LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.bio) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.privacyProfileVisible = true " +
           "AND u.travelStyle = :travelStyle")
    Page<User> findByTravelStyle(@Param("travelStyle") User.TravelStyle travelStyle, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.privacyProfileVisible = true AND " +
           "(:ageMin IS NULL OR u.age >= :ageMin) AND " +
           "(:ageMax IS NULL OR u.age <= :ageMax) AND " +
           "(:gender IS NULL OR u.gender = :gender) AND " +
           "(:travelStyle IS NULL OR u.travelStyle = :travelStyle)")
    Page<User> findByFilters(@Param("ageMin") Integer ageMin,
                           @Param("ageMax") Integer ageMax,
                           @Param("gender") User.Gender gender,
                           @Param("travelStyle") User.TravelStyle travelStyle,
                           Pageable pageable);
    
    // Location-based queries with improved security and performance
    @Query("SELECT u FROM User u WHERE u.isLocationEnabled = true AND u.isMatchingEnabled = true " +
           "AND u.currentLatitude IS NOT NULL AND u.currentLongitude IS NOT NULL " +
           "AND u.id != :userId AND u.isActive = true AND u.privacyLocationVisible = true " +
           "AND u.lastActivityAt > :recentActivity " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude)))) <= :radiusKm " +
           "ORDER BY (6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude))))")
    Page<User> findNearbyUsers(@Param("userId") Long userId, 
                              @Param("latitude") Double latitude, 
                              @Param("longitude") Double longitude, 
                              @Param("radiusKm") Double radiusKm,
                              @Param("recentActivity") LocalDateTime recentActivity,
                              Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.isLocationEnabled = true AND u.isMatchingEnabled = true " +
           "AND u.currentLatitude IS NOT NULL AND u.currentLongitude IS NOT NULL " +
           "AND u.id != :userId AND u.isActive = true AND u.privacyLocationVisible = true " +
           "AND u.lastActivityAt > :recentActivity " +
           "AND (:travelStyle IS NULL OR u.travelStyle = :travelStyle) " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude)))) <= :radiusKm " +
           "ORDER BY (6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude))))")
    Page<User> findNearbyUsersWithTravelStyle(@Param("userId") Long userId,
                                             @Param("latitude") Double latitude,
                                             @Param("longitude") Double longitude,
                                             @Param("radiusKm") Double radiusKm,
                                             @Param("travelStyle") User.TravelStyle travelStyle,
                                             @Param("recentActivity") LocalDateTime recentActivity,
                                             Pageable pageable);
    
    // Shake feature with additional security
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.isLocationEnabled = true " +
           "AND u.isMatchingEnabled = true AND u.privacyLocationVisible = true " +
           "AND u.currentLatitude IS NOT NULL AND u.currentLongitude IS NOT NULL " +
           "AND u.lastActivityAt > :recentActivity " +
           "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude)))) <= :radiusKm " +
           "ORDER BY u.rating DESC, " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(u.currentLatitude)) * " +
           "cos(radians(u.currentLongitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(u.currentLatitude))))")
    List<User> findUsersForShake(@Param("latitude") Double latitude,
                                @Param("longitude") Double longitude,
                                @Param("radiusKm") Double radiusKm,
                                @Param("recentActivity") LocalDateTime recentActivity);
    
    // Activity tracking
    @Query("SELECT u FROM User u WHERE u.lastActivityAt < :cutoff AND u.isActive = true")
    List<User> findInactiveUsers(@Param("cutoff") LocalDateTime cutoff);
    
    // Admin queries
    @Query("SELECT u FROM User u WHERE u.deletionRequestedAt IS NOT NULL AND u.deletionRequestedAt < :cutoff")
    List<User> findUsersScheduledForDeletion(@Param("cutoff") LocalDateTime cutoff);
    
    // Statistics
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.createdAt >= :since")
    long countNewUsersSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.isLocationEnabled = true AND u.isMatchingEnabled = true AND u.isActive = true")
    long countActiveMatchingUsers();
    
    // Security queries
    @Query("SELECT u FROM User u WHERE u.lockedUntil IS NOT NULL AND u.lockedUntil < :now")
    List<User> findUsersToUnlock(@Param("now") LocalDateTime now);
}