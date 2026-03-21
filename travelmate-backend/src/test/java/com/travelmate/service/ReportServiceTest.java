package com.travelmate.service;

import com.travelmate.entity.Report;
import com.travelmate.entity.Report.ReportStatus;
import com.travelmate.entity.Report.ReportType;
import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.ReportRepository;
import com.travelmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportService 테스트")
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReportService reportService;

    private User reporter;
    private User reportedUser;
    private User admin;
    private Report testReport;

    @BeforeEach
    void setUp() {
        reporter = new User();
        reporter.setId(1L);
        reporter.setEmail("reporter@example.com");
        reporter.setNickname("reporter");
        reporter.setIsActive(true);

        reportedUser = new User();
        reportedUser.setId(2L);
        reportedUser.setEmail("reported@example.com");
        reportedUser.setNickname("reported");
        reportedUser.setIsActive(true);

        admin = new User();
        admin.setId(100L);
        admin.setEmail("admin@example.com");
        admin.setNickname("admin");

        testReport = new Report();
        testReport.setId(1L);
        testReport.setReporter(reporter);
        testReport.setReportedUser(reportedUser);
        testReport.setReportType(ReportType.HARASSMENT);
        testReport.setReason("부적절한 언행");
        testReport.setStatus(ReportStatus.PENDING);
    }

    @Nested
    @DisplayName("신고 생성 테스트")
    class CreateReportTest {

        @Test
        @DisplayName("성공 - 정상적인 신고 생성")
        void createReport_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reportedUser));
            when(reportRepository.existsByReporterIdAndReportedUserIdAndCreatedAtAfter(
                    anyLong(), anyLong(), any(LocalDateTime.class))).thenReturn(false);
            when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> {
                Report report = invocation.getArgument(0);
                report.setId(1L);
                return report;
            });
            when(reportRepository.countRecentReportsByUserId(anyLong(), any(LocalDateTime.class))).thenReturn(0L);
            when(reportRepository.countValidReportsByUserId(anyLong())).thenReturn(0L);

            // When
            Report result = reportService.createReport(
                    1L, 2L, ReportType.HARASSMENT, "부적절한 언행", "상세 설명");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getReporter()).isEqualTo(reporter);
            assertThat(result.getReportedUser()).isEqualTo(reportedUser);
            assertThat(result.getReportType()).isEqualTo(ReportType.HARASSMENT);
            assertThat(result.getStatus()).isEqualTo(ReportStatus.PENDING);
            verify(reportRepository).save(any(Report.class));
        }

        @Test
        @DisplayName("실패 - 자기 자신을 신고")
        void createReport_Fail_SelfReport() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));

            // When & Then
            assertThatThrownBy(() -> reportService.createReport(
                    1L, 1L, ReportType.HARASSMENT, "자기 신고", null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("자기 자신");
        }

        @Test
        @DisplayName("실패 - 24시간 내 중복 신고")
        void createReport_Fail_DuplicateReport() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reportedUser));
            when(reportRepository.existsByReporterIdAndReportedUserIdAndCreatedAtAfter(
                    anyLong(), anyLong(), any(LocalDateTime.class))).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> reportService.createReport(
                    1L, 2L, ReportType.HARASSMENT, "중복 신고", null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("24시간");
        }

        @Test
        @DisplayName("성공 - 자동 계정 정지 (5회 이상 신고)")
        void createReport_AutoSuspend() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(reporter));
            when(userRepository.findById(2L)).thenReturn(Optional.of(reportedUser));
            when(reportRepository.existsByReporterIdAndReportedUserIdAndCreatedAtAfter(
                    anyLong(), anyLong(), any(LocalDateTime.class))).thenReturn(false);
            when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> {
                Report report = invocation.getArgument(0);
                report.setId(1L);
                return report;
            });
            when(reportRepository.countRecentReportsByUserId(anyLong(), any(LocalDateTime.class))).thenReturn(3L);
            when(reportRepository.countValidReportsByUserId(anyLong())).thenReturn(5L);

            // When
            reportService.createReport(1L, 2L, ReportType.HARASSMENT, "신고", null);

            // Then
            verify(userRepository).save(argThat(user -> !user.getIsActive()));
            verify(notificationService).createNotification(
                    eq(2L), eq("계정 정지 안내"), anyString(), eq("SYSTEM"));
        }
    }

    @Nested
    @DisplayName("신고 처리 테스트")
    class ProcessReportTest {

        @Test
        @DisplayName("성공 - 신고 처리 완료")
        void processReport_Success() {
            // Given
            when(reportRepository.findById(1L)).thenReturn(Optional.of(testReport));
            when(userRepository.findById(100L)).thenReturn(Optional.of(admin));
            when(reportRepository.save(any(Report.class))).thenReturn(testReport);

            // When
            Report result = reportService.processReport(1L, 100L, ReportStatus.RESOLVED, "처리 완료");

            // Then
            assertThat(result.getStatus()).isEqualTo(ReportStatus.RESOLVED);
            assertThat(result.getAdminNote()).isEqualTo("처리 완료");
            verify(notificationService, times(2)).createNotification(
                    anyLong(), anyString(), anyString(), eq("SYSTEM"));
        }

        @Test
        @DisplayName("성공 - 신고 기각 (피신고자에게 알림 안함)")
        void processReport_Dismissed() {
            // Given
            when(reportRepository.findById(1L)).thenReturn(Optional.of(testReport));
            when(userRepository.findById(100L)).thenReturn(Optional.of(admin));
            when(reportRepository.save(any(Report.class))).thenReturn(testReport);

            // When
            Report result = reportService.processReport(1L, 100L, ReportStatus.DISMISSED, "증거 불충분");

            // Then
            assertThat(result.getStatus()).isEqualTo(ReportStatus.DISMISSED);
            // 신고자에게만 알림 (피신고자에게는 알림 안함)
            verify(notificationService, times(1)).createNotification(
                    eq(1L), anyString(), anyString(), eq("SYSTEM"));
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 신고")
        void processReport_Fail_NotFound() {
            // Given
            when(reportRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> reportService.processReport(999L, 100L, ReportStatus.RESOLVED, "처리"))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("신고 조회 테스트")
    class GetReportsTest {

        @Test
        @DisplayName("대기 중인 신고 목록 조회")
        void getPendingReports() {
            // Given
            List<Report> pendingReports = Arrays.asList(testReport);
            when(reportRepository.findPendingReports()).thenReturn(pendingReports);

            // When
            List<Report> result = reportService.getPendingReports();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(ReportStatus.PENDING);
        }

        @Test
        @DisplayName("특정 사용자에 대한 신고 목록 조회")
        void getReportsByUser() {
            // Given
            List<Report> reports = Arrays.asList(testReport);
            when(reportRepository.findByReportedUserIdOrderByCreatedAtDesc(2L)).thenReturn(reports);

            // When
            List<Report> result = reportService.getReportsByUser(2L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getReportedUser().getId()).isEqualTo(2L);
        }
    }
}
