package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.AdminDto;
import com.travelmate.entity.Report;
import com.travelmate.entity.Report.ReportStatus;
import com.travelmate.service.AdminService;
import com.travelmate.service.ReportService;
import com.travelmate.service.TrustScoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Admin Controller
 *
 * REST API endpoints for admin operations.
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "관리자 API")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;
    private final TrustScoreService trustScoreService;

    // ===== Dashboard =====

    @GetMapping("/dashboard")
    @Operation(summary = "대시보드 통계", description = "관리자 대시보드 통계를 조회합니다.")
    public ResponseEntity<AdminDto.DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/health")
    @Operation(summary = "시스템 상태", description = "시스템 상태를 조회합니다.")
    public ResponseEntity<AdminDto.SystemHealth> getSystemHealth() {
        return ResponseEntity.ok(adminService.getSystemHealth());
    }

    // ===== User Management =====

    @GetMapping("/users")
    @Operation(summary = "사용자 목록", description = "사용자 목록을 조회합니다.")
    public ResponseEntity<Page<AdminDto.UserManagement>> getUsers(
            @Parameter(description = "검색어 (이메일, 닉네임)")
            @RequestParam(required = false) String search,
            @Parameter(description = "역할 필터")
            @RequestParam(required = false) String role,
            @Parameter(description = "활성화 상태 필터")
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminService.getUsers(search, role, isActive, pageable));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "사용자 상세", description = "사용자 상세 정보를 조회합니다.")
    public ResponseEntity<AdminDto.UserDetailResponse> getUserDetail(
            @PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserDetail(userId));
    }

    @PutMapping("/users/{userId}")
    @Operation(summary = "사용자 수정", description = "사용자 정보를 수정합니다.")
    public ResponseEntity<AdminDto.UserManagement> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody AdminDto.UpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(userId, request));
    }

    @PostMapping("/users/bulk")
    @Operation(summary = "사용자 일괄 처리", description = "여러 사용자를 일괄 처리합니다.")
    public ResponseEntity<AdminDto.BulkActionResponse> bulkUserAction(
            @Valid @RequestBody AdminDto.BulkActionRequest request) {
        return ResponseEntity.ok(adminService.bulkUserAction(request));
    }

    // ===== Location Management =====

    @GetMapping("/locations")
    @Operation(summary = "장소 목록", description = "수집 가능 장소 목록을 조회합니다.")
    public ResponseEntity<Page<AdminDto.LocationManagement>> getLocations(
            @Parameter(description = "검색어 (이름, 설명)")
            @RequestParam(required = false) String search,
            @Parameter(description = "카테고리 필터")
            @RequestParam(required = false) String category,
            @Parameter(description = "희귀도 필터")
            @RequestParam(required = false) String rarity,
            @Parameter(description = "활성화 상태 필터")
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminService.getLocations(search, category, rarity, isActive, pageable));
    }

    @PostMapping("/locations")
    @Operation(summary = "장소 생성", description = "새 수집 가능 장소를 생성합니다.")
    public ResponseEntity<AdminDto.LocationManagement> createLocation(
            @Valid @RequestBody AdminDto.CreateLocationRequest request) {
        return ResponseEntity.ok(adminService.createLocation(request));
    }

    @PutMapping("/locations/{locationId}")
    @Operation(summary = "장소 수정", description = "장소 정보를 수정합니다.")
    public ResponseEntity<AdminDto.LocationManagement> updateLocation(
            @PathVariable Long locationId,
            @Valid @RequestBody AdminDto.UpdateLocationRequest request) {
        return ResponseEntity.ok(adminService.updateLocation(locationId, request));
    }

    @DeleteMapping("/locations/{locationId}")
    @Operation(summary = "장소 삭제", description = "장소를 비활성화합니다.")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long locationId) {
        adminService.deleteLocation(locationId);
        return ResponseEntity.noContent().build();
    }

    // ===== Recommendation Feedback =====

    @GetMapping("/recommendation-feedback")
    @Operation(summary = "추천 피드백 목록", description = "추천 품질 개선용 사용자 피드백을 조회합니다.")
    public ResponseEntity<Page<AdminDto.RecommendationFeedbackResponse>> getRecommendationFeedback(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String feedbackType,
            @RequestParam(required = false) String targetType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminService.getRecommendationFeedback(
                userId, rating, feedbackType, targetType, pageable));
    }

    @GetMapping("/recommendation-feedback/stats")
    @Operation(summary = "추천 피드백 통계", description = "추천 피드백 평점/유형별 집계를 조회합니다.")
    public ResponseEntity<AdminDto.RecommendationFeedbackStats> getRecommendationFeedbackStats() {
        return ResponseEntity.ok(adminService.getRecommendationFeedbackStats());
    }

    // ===== Report Dashboard =====

    @GetMapping("/reports")
    @Operation(summary = "신고 목록", description = "대기 중인 신고 목록을 조회합니다.")
    public ResponseEntity<List<ReportResponse>> getPendingReports() {
        List<Report> reports = reportService.getPendingReports();
        List<ReportResponse> response = reports.stream().map(ReportResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/user/{userId}")
    @Operation(summary = "사용자 신고 내역", description = "특정 사용자에 대한 신고 내역을 조회합니다.")
    public ResponseEntity<List<ReportResponse>> getReportsByUser(@PathVariable Long userId) {
        List<Report> reports = reportService.getReportsByUser(userId);
        List<ReportResponse> response = reports.stream().map(ReportResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reports/{reportId}/process")
    @Operation(summary = "신고 처리", description = "신고를 처리합니다.")
    public ResponseEntity<ReportResponse> processReport(
            @AuthenticationPrincipal String adminUserId,
            @PathVariable Long reportId,
            @Valid @RequestBody ProcessReportRequest request) {
        Report report = reportService.processReport(
                reportId, AuthenticatedUserId.parse(adminUserId), request.getStatus(), request.getAdminNote());
        return ResponseEntity.ok(ReportResponse.from(report));
    }

    @PostMapping("/reports/user/{userId}/recalculate-trust")
    @Operation(summary = "신뢰 점수 재계산", description = "사용자의 신뢰 점수를 재계산합니다.")
    public ResponseEntity<Map<String, Object>> recalculateTrustScore(@PathVariable Long userId) {
        var score = trustScoreService.recalculate(userId);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "totalScore", score.getTotalScore(),
                "badge", score.getTrustBadge().name()
        ));
    }

    @Data
    public static class ProcessReportRequest {
        @NotNull(message = "처리 상태는 필수입니다")
        private ReportStatus status;
        private String adminNote;
    }

    @Data
    public static class ReportResponse {
        private Long id;
        private Long reporterId;
        private String reporterName;
        private Long reportedUserId;
        private String reportedUserName;
        private String reportType;
        private String reason;
        private String description;
        private String status;
        private String adminNote;
        private LocalDateTime createdAt;
        private LocalDateTime processedAt;

        public static ReportResponse from(Report report) {
            ReportResponse r = new ReportResponse();
            r.id = report.getId();
            r.reporterId = report.getReporter().getId();
            r.reporterName = report.getReporter().getNickname();
            r.reportedUserId = report.getReportedUser().getId();
            r.reportedUserName = report.getReportedUser().getNickname();
            r.reportType = report.getReportType().name();
            r.reason = report.getReason();
            r.description = report.getDescription();
            r.status = report.getStatus().name();
            r.adminNote = report.getAdminNote();
            r.createdAt = report.getCreatedAt();
            r.processedAt = report.getProcessedAt();
            return r;
        }
    }
}
