package com.travelmate.service.nft;

import com.travelmate.config.BlockchainConfig;
import com.travelmate.dto.WalletDto;
import com.travelmate.entity.User;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;
    private final UserNftCollectionRepository nftCollectionRepository;
    private final PolygonBlockchainService blockchainService;
    private final BlockchainConfig blockchainConfig;

    // Nonce 저장소 (실제 환경에서는 Redis 사용 권장)
    private final Map<String, NonceEntry> nonceStore = new ConcurrentHashMap<>();

    private static final long NONCE_EXPIRY_SECONDS = 300; // 5분
    private static final String SIGN_MESSAGE_TEMPLATE =
            "TravelMate 지갑 연결 인증\n\n" +
            "지갑 주소: %s\n" +
            "Nonce: %s\n" +
            "Timestamp: %d\n\n" +
            "이 메시지에 서명하면 지갑이 TravelMate 계정에 연결됩니다.";

    /**
     * 서명용 메시지 생성
     */
    public WalletDto.SignMessageResponse generateSignMessage(String walletAddress) {
        String nonce = generateNonce();
        long timestamp = Instant.now().getEpochSecond();
        long expiresAt = timestamp + NONCE_EXPIRY_SECONDS;

        String message = String.format(SIGN_MESSAGE_TEMPLATE, walletAddress, nonce, timestamp);

        // Nonce 저장
        nonceStore.put(walletAddress.toLowerCase(), new NonceEntry(nonce, expiresAt));

        return WalletDto.SignMessageResponse.builder()
                .message(message)
                .nonce(nonce)
                .timestamp(timestamp)
                .expiresAt(expiresAt)
                .build();
    }

    /**
     * 서명 검증 및 지갑 연결
     */
    @Transactional
    public WalletDto.WalletConnectionResponse verifyAndConnect(Long userId, WalletDto.VerifySignatureRequest request) {
        String walletAddress = request.getWalletAddress().toLowerCase();

        // Nonce 확인
        NonceEntry nonceEntry = nonceStore.get(walletAddress);
        if (nonceEntry == null) {
            return WalletDto.WalletConnectionResponse.builder()
                    .success(false)
                    .message("서명 요청이 만료되었거나 존재하지 않습니다. 다시 시도해주세요.")
                    .build();
        }

        // 만료 확인
        if (Instant.now().getEpochSecond() > nonceEntry.expiresAt) {
            nonceStore.remove(walletAddress);
            return WalletDto.WalletConnectionResponse.builder()
                    .success(false)
                    .message("서명 요청이 만료되었습니다. 다시 시도해주세요.")
                    .build();
        }

        // 서명 검증
        boolean isValid = blockchainService.verifySignature(
                request.getMessage(),
                request.getSignature(),
                request.getWalletAddress()
        );

        if (!isValid) {
            return WalletDto.WalletConnectionResponse.builder()
                    .success(false)
                    .message("서명 검증에 실패했습니다.")
                    .build();
        }

        // Nonce 삭제 (재사용 방지)
        nonceStore.remove(walletAddress);

        // 사용자 지갑 정보 업데이트
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        user.setPolygonWalletAddress(request.getWalletAddress());
        user.setIsWalletVerified(true);
        userRepository.save(user);

        // 지갑 정보 조회
        WalletDto.WalletInfo walletInfo = getWalletInfo(request.getWalletAddress(), userId);

        log.info("지갑 연결 완료: userId={}, wallet={}", userId, walletAddress);

        return WalletDto.WalletConnectionResponse.builder()
                .success(true)
                .walletAddress(request.getWalletAddress())
                .isVerified(true)
                .message("지갑이 성공적으로 연결되었습니다.")
                .walletInfo(walletInfo)
                .build();
    }

    /**
     * 지갑 상태 조회
     */
    @Transactional(readOnly = true)
    public WalletDto.WalletStatusResponse getWalletStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (user.getPolygonWalletAddress() == null) {
            return WalletDto.WalletStatusResponse.builder()
                    .isConnected(false)
                    .isVerified(false)
                    .build();
        }

        WalletDto.WalletInfo walletInfo = getWalletInfo(user.getPolygonWalletAddress(), userId);

        return WalletDto.WalletStatusResponse.builder()
                .isConnected(true)
                .isVerified(Boolean.TRUE.equals(user.getIsWalletVerified()))
                .walletAddress(user.getPolygonWalletAddress())
                .walletInfo(walletInfo)
                .build();
    }

    /**
     * 지갑 연결 해제
     */
    @Transactional
    public WalletDto.DisconnectResponse disconnectWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        user.setPolygonWalletAddress(null);
        user.setIsWalletVerified(false);
        userRepository.save(user);

        log.info("지갑 연결 해제: userId={}", userId);

        return WalletDto.DisconnectResponse.builder()
                .success(true)
                .message("지갑 연결이 해제되었습니다.")
                .build();
    }

    /**
     * 지갑 정보 조회
     */
    private WalletDto.WalletInfo getWalletInfo(String walletAddress, Long userId) {
        BigInteger balanceWei = blockchainService.getBalance(walletAddress);
        String balanceFormatted = formatBalance(balanceWei);

        int nftCount = nftCollectionRepository.countByUserIdAndWalletAddress(userId, walletAddress);

        return WalletDto.WalletInfo.builder()
                .address(walletAddress)
                .balance(balanceWei.toString())
                .balanceFormatted(balanceFormatted + " MATIC")
                .nftCount(nftCount)
                .networkName(getNetworkName())
                .chainId(blockchainConfig.getChainId())
                .build();
    }

    /**
     * 네트워크 정보 반환
     */
    public WalletDto.NetworkInfo getNetworkInfo() {
        long chainId = blockchainConfig.getChainId();
        boolean isTestnet = chainId != 137; // Polygon Mainnet

        String networkName;
        String blockExplorerUrl;

        if (chainId == 137) {
            networkName = "Polygon Mainnet";
            blockExplorerUrl = "https://polygonscan.com";
        } else if (chainId == 80002) {
            networkName = "Polygon Amoy Testnet";
            blockExplorerUrl = "https://amoy.polygonscan.com";
        } else if (chainId == 80001) {
            networkName = "Polygon Mumbai Testnet";
            blockExplorerUrl = "https://mumbai.polygonscan.com";
        } else {
            networkName = "Unknown Network";
            blockExplorerUrl = "https://polygonscan.com";
        }

        return WalletDto.NetworkInfo.builder()
                .name(networkName)
                .chainId(chainId)
                .rpcUrl(blockchainConfig.getPolygonRpcUrl())
                .currencySymbol("MATIC")
                .blockExplorerUrl(blockExplorerUrl)
                .contractAddress(blockchainConfig.getContractAddress())
                .isTestnet(isTestnet)
                .build();
    }

    /**
     * 네트워크 이름 반환
     */
    private String getNetworkName() {
        long chainId = blockchainConfig.getChainId();
        return switch ((int) chainId) {
            case 137 -> "Polygon Mainnet";
            case 80002 -> "Polygon Amoy";
            case 80001 -> "Polygon Mumbai";
            default -> "Unknown";
        };
    }

    /**
     * Wei를 MATIC으로 변환
     */
    private String formatBalance(BigInteger weiBalance) {
        BigDecimal matic = new BigDecimal(weiBalance).divide(BigDecimal.TEN.pow(18));
        return matic.setScale(4, java.math.RoundingMode.DOWN).toPlainString();
    }

    /**
     * Nonce 생성
     */
    private String generateNonce() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Nonce 엔트리
     */
    private record NonceEntry(String nonce, long expiresAt) {}
}
