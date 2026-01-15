package com.travelmate.repository;

import com.travelmate.entity.ItineraryItem;
import com.travelmate.entity.TravelItinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, Long> {

    // 일정별 아이템 조회
    List<ItineraryItem> findByItineraryOrderByDayNumberAscOrderIndexAsc(TravelItinerary itinerary);

    // 특정 일차의 아이템 조회
    List<ItineraryItem> findByItineraryAndDayNumberOrderByOrderIndexAsc(TravelItinerary itinerary, Integer dayNumber);

    // 일정의 아이템 개수
    long countByItinerary(TravelItinerary itinerary);

    // 특정 일차의 마지막 순서 조회
    @Query("SELECT COALESCE(MAX(ii.orderIndex), 0) FROM ItineraryItem ii " +
            "WHERE ii.itinerary = :itinerary AND ii.dayNumber = :dayNumber")
    Integer findMaxOrderIndex(@Param("itinerary") TravelItinerary itinerary, @Param("dayNumber") Integer dayNumber);

    // 순서 재정렬 (특정 위치 이후 아이템들)
    @Modifying
    @Query("UPDATE ItineraryItem ii SET ii.orderIndex = ii.orderIndex + 1 " +
            "WHERE ii.itinerary = :itinerary AND ii.dayNumber = :dayNumber AND ii.orderIndex >= :orderIndex")
    void incrementOrderIndexesFrom(@Param("itinerary") TravelItinerary itinerary,
                                   @Param("dayNumber") Integer dayNumber,
                                   @Param("orderIndex") Integer orderIndex);

    // 일정의 모든 아이템 삭제
    void deleteByItinerary(TravelItinerary itinerary);

    // NFT 수집 장소와 연결된 아이템 조회
    List<ItineraryItem> findByLocationCollectionIdIsNotNull();

    // 타입별 아이템 조회
    List<ItineraryItem> findByItineraryAndType(TravelItinerary itinerary, ItineraryItem.ItemType type);
}
