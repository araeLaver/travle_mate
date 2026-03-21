package com.travelmate.service;

import com.travelmate.entity.Report;
import com.travelmate.entity.Report.ReportStatus;
import com.travelmate.entity.Report.ReportType;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.ReportRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final int REPORT_COOLDOWN_HOURS = 24;
    private static final int AUTO_SUSPEND_THRESHOLD = 5;
    private static final int RECENT_REPORT_DAYS = 7;

    public Report createReport(Long reporterId, Long reportedUserId, ReportType reportType,
                               String reason, String description) {
        User reporter = userRepository.findById(reporterId)
            .orElseThrow(() -> new BusinessException("신고자를 찾을 수 없습니다."));

        User reportedUser = userRepository.findById(reportedUserId)
            .orElseThrow(() -> new BusinessException("신고 대상자를 찾을 수 없습니다."));

        if (reporterId.equals(reportedUserId)) {
            throw new BusinessException("자기 자신을 신고할 수 없습니다.");
        }

        // 동일 사용자에 대한 중복 신고 방지 (24시간 이내)
        LocalDateTime cooldownTime = LocalDateTime.now().minusHours(REPORT_COOLDOWN_HOURS);
        if (reportRepository.existsByReporterIdAndReportedUserIdAndCreatedAtAfter(
            reporterId, reportedUserId, cooldownTime)) {
            throw new BusinessException("동일한 사용자에 대해 24시간 이내에 다시 신고할 수 없습니다.");
        }

        Report report = new Report();
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setReportType(reportType);
        report.setReason(reason);
        report.setDescription(description);
        report.setStatus(ReportStatus.PENDING);

        Report savedReport = reportRepository.save(report);
        log.info("신고 접수: ID={}, 신고자={}, 피신고자={}, 유형={}",
            savedReport.getId(), reporterId, reportedUserId, reportType);

        // 신고 횟수 확인 및 자동 조치
        checkAndApplyAutoActions(reportedUser);

        // 관리자에게 알림 발송
        notifyAdmins(savedReport);

        return savedReport;
    }

    private void checkAndApplyAutoActions(User reportedUser) {
        // 최근 7일간 신고 횟수 확인
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(RECENT_REPORT_DAYS);
        long recentReports = reportRepository.countRecentReportsByUserId(reportedUser.getId(), weekAgo);

        // 전체 유효 신고 횟수 확인
        long totalValidReports = reportRepository.countValidReportsByUserId(reportedUser.getId());

        log.info("사용자 {} 신고 현황: 최근 7일={}, 전체={}", reportedUser.getId(), recentReports, totalValidReports);

        // 자동 제재 조치
        if (totalValidReports >= AUTO_SUSPEND_THRESHOLD) {
            reportedUser.setIsActive(false);
            userRepository.save(reportedUser);
            log.warn("사용자 {} 자동 정지: 신고 횟수 {}회 초과", reportedUser.getId(), AUTO_SUSPEND_THRESHOLD);

            // 사용자에게 알림
            notificationService.createNotification(
                reportedUser.getId(),
                "계정 정지 안내",
                "다수의 신고로 인해 계정이 일시 정지되었습니다. 고객센터로 문의해주세요.",
                "SYSTEM"
            );
        } else if (recentReports >= 3) {
            // 경고 알림
            notificationService.createNotification(
                reportedUser.getId(),
                "신고 경고",
                "최근 여러 건의 신고가 접수되었습니다. 서비스 이용 시 주의해주세요.",
                "SYSTEM"
            );
        }
    }

    private void notifyAdmins(Report report) {
        // 관리자에게 새 신고 알림 (실제 구현에서는 관리자 목록 조회 필요)
        log.info("관리자 알림 발송: 새 신고 ID={}, 유형={}, 피신고자={}",
            report.getId(), report.getReportType(), report.getReportedUser().getId());
    }

    @Transactional(readOnly = true)
    public List<Report> getPendingReports() {
        return reportRepository.findPendingReports();
    }

    @Transactional(readOnly = true)
    public List<Report> getReportsByUser(Long userId) {
        return reportRepository.findByReportedUserIdOrderByCreatedAtDesc(userId);
    }

    public Report processReport(Long reportId, Long adminId, ReportStatus newStatus, String adminNote) {
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new BusinessException("신고를 찾을 수 없습니다."));

        User admin = userRepository.findById(adminId)
            .orElseThrow(() -> new BusinessException("관리자를 찾을 수 없습니다."));

        report.setStatus(newStatus);
        report.setAdminNote(adminNote);
        report.setProcessedBy(admin);
        report.setProcessedAt(LocalDateTime.now());

        Report savedReport = reportRepository.save(report);
        log.info("신고 처리 완료: ID={}, 상태={}, 처리자={}", reportId, newStatus, adminId);

        // 신고자에게 처리 결과 알림
        notificationService.createNotification(
            report.getReporter().getId(),
            "신고 처리 결과",
            String.format("접수하신 신고가 '%s' 상태로 처리되었습니다.", newStatus.getDescription()),
            "SYSTEM"
        );

        // 피신고자에게도 알림 (기각이 아닌 경우)
        if (newStatus != ReportStatus.DISMISSED) {
            notificationService.createNotification(
                report.getReportedUser().getId(),
                "신고 처리 안내",
                "귀하에 대한 신고가 처리되었습니다. 서비스 이용 약관을 준수해주세요.",
                "SYSTEM"
            );
        }

        return savedReport;
    }

    @Transactional(readOnly = true)
    public List<Object[]> getUsersWithMultipleReports(int threshold) {
        return reportRepository.findUsersWithMultipleReports(threshold);
    }
}
