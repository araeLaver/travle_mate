package com.travelmate.controller;

import com.travelmate.dto.AdminDto;
import com.travelmate.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Controller
 *
 * REST API endpoints for admin operations.
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "관리자 API")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

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
}
