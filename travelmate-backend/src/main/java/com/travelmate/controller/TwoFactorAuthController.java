package com.travelmate.controller;

import com.travelmate.dto.AuthDto;
import com.travelmate.entity.TwoFactorAuth;
import com.travelmate.entity.User;
import com.travelmate.repository.UserRepository;
import com.travelmate.service.TwoFactorAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 2FA (Two-Factor Authentication) Controller
 * 2단계 인증 관리 API
 */
@Tag(name = "2FA", description = "2단계 인증 관리 API")
@RestController
@RequestMapping("/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorAuthController {

    private final TwoFactorAuthService twoFactorAuthService;
    private final UserRepository userRepository;

    private static final String ISSUER = "TravelMate";

    /**
     * 2FA 상태 조회
     */
    @GetMapping("/status")
    @Operation(summary = "2FA 상태 조회", description = "현재 사용자의 2FA 활성화 상태를 조회합니다.")
    public ResponseEntity<TwoFactorStatusResponse> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUserFromDetails(userDetails);
        boolean isEnabled = twoFactorAuthService.verifyTwoFactorCode(user, null);

        return ResponseEntity.ok(TwoFactorStatusResponse.builder()
                .enabled(!isEnabled) // verifyTwoFactorCode returns true if 2FA is not set
                .build());
    }

    /**
     * 2FA 설정 시작
     */
    @PostMapping("/setup")
    @Operation(summary = "2FA 설정 시작", description = "2FA 설정을 초기화하고 QR 코드 URI를 반환합니다.")
    public ResponseEntity<TwoFactorSetupResponse> setup(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TwoFactorSetupRequest request) {

        User user = getUserFromDetails(userDetails);
        TwoFactorAuth.TwoFactorMethod method = TwoFactorAuth.TwoFactorMethod.valueOf(
                request.getMethod() != null ? request.getMethod() : "TOTP");

        TwoFactorAuth twoFactorAuth = twoFactorAuthService.initializeTwoFactorAuth(user, method);
        String qrCodeUri = twoFactorAuthService.generateQrCodeUri(user, twoFactorAuth.getSecretKey(), ISSUER);
        List<String> backupCodes = twoFactorAuthService.getBackupCodes(user);

        return ResponseEntity.ok(TwoFactorSetupResponse.builder()
                .secretKey(twoFactorAuth.getSecretKey())
                .qrCodeUri(qrCodeUri)
                .backupCodes(backupCodes)
                .build());
    }

    /**
     * 2FA 활성화
     */
    @PostMapping("/enable")
    @Operation(summary = "2FA 활성화", description = "TOTP 코드를 검증하고 2FA를 활성화합니다.")
    public ResponseEntity<TwoFactorEnableResponse> enable(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TwoFactorVerifyRequest request) {

        User user = getUserFromDetails(userDetails);
        boolean success = twoFactorAuthService.enableTwoFactorAuth(user, request.getCode());

        return ResponseEntity.ok(TwoFactorEnableResponse.builder()
                .success(success)
                .message(success ? "2FA가 활성화되었습니다." : "2FA 활성화에 실패했습니다.")
                .build());
    }

    /**
     * 2FA 비활성화
     */
    @PostMapping("/disable")
    @Operation(summary = "2FA 비활성화", description = "2FA를 비활성화합니다.")
    public ResponseEntity<TwoFactorEnableResponse> disable(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TwoFactorVerifyRequest request) {

        User user = getUserFromDetails(userDetails);
        twoFactorAuthService.disableTwoFactorAuth(user, request.getCode());

        return ResponseEntity.ok(TwoFactorEnableResponse.builder()
                .success(true)
                .message("2FA가 비활성화되었습니다.")
                .build());
    }

    /**
     * 2FA 코드 검증
     */
    @PostMapping("/verify")
    @Operation(summary = "2FA 코드 검증", description = "TOTP 또는 백업 코드를 검증합니다.")
    public ResponseEntity<TwoFactorVerifyResponse> verify(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TwoFactorVerifyRequest request) {

        User user = getUserFromDetails(userDetails);
        boolean valid = twoFactorAuthService.verifyTwoFactorCode(user, request.getCode());

        return ResponseEntity.ok(TwoFactorVerifyResponse.builder()
                .valid(valid)
                .message(valid ? "인증 성공" : "인증 실패")
                .build());
    }

    /**
     * 백업 코드 조회
     */
    @GetMapping("/backup-codes")
    @Operation(summary = "백업 코드 조회", description = "남은 백업 코드를 조회합니다.")
    public ResponseEntity<BackupCodesResponse> getBackupCodes(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUserFromDetails(userDetails);
        List<String> backupCodes = twoFactorAuthService.getBackupCodes(user);

        return ResponseEntity.ok(BackupCodesResponse.builder()
                .backupCodes(backupCodes)
                .count(backupCodes.size())
                .build());
    }

    /**
     * 백업 코드 재생성
     */
    @PostMapping("/backup-codes/regenerate")
    @Operation(summary = "백업 코드 재생성", description = "새로운 백업 코드를 생성합니다.")
    public ResponseEntity<BackupCodesResponse> regenerateBackupCodes(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUserFromDetails(userDetails);
        List<String> newBackupCodes = twoFactorAuthService.regenerateBackupCodes(user);

        return ResponseEntity.ok(BackupCodesResponse.builder()
                .backupCodes(newBackupCodes)
                .count(newBackupCodes.size())
                .build());
    }

    private User getUserFromDetails(UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    // DTO Classes

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TwoFactorStatusResponse {
        private boolean enabled;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TwoFactorSetupRequest {
        private String method; // TOTP, SMS, EMAIL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TwoFactorSetupResponse {
        private String secretKey;
        private String qrCodeUri;
        private List<String> backupCodes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TwoFactorVerifyRequest {
        @NotBlank(message = "인증 코드를 입력해주세요.")
        private String code;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TwoFactorEnableResponse {
        private boolean success;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TwoFactorVerifyResponse {
        private boolean valid;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BackupCodesResponse {
        private List<String> backupCodes;
        private int count;
    }
}
