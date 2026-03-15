package com.travelmate.controller;

import com.travelmate.entity.BetaInvite;
import com.travelmate.service.BetaInviteService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class BetaInviteController {

    private final BetaInviteService betaInviteService;

    // --- 공개 API ---

    @GetMapping("/invite/{code}")
    public ResponseEntity<?> validateInvite(@PathVariable String code) {
        BetaInvite invite = betaInviteService.validateInviteCode(code);
        if (invite == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "message", "유효하지 않거나 만료된 초대 코드입니다."
            ));
        }
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "code", invite.getInviteCode(),
                "expiresAt", invite.getExpiresAt() != null ? invite.getExpiresAt().toString() : ""
        ));
    }

    @GetMapping("/invite/status")
    public ResponseEntity<?> betaStatus() {
        boolean enabled = betaInviteService.isBetaEnabled();
        return ResponseEntity.ok(Map.of("betaEnabled", enabled));
    }

    // --- 관리자 API ---

    @PostMapping("/admin/beta/generate")
    public ResponseEntity<?> generateInvites(@RequestBody GenerateRequest request) {
        int count = request.getCount() != null ? request.getCount() : 10;
        LocalDateTime expiresAt = request.getExpiresInDays() != null
                ? LocalDateTime.now().plusDays(request.getExpiresInDays())
                : null;

        List<BetaInvite> invites = betaInviteService.generateInvites(count, request.getNote(), expiresAt);

        List<String> codes = invites.stream().map(BetaInvite::getInviteCode).toList();
        return ResponseEntity.ok(Map.of(
                "generated", codes.size(),
                "codes", codes
        ));
    }

    @PostMapping("/admin/beta/generate-email")
    public ResponseEntity<?> generateForEmail(@RequestBody GenerateEmailRequest request) {
        LocalDateTime expiresAt = request.getExpiresInDays() != null
                ? LocalDateTime.now().plusDays(request.getExpiresInDays())
                : null;

        BetaInvite invite = betaInviteService.generateInviteForEmail(
                request.getEmail(), request.getNote(), expiresAt);

        return ResponseEntity.ok(Map.of(
                "code", invite.getInviteCode(),
                "email", invite.getEmail()
        ));
    }

    @PostMapping("/admin/beta/revoke/{code}")
    public ResponseEntity<?> revokeInvite(@PathVariable String code) {
        betaInviteService.revokeInvite(code);
        return ResponseEntity.ok(Map.of("message", "초대 코드가 취소되었습니다."));
    }

    @GetMapping("/admin/beta/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(betaInviteService.getStats());
    }

    @PostMapping("/admin/beta/toggle")
    public ResponseEntity<?> toggleBeta(@RequestBody Map<String, Boolean> request) {
        boolean enabled = request.getOrDefault("enabled", false);
        betaInviteService.setBetaEnabled(enabled);
        return ResponseEntity.ok(Map.of("betaEnabled", enabled));
    }

    @Data
    public static class GenerateRequest {
        private Integer count;
        private String note;
        private Integer expiresInDays;
    }

    @Data
    public static class GenerateEmailRequest {
        private String email;
        private String note;
        private Integer expiresInDays;
    }
}
