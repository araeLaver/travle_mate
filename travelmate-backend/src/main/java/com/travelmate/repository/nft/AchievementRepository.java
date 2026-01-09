package com.travelmate.repository.nft;

import com.travelmate.entity.nft.Achievement;
import com.travelmate.entity.nft.AchievementType;
import com.travelmate.entity.nft.Rarity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    /**
     * 코드로 업적 조회
     */
    Optional<Achievement> findByCode(String code);

    /**
     * 활성화된 업적 목록 조회
     */
    List<Achievement> findByIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * 타입별 업적 조회
     */
    List<Achievement> findByTypeAndIsActiveTrueOrderByDisplayOrderAsc(AchievementType type);

    /**
     * 희귀도별 업적 조회
     */
    List<Achievement> findByRarityAndIsActiveTrueOrderByDisplayOrderAsc(Rarity rarity);

    /**
     * 배지 NFT 발행 업적만 조회
     */
    List<Achievement> findByGrantsBadgeNftTrueAndIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * 코드 존재 여부 확인
     */
    boolean existsByCode(String code);
}
