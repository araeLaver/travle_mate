package com.travelmate.controller;

import com.travelmate.service.PhoneVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth/phone")
@RequiredArgsConstructor
@Tag(name = "Phone Verification", description = "휴대폰 본인 인증 API")
public class PhoneVerificationController {

    private final PhoneVerificationService phoneVerificationService;

    @PostMapping("/send")
    @Operation(summary = "인증 코드 발송", description = "입력한 휴대폰 번호로 6자리 인증 코드를 발송합니다.")
    public ResponseEntity<Map<String, String>> sendVerificationCode(
            @AuthenticationPrincipal String userId,
            @RequestBody SendRequest request) {
        Map<String, String> result = phoneVerificationService.sendVerificationCode(
                Long.parseLong(userId), request.getPhoneNumber());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify")
    @Operation(summary = "인증 코드 검증", description = "발송된 인증 코드를 검증하고 본인 인증을 완료합니다.")
    public ResponseEntity<Map<String, Object>> verifyCode(
            @AuthenticationPrincipal String userId,
            @RequestBody VerifyRequest request) {
        Map<String, Object> result = phoneVerificationService.verifyCode(
                Long.parseLong(userId), request.getPhoneNumber(), request.getCode());
        return ResponseEntity.ok(result);
    }

    @Data
    public static class SendRequest {
        @NotBlank(message = "휴대폰 번호를 입력해주세요")
        @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "올바른 휴대폰 번호 형식이 아닙니다")
        private String phoneNumber;
    }

    @Data
    public static class VerifyRequest {
        @NotBlank(message = "휴대폰 번호를 입력해주세요")
        private String phoneNumber;

        @NotBlank(message = "인증 코드를 입력해주세요")
        @Pattern(regexp = "^\\d{6}$", message = "인증 코드는 6자리 숫자입니다")
        private String code;
    }
}
