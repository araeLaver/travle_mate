package com.travelmate.repository.nft;

import com.travelmate.entity.nft.PointSource;
import com.travelmate.entity.nft.PointTransaction;
import com.travelmate.entity.nft.PointTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {

    /**
     * 사용자의 거래 내역 조회
     */
    Page<PointTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * 사용자의 거래 내역 조회 (타입별)
     */
    Page<PointTransaction> findByUserIdAndTypeOrderByCreatedAtDesc(
            Long userId, PointTransactionType type, Pageable pageable);

    /**
     * 사용자의 거래 내역 조회 (출처별)
     */
    Page<PointTransaction> findByUserIdAndSourceOrderByCreatedAtDesc(
            Long userId, PointSource source, Pageable pageable);

    /**
     * 기간별 거래 내역 조회
     */
    @Query("SELECT pt FROM PointTransaction pt WHERE pt.user.id = :userId " +
           "AND pt.createdAt BETWEEN :startDate AND :endDate ORDER BY pt.createdAt DESC")
    List<PointTransaction> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * 사용자의 총 획득 포인트 조회
     */
    @Query("SELECT COALESCE(SUM(pt.amount), 0) FROM PointTransaction pt " +
           "WHERE pt.user.id = :userId AND pt.type = 'EARN'")
    Long getTotalEarnedByUserId(@Param("userId") Long userId);

    /**
     * 사용자의 총 사용 포인트 조회
     */
    @Query("SELECT COALESCE(SUM(pt.amount), 0) FROM PointTransaction pt " +
           "WHERE pt.user.id = :userId AND pt.type = 'SPEND'")
    Long getTotalSpentByUserId(@Param("userId") Long userId);

    /**
     * 출처별 통계 조회
     */
    @Query("SELECT pt.source, SUM(pt.amount) FROM PointTransaction pt " +
           "WHERE pt.user.id = :userId AND pt.type = 'EARN' GROUP BY pt.source")
    List<Object[]> getEarnedBySource(@Param("userId") Long userId);

    /**
     * 참조 ID와 타입으로 조회 (중복 방지용)
     */
    boolean existsByUserIdAndReferenceIdAndReferenceType(
            Long userId, Long referenceId, String referenceType);

    /**
     * 최근 거래 내역 조회
     */
    List<PointTransaction> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}
