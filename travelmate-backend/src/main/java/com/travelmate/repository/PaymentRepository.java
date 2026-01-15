package com.travelmate.repository;

import com.travelmate.entity.Payment;
import com.travelmate.entity.Payment.PaymentStatus;
import com.travelmate.entity.Payment.ProductType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 결제 레포지토리
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(String orderId);

    Optional<Payment> findByPaymentKey(String paymentKey);

    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Payment> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Payment> findByUserIdAndStatus(Long userId, PaymentStatus status, Pageable pageable);

    Page<Payment> findByUserIdAndProductType(Long userId, ProductType productType, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.user.id = :userId AND p.status = :status " +
           "AND p.createdAt BETWEEN :startDate AND :endDate ORDER BY p.createdAt DESC")
    List<Payment> findByUserIdAndStatusAndDateRange(
            @Param("userId") Long userId,
            @Param("status") PaymentStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // 통계 쿼리
    @Query("SELECT COALESCE(SUM(p.finalAmount), 0) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal getTotalRevenue();

    @Query("SELECT COALESCE(SUM(p.finalAmount), 0) FROM Payment p " +
           "WHERE p.status = 'COMPLETED' AND p.paidAt >= :startDate")
    BigDecimal getRevenueAfter(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COALESCE(SUM(p.finalAmount), 0) FROM Payment p " +
           "WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startDate AND :endDate")
    BigDecimal getRevenueBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status")
    long countByStatus(@Param("status") PaymentStatus status);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status AND p.createdAt >= :startDate")
    long countByStatusAfter(@Param("status") PaymentStatus status, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT AVG(p.finalAmount) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal getAverageOrderValue();

    @Query("SELECT p.productType, COUNT(p), COALESCE(SUM(p.finalAmount), 0) FROM Payment p " +
           "WHERE p.status = 'COMPLETED' GROUP BY p.productType")
    List<Object[]> getRevenueByProductType();

    // 관리자용 쿼리
    @Query("SELECT p FROM Payment p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:productType IS NULL OR p.productType = :productType) AND " +
           "(:search IS NULL OR p.orderId LIKE %:search% OR p.user.email LIKE %:search%) " +
           "ORDER BY p.createdAt DESC")
    Page<Payment> findPaymentsForAdmin(
            @Param("status") PaymentStatus status,
            @Param("productType") ProductType productType,
            @Param("search") String search,
            Pageable pageable);

    // 환불 대기 목록
    @Query("SELECT p FROM Payment p WHERE p.status = 'COMPLETED' AND " +
           "EXISTS (SELECT 1 FROM Payment p2 WHERE p2.orderId = p.orderId AND p2.status = 'PENDING')")
    List<Payment> findPendingRefunds();
}
