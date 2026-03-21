package com.travelmate.repository;

import com.travelmate.entity.ItineraryComment;
import com.travelmate.entity.TravelItinerary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryCommentRepository extends JpaRepository<ItineraryComment, Long> {

    // 일정의 최상위 댓글 조회 (대댓글 제외)
    @Query("SELECT c FROM ItineraryComment c WHERE c.itinerary.id = :itineraryId AND c.parent IS NULL ORDER BY c.createdAt DESC")
    Page<ItineraryComment> findTopLevelCommentsByItineraryId(@Param("itineraryId") Long itineraryId, Pageable pageable);

    // 일정의 모든 댓글 조회
    @Query("SELECT c FROM ItineraryComment c WHERE c.itinerary.id = :itineraryId ORDER BY c.createdAt DESC")
    List<ItineraryComment> findByItineraryId(@Param("itineraryId") Long itineraryId);

    // 특정 댓글의 대댓글 조회
    @Query("SELECT c FROM ItineraryComment c WHERE c.parent.id = :parentId ORDER BY c.createdAt ASC")
    List<ItineraryComment> findRepliesByParentId(@Param("parentId") Long parentId);

    // 일정의 댓글 수 조회
    @Query("SELECT COUNT(c) FROM ItineraryComment c WHERE c.itinerary.id = :itineraryId AND c.isDeleted = false")
    Long countByItineraryId(@Param("itineraryId") Long itineraryId);

    // 사용자의 댓글 조회
    @Query("SELECT c FROM ItineraryComment c WHERE c.author.id = :userId ORDER BY c.createdAt DESC")
    Page<ItineraryComment> findByAuthorId(@Param("userId") Long userId, Pageable pageable);

    // 일정 삭제 시 모든 댓글 삭제
    void deleteByItinerary(TravelItinerary itinerary);

    // 삭제되지 않은 최상위 댓글 조회
    @Query("SELECT c FROM ItineraryComment c WHERE c.itinerary.id = :itineraryId AND c.parent IS NULL AND c.isDeleted = false ORDER BY c.createdAt DESC")
    Page<ItineraryComment> findActiveTopLevelCommentsByItineraryId(@Param("itineraryId") Long itineraryId, Pageable pageable);
}
