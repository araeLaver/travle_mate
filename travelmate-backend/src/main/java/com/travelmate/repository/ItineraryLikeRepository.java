package com.travelmate.repository;

import com.travelmate.entity.ItineraryLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItineraryLikeRepository extends JpaRepository<ItineraryLike, Long> {

    boolean existsByItineraryIdAndUserId(Long itineraryId, Long userId);

    Optional<ItineraryLike> findByItineraryIdAndUserId(Long itineraryId, Long userId);

    Long countByItineraryId(Long itineraryId);

    void deleteByItineraryIdAndUserId(Long itineraryId, Long userId);

    void deleteByItineraryId(Long itineraryId);

    @Query("SELECT il.itinerary.id FROM ItineraryLike il WHERE il.user.id = :userId")
    List<Long> findLikedItineraryIdsByUserId(@Param("userId") Long userId);
}
