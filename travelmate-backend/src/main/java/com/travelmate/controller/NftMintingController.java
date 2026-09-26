package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.nft.MintingDto;
import com.travelmate.service.nft.NftMintingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/nft/mint")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "NFT 민팅", description = "블록체인 NFT 민팅 관련 API")
public class NftMintingController {

    private final NftMintingService nftMintingService;

    /**
     * NFT 민팅 요청
     * POST /api/nft/mint/{collectionId}
     */
    @Operation(
        summary = "NFT 민팅 요청",
        description = "수집한 NFT를 Polygon 블록체인에 민팅합니다. 지갑 주소가 필요합니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "민팅 요청 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "403", description = "민팅 권한 없음"),
        @ApiResponse(responseCode = "409", description = "이미 민팅됨 또는 진행 중")
    })
    @PostMapping("/{collectionId}")
    public ResponseEntity<MintingDto.MintingResponse> requestMinting(
            @PathVariable Long collectionId,
            @RequestBody(required = false) MintingDto.MintingRequest request,
            @AuthenticationPrincipal String userId) {

        Long userIdLong = parseUserId(userId);
        String walletAddress = request != null ? request.getWalletAddress() : null;

        MintingDto.MintingResponse response = nftMintingService.requestMinting(userIdLong, collectionId, walletAddress);
        return ResponseEntity.ok(response);
    }

    /**
     * 민팅 상태 조회
     * GET /api/nft/mint/status/{collectionId}
     */
    @Operation(summary = "민팅 상태 조회", description = "특정 NFT의 민팅 진행 상태를 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping("/status/{collectionId}")
    public ResponseEntity<MintingDto.MintingStatusResponse> getMintingStatus(
            @PathVariable Long collectionId,
            @AuthenticationPrincipal String userId) {

        Long userIdLong = parseUserId(userId);
        MintingDto.MintingStatusResponse response = nftMintingService.getMintingStatus(userIdLong, collectionId);
        return ResponseEntity.ok(response);
    }

    /**
     * 민팅 가능한 NFT 목록 조회
     * GET /api/nft/mint/mintable
     */
    @Operation(summary = "민팅 가능 NFT 목록", description = "아직 민팅하지 않은 수집 NFT 목록을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping("/mintable")
    public ResponseEntity<Page<MintingDto.MintableNftResponse>> getMintableNfts(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20) Pageable pageable) {

        Long userIdLong = parseUserId(userId);
        Page<MintingDto.MintableNftResponse> response = nftMintingService.getMintableNfts(userIdLong, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * 민팅 재시도
     * POST /api/nft/mint/{collectionId}/retry
     */
    @PostMapping("/{collectionId}/retry")
    public ResponseEntity<MintingDto.MintingResponse> retryMinting(
            @PathVariable Long collectionId,
            @AuthenticationPrincipal String userId) {

        Long userIdLong = parseUserId(userId);
        MintingDto.MintingResponse response = nftMintingService.retryMinting(userIdLong, collectionId);
        return ResponseEntity.ok(response);
    }

    /**
     * 민팅 통계 조회
     * GET /api/nft/mint/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<MintingDto.MintingStatsResponse> getMintingStats(
            @AuthenticationPrincipal String userId) {

        Long userIdLong = parseUserId(userId);
        MintingDto.MintingStatsResponse response = nftMintingService.getMintingStats(userIdLong);
        return ResponseEntity.ok(response);
    }

    private Long parseUserId(String userId) {
        return AuthenticatedUserId.parse(userId);
    }
}
