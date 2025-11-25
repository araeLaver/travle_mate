package com.travelmate.repository;

import com.travelmate.entity.Report;
import com.travelmate.entity.Report.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByReportedUserIdOrderByCreatedAtDesc(Long reportedUserId);

    List<Report> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.reportedUser.id = :userId AND r.status != 'DISMISSED'")
    long countValidReportsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.reportedUser.id = :userId AND r.createdAt > :since")
    long countRecentReportsByUserId(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    boolean existsByReporterIdAndReportedUserIdAndCreatedAtAfter(
        Long reporterId, Long reportedUserId, LocalDateTime since);

    @Query("SELECT r FROM Report r WHERE r.status = 'PENDING' ORDER BY r.createdAt ASC")
    List<Report> findPendingReports();

    @Query("SELECT r.reportedUser.id, COUNT(r) FROM Report r " +
           "WHERE r.status != 'DISMISSED' " +
           "GROUP BY r.reportedUser.id " +
           "HAVING COUNT(r) >= :threshold")
    List<Object[]> findUsersWithMultipleReports(@Param("threshold") long threshold);
}
