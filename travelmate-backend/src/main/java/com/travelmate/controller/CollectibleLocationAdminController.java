package com.travelmate.controller;

import com.travelmate.dto.NftDto;
import com.travelmate.service.nft.CollectibleLocationAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/locations")
@RequiredArgsConstructor
@Tag(name = "Admin - Collectible Locations", description = "수집 가능 장소 관리 API (관리자 전용)")
public class CollectibleLocationAdminController {

    private final CollectibleLocationAdminService adminService;

    @GetMapping
    @Operation(summary = "장소 목록 조회", description = "모든 수집 가능 장소 목록 조회 (페이징)")
    public ResponseEntity<Page<NftDto.CollectibleLocationAdminResponse>> getAllLocations(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllLocations(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "장소 상세 조회", description = "특정 장소 상세 정보 조회")
    public ResponseEntity<NftDto.CollectibleLocationAdminResponse> getLocation(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getLocation(id));
    }

    @PostMapping
    @Operation(summary = "장소 생성", description = "새로운 수집 가능 장소 생성")
    public ResponseEntity<NftDto.CollectibleLocationAdminResponse> createLocation(
            @Valid @RequestBody NftDto.CreateLocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createLocation(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "장소 수정", description = "기존 장소 정보 수정")
    public ResponseEntity<NftDto.CollectibleLocationAdminResponse> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody NftDto.UpdateLocationRequest request) {
        return ResponseEntity.ok(adminService.updateLocation(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "장소 활성화/비활성화", description = "장소의 활성화 상태 토글")
    public ResponseEntity<Map<String, String>> toggleActive(@PathVariable Long id) {
        adminService.toggleActive(id);
        return ResponseEntity.ok(Map.of("message", "상태가 변경되었습니다"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "장소 삭제", description = "장소 영구 삭제 (주의: 연관 데이터 확인 필요)")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {
        adminService.deleteLocation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/seasonal-events")
    @Operation(summary = "시즌 이벤트 장소 조회", description = "현재 활성화된 시즌 이벤트 장소 목록")
    public ResponseEntity<List<NftDto.CollectibleLocationAdminResponse>> getSeasonalEvents() {
        return ResponseEntity.ok(adminService.getSeasonalEvents());
    }

    @GetMapping("/stats")
    @Operation(summary = "장소 통계 조회", description = "전체 장소 통계 (희귀도별, 카테고리별)")
    public ResponseEntity<NftDto.LocationStatsResponse> getLocationStats() {
        return ResponseEntity.ok(adminService.getLocationStats());
    }

    @PostMapping("/bulk")
    @Operation(summary = "대량 장소 생성", description = "여러 장소를 한 번에 생성")
    public ResponseEntity<Map<String, Object>> bulkCreateLocations(
            @Valid @RequestBody List<NftDto.CreateLocationRequest> requests) {
        int created = adminService.bulkCreateLocations(requests);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "대량 생성 완료",
                        "total", requests.size(),
                        "created", created
                ));
    }
}
