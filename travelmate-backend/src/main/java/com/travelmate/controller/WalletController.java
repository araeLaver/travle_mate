package com.travelmate.controller;

import com.travelmate.dto.WalletDto;
import com.travelmate.entity.User;
import com.travelmate.service.nft.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Tag(name = "Wallet", description = "블록체인 지갑 연동 API")
public class WalletController {

    private final WalletService walletService;

    @Operation(summary = "서명 메시지 생성", description = "지갑 연결을 위한 서명 메시지를 생성합니다")
    @PostMapping("/sign-message")
    public ResponseEntity<WalletDto.SignMessageResponse> generateSignMessage(
            @Valid @RequestBody WalletDto.ConnectWalletRequest request) {
        WalletDto.SignMessageResponse response = walletService.generateSignMessage(request.getWalletAddress());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "서명 검증 및 지갑 연결", description = "서명을 검증하고 지갑을 계정에 연결합니다")
    @PostMapping("/verify")
    public ResponseEntity<WalletDto.WalletConnectionResponse> verifyAndConnect(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody WalletDto.VerifySignatureRequest request) {
        WalletDto.WalletConnectionResponse response = walletService.verifyAndConnect(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "지갑 상태 조회", description = "현재 연결된 지갑 상태를 조회합니다")
    @GetMapping("/status")
    public ResponseEntity<WalletDto.WalletStatusResponse> getWalletStatus(@AuthenticationPrincipal User user) {
        WalletDto.WalletStatusResponse response = walletService.getWalletStatus(user.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "지갑 연결 해제", description = "연결된 지갑을 해제합니다")
    @DeleteMapping("/disconnect")
    public ResponseEntity<WalletDto.DisconnectResponse> disconnectWallet(@AuthenticationPrincipal User user) {
        WalletDto.DisconnectResponse response = walletService.disconnectWallet(user.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "네트워크 정보 조회", description = "블록체인 네트워크 정보를 조회합니다")
    @GetMapping("/network")
    public ResponseEntity<WalletDto.NetworkInfo> getNetworkInfo() {
        WalletDto.NetworkInfo response = walletService.getNetworkInfo();
        return ResponseEntity.ok(response);
    }
}
