package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.UserBlockDto;
import com.travelmate.service.UserBlockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "User Blocks", description = "사용자 차단 관리 API")
public class UserBlockController {

    private final UserBlockService userBlockService;

    @PostMapping("/block")
    @Operation(summary = "사용자 차단", description = "특정 사용자를 차단합니다.")
    public ResponseEntity<UserBlockDto.Response> blockUser(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UserBlockDto.BlockRequest request) {

        UserBlockDto.Response response = userBlockService.blockUser(
                parseUserId(userId), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/block/{userId}")
    @Operation(summary = "사용자 차단 해제", description = "차단을 해제합니다.")
    public ResponseEntity<Void> unblockUser(
            @AuthenticationPrincipal String principalUserId,
            @PathVariable Long userId) {

        userBlockService.unblockUser(parseUserId(principalUserId), userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/block/{userId}/toggle")
    @Operation(summary = "차단 토글", description = "사용자 차단을 토글합니다.")
    public ResponseEntity<UserBlockDto.ToggleResponse> toggleBlock(
            @AuthenticationPrincipal String principalUserId,
            @PathVariable Long userId) {

        UserBlockDto.ToggleResponse response = userBlockService.toggleBlock(
                parseUserId(principalUserId), userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/blocked")
    @Operation(summary = "차단 목록 조회", description = "내가 차단한 사용자 목록을 조회합니다.")
    public ResponseEntity<UserBlockDto.ListResponse> getBlockedUsers(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        UserBlockDto.ListResponse response = userBlockService.getBlockedUsers(
                parseUserId(userId), pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/block/{userId}/status")
    @Operation(summary = "차단 상태 조회", description = "특정 사용자와의 차단 상태를 조회합니다.")
    public ResponseEntity<UserBlockDto.StatusResponse> getBlockStatus(
            @AuthenticationPrincipal String principalUserId,
            @PathVariable Long userId) {

        UserBlockDto.StatusResponse response = userBlockService.getBlockStatus(
                parseUserId(principalUserId), userId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/block/status/batch")
    @Operation(summary = "차단 상태 일괄 조회", description = "여러 사용자의 차단 상태를 일괄 조회합니다.")
    public ResponseEntity<UserBlockDto.BatchStatusResponse> getBatchBlockStatus(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UserBlockDto.BatchStatusRequest request) {

        UserBlockDto.BatchStatusResponse response = userBlockService.getBatchBlockStatus(
                parseUserId(userId), request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/blocked/ids")
    @Operation(summary = "차단 사용자 ID 목록", description = "내가 차단한 사용자 ID 목록을 조회합니다.")
    public ResponseEntity<List<Long>> getBlockedUserIds(
            @AuthenticationPrincipal String userId) {

        List<Long> blockedIds = userBlockService.getBlockedUserIds(parseUserId(userId));
        return ResponseEntity.ok(blockedIds);
    }

    private Long parseUserId(String userId) {
        return AuthenticatedUserId.parse(userId);
    }
}
