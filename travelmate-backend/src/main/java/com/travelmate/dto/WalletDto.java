package com.travelmate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigInteger;
import java.time.LocalDateTime;

public class WalletDto {

    /**
     * 지갑 연결 요청
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectWalletRequest {
        @NotBlank(message = "지갑 주소는 필수입니다")
        @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "올바른 이더리움 주소 형식이 아닙니다")
        private String walletAddress;

        private String walletType; // metamask, walletconnect, etc.
    }

    /**
     * 서명 검증 요청
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifySignatureRequest {
        @NotBlank(message = "지갑 주소는 필수입니다")
        @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "올바른 이더리움 주소 형식이 아닙니다")
        private String walletAddress;

        @NotBlank(message = "메시지는 필수입니다")
        private String message;

        @NotBlank(message = "서명은 필수입니다")
        private String signature;
    }

    /**
     * 서명용 메시지 생성 응답
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignMessageResponse {
        private String message;
        private String nonce;
        private long timestamp;
        private long expiresAt;
    }

    /**
     * 지갑 연결 응답
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletConnectionResponse {
        private boolean success;
        private String walletAddress;
        private boolean isVerified;
        private String message;
        private WalletInfo walletInfo;
    }

    /**
     * 지갑 정보
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletInfo {
        private String address;
        private String balance; // MATIC 잔액
        private String balanceFormatted;
        private Integer nftCount;
        private String networkName;
        private Long chainId;
        private LocalDateTime connectedAt;
        private LocalDateTime verifiedAt;
    }

    /**
     * 지갑 상태 응답
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletStatusResponse {
        private boolean isConnected;
        private boolean isVerified;
        private String walletAddress;
        private WalletInfo walletInfo;
    }

    /**
     * NFT 민팅 요청
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MintNftRequest {
        private Long nftCollectionId;
        private String recipientAddress;
        private String metadataUri;
    }

    /**
     * NFT 민팅 응답
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MintNftResponse {
        private boolean success;
        private String tokenId;
        private String transactionHash;
        private String message;
        private String metadataUri;
        private String openSeaUrl;
        private String polygonScanUrl;
    }

    /**
     * NFT 전송 요청
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferNftRequest {
        @NotBlank(message = "받는 주소는 필수입니다")
        @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "올바른 이더리움 주소 형식이 아닙니다")
        private String toAddress;

        @NotBlank(message = "토큰 ID는 필수입니다")
        private String tokenId;
    }

    /**
     * NFT 전송 응답
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferNftResponse {
        private boolean success;
        private String transactionHash;
        private String message;
        private String polygonScanUrl;
    }

    /**
     * 블록체인 네트워크 정보
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NetworkInfo {
        private String name;
        private Long chainId;
        private String rpcUrl;
        private String currencySymbol;
        private String blockExplorerUrl;
        private String contractAddress;
        private boolean isTestnet;
    }

    /**
     * 지갑 연결 해제 응답
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisconnectResponse {
        private boolean success;
        private String message;
    }
}
