package com.travelmate.repository;

import com.travelmate.entity.ItineraryCollaborator;
import com.travelmate.entity.ItineraryCollaborator.CollaboratorRole;
import com.travelmate.entity.ItineraryCollaborator.InviteStatus;
import com.travelmate.entity.TravelItinerary;
import com.travelmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItineraryCollaboratorRepository extends JpaRepository<ItineraryCollaborator, Long> {

    // 일정의 협업자 목록
    List<ItineraryCollaborator> findByItinerary(TravelItinerary itinerary);

    // 수락된 협업자만
    List<ItineraryCollaborator> findByItineraryAndStatus(TravelItinerary itinerary, InviteStatus status);

    // 특정 사용자의 협업 정보 조회
    Optional<ItineraryCollaborator> findByItineraryAndUser(TravelItinerary itinerary, User user);

    // 사용자의 대기 중인 초대 조회
    List<ItineraryCollaborator> findByUserAndStatus(User user, InviteStatus status);

    // 협업자인지 확인
    boolean existsByItineraryAndUserAndStatus(TravelItinerary itinerary, User user, InviteStatus status);

    // 편집 권한이 있는지 확인
    @Query("SELECT COUNT(ic) > 0 FROM ItineraryCollaborator ic " +
            "WHERE ic.itinerary = :itinerary AND ic.user = :user " +
            "AND ic.status = 'ACCEPTED' AND ic.role IN ('EDITOR', 'ADMIN')")
    boolean hasEditPermission(@Param("itinerary") TravelItinerary itinerary, @Param("user") User user);

    // 관리자 권한이 있는지 확인
    @Query("SELECT COUNT(ic) > 0 FROM ItineraryCollaborator ic " +
            "WHERE ic.itinerary = :itinerary AND ic.user = :user " +
            "AND ic.status = 'ACCEPTED' AND ic.role = 'ADMIN'")
    boolean hasAdminPermission(@Param("itinerary") TravelItinerary itinerary, @Param("user") User user);

    // 일정에서 협업자 삭제
    void deleteByItineraryAndUser(TravelItinerary itinerary, User user);

    // 일정의 모든 협업자 삭제
    void deleteByItinerary(TravelItinerary itinerary);

    // 특정 역할의 협업자 수
    long countByItineraryAndRole(TravelItinerary itinerary, CollaboratorRole role);
}
