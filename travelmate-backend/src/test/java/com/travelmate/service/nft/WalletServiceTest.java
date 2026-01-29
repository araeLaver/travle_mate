package com.travelmate.service.nft;

import com.travelmate.config.BlockchainConfig;
import com.travelmate.dto.WalletDto;
import com.travelmate.entity.User;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigInteger;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WalletService 테스트")
class WalletServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserNftCollectionRepository nftCollectionRepository;

    @Mock
    private PolygonBlockchainService blockchainService;

    @Mock
    private BlockchainConfig blockchainConfig;

    @InjectMocks
    private WalletService walletService;

    private User testUser;
    private static final String TEST_WALLET_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD58";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("testuser");
    }

    @Nested
    @DisplayName("generateSignMessage 테스트")
    class GenerateSignMessageTest {

        @Test
        @DisplayName("성공 - 서명 메시지 생성")
        void generateSignMessage_Success() {
            // When
            WalletDto.SignMessageResponse response = walletService.generateSignMessage(TEST_WALLET_ADDRESS);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getMessage()).contains(TEST_WALLET_ADDRESS);
            assertThat(response.getMessage()).contains("Fryndo 지갑 연결 인증");
            assertThat(response.getNonce()).isNotNull();
            assertThat(response.getNonce()).isNotEmpty();
            assertThat(response.getTimestamp()).isGreaterThan(0);
            assertThat(response.getExpiresAt()).isGreaterThan(response.getTimestamp());
        }

        @Test
        @DisplayName("성공 - Nonce 저장 확인")
        void generateSignMessage_NonceStored() {
            // When
            walletService.generateSignMessage(TEST_WALLET_ADDRESS);

            // Then
            assertThat(walletService.getNonceStoreSize()).isGreaterThan(0);
        }

        @Test
        @DisplayName("성공 - 같은 주소로 재요청시 Nonce 갱신")
        void generateSignMessage_NonceUpdated() {
            // Given
            WalletDto.SignMessageResponse first = walletService.generateSignMessage(TEST_WALLET_ADDRESS);

            // When
            WalletDto.SignMessageResponse second = walletService.generateSignMessage(TEST_WALLET_ADDRESS);

            // Then
            assertThat(second.getNonce()).isNotEqualTo(first.getNonce());
        }
    }

    @Nested
    @DisplayName("verifyAndConnect 테스트")
    class VerifyAndConnectTest {

        @Test
        @DisplayName("성공 - 지갑 연결")
        void verifyAndConnect_Success() {
            // Given - 먼저 서명 메시지 생성
            WalletDto.SignMessageResponse signMessage = walletService.generateSignMessage(TEST_WALLET_ADDRESS);

            WalletDto.VerifySignatureRequest request = new WalletDto.VerifySignatureRequest(
                    TEST_WALLET_ADDRESS,
                    signMessage.getMessage(),
                    "0xvalid_signature"
            );

            when(blockchainService.verifySignature(anyString(), anyString(), anyString())).thenReturn(true);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            when(blockchainService.getBalance(anyString())).thenReturn(BigInteger.valueOf(1000000000000000000L));
            when(blockchainConfig.getChainId()).thenReturn(80002L);
            when(nftCollectionRepository.countByUserIdAndWalletAddress(anyLong(), anyString())).thenReturn(5);

            // When
            WalletDto.WalletConnectionResponse response = walletService.verifyAndConnect(1L, request);

            // Then
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getWalletAddress()).isEqualTo(TEST_WALLET_ADDRESS);
            assertThat(response.isVerified()).isTrue();
            assertThat(response.getMessage()).contains("성공");

            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("실패 - Nonce 없음 (요청 만료)")
        void verifyAndConnect_NoNonce() {
            // Given - Nonce 생성 없이 바로 연결 시도
            WalletDto.VerifySignatureRequest request = new WalletDto.VerifySignatureRequest(
                    "0xUnknownAddress1234567890123456789012345678",
                    "message",
                    "0xsignature"
            );

            // When
            WalletDto.WalletConnectionResponse response = walletService.verifyAndConnect(1L, request);

            // Then
            assertThat(response.isSuccess()).isFalse();
            assertThat(response.getMessage()).contains("만료");
        }

        @Test
        @DisplayName("실패 - 서명 검증 실패")
        void verifyAndConnect_InvalidSignature() {
            // Given
            WalletDto.SignMessageResponse signMessage = walletService.generateSignMessage(TEST_WALLET_ADDRESS);

            WalletDto.VerifySignatureRequest request = new WalletDto.VerifySignatureRequest(
                    TEST_WALLET_ADDRESS,
                    signMessage.getMessage(),
                    "0xinvalid_signature"
            );

            when(blockchainService.verifySignature(anyString(), anyString(), anyString())).thenReturn(false);

            // When
            WalletDto.WalletConnectionResponse response = walletService.verifyAndConnect(1L, request);

            // Then
            assertThat(response.isSuccess()).isFalse();
            assertThat(response.getMessage()).contains("서명 검증에 실패");
        }

        @Test
        @DisplayName("실패 - Nonce 만료")
        void verifyAndConnect_ExpiredNonce() throws Exception {
            // Given - 만료된 Nonce를 직접 주입
            Map<String, Object> nonceStore = new ConcurrentHashMap<>();

            // NonceEntry record를 reflection으로 생성
            Class<?> nonceEntryClass = Class.forName("com.travelmate.service.nft.WalletService$NonceEntry");
            var constructor = nonceEntryClass.getDeclaredConstructors()[0];
            constructor.setAccessible(true);
            Object expiredNonce = constructor.newInstance("expired_nonce", Instant.now().getEpochSecond() - 1000);
            nonceStore.put(TEST_WALLET_ADDRESS.toLowerCase(), expiredNonce);

            ReflectionTestUtils.setField(walletService, "nonceStore", nonceStore);

            WalletDto.VerifySignatureRequest request = new WalletDto.VerifySignatureRequest(
                    TEST_WALLET_ADDRESS,
                    "message",
                    "0xsignature"
            );

            // When
            WalletDto.WalletConnectionResponse response = walletService.verifyAndConnect(1L, request);

            // Then
            assertThat(response.isSuccess()).isFalse();
            assertThat(response.getMessage()).contains("만료");
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void verifyAndConnect_UserNotFound() {
            // Given
            WalletDto.SignMessageResponse signMessage = walletService.generateSignMessage(TEST_WALLET_ADDRESS);

            WalletDto.VerifySignatureRequest request = new WalletDto.VerifySignatureRequest(
                    TEST_WALLET_ADDRESS,
                    signMessage.getMessage(),
                    "0xvalid_signature"
            );

            when(blockchainService.verifySignature(anyString(), anyString(), anyString())).thenReturn(true);
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> walletService.verifyAndConnect(1L, request))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("getWalletStatus 테스트")
    class GetWalletStatusTest {

        @Test
        @DisplayName("성공 - 연결된 지갑 상태 조회")
        void getWalletStatus_Connected() {
            // Given
            testUser.setPolygonWalletAddress(TEST_WALLET_ADDRESS);
            testUser.setIsWalletVerified(true);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(blockchainService.getBalance(TEST_WALLET_ADDRESS)).thenReturn(BigInteger.valueOf(1000000000000000000L));
            when(blockchainConfig.getChainId()).thenReturn(80002L);
            when(nftCollectionRepository.countByUserIdAndWalletAddress(1L, TEST_WALLET_ADDRESS)).thenReturn(10);

            // When
            WalletDto.WalletStatusResponse response = walletService.getWalletStatus(1L);

            // Then
            assertThat(response.isConnected()).isTrue();
            assertThat(response.isVerified()).isTrue();
            assertThat(response.getWalletAddress()).isEqualTo(TEST_WALLET_ADDRESS);
            assertThat(response.getWalletInfo()).isNotNull();
            assertThat(response.getWalletInfo().getNftCount()).isEqualTo(10);
        }

        @Test
        @DisplayName("성공 - 연결되지 않은 지갑 상태")
        void getWalletStatus_NotConnected() {
            // Given
            testUser.setPolygonWalletAddress(null);
            testUser.setIsWalletVerified(false);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // When
            WalletDto.WalletStatusResponse response = walletService.getWalletStatus(1L);

            // Then
            assertThat(response.isConnected()).isFalse();
            assertThat(response.isVerified()).isFalse();
            assertThat(response.getWalletAddress()).isNull();
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void getWalletStatus_UserNotFound() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> walletService.getWalletStatus(1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("disconnectWallet 테스트")
    class DisconnectWalletTest {

        @Test
        @DisplayName("성공 - 지갑 연결 해제")
        void disconnectWallet_Success() {
            // Given
            testUser.setPolygonWalletAddress(TEST_WALLET_ADDRESS);
            testUser.setIsWalletVerified(true);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // When
            WalletDto.DisconnectResponse response = walletService.disconnectWallet(1L);

            // Then
            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getMessage()).contains("해제");

            verify(userRepository).save(argThat(user ->
                    user.getPolygonWalletAddress() == null &&
                    Boolean.FALSE.equals(user.getIsWalletVerified())
            ));
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void disconnectWallet_UserNotFound() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> walletService.disconnectWallet(1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("getNetworkInfo 테스트")
    class GetNetworkInfoTest {

        @Test
        @DisplayName("성공 - Polygon Mainnet 정보")
        void getNetworkInfo_Mainnet() {
            // Given
            when(blockchainConfig.getChainId()).thenReturn(137L);
            when(blockchainConfig.getPolygonRpcUrl()).thenReturn("https://polygon-rpc.com");
            when(blockchainConfig.getContractAddress()).thenReturn("0xContractAddress");

            // When
            WalletDto.NetworkInfo info = walletService.getNetworkInfo();

            // Then
            assertThat(info.getName()).isEqualTo("Polygon Mainnet");
            assertThat(info.getChainId()).isEqualTo(137L);
            assertThat(info.getCurrencySymbol()).isEqualTo("MATIC");
            assertThat(info.getBlockExplorerUrl()).isEqualTo("https://polygonscan.com");
            assertThat(info.isTestnet()).isFalse();
        }

        @Test
        @DisplayName("성공 - Polygon Amoy Testnet 정보")
        void getNetworkInfo_AmoyTestnet() {
            // Given
            when(blockchainConfig.getChainId()).thenReturn(80002L);
            when(blockchainConfig.getPolygonRpcUrl()).thenReturn("https://rpc-amoy.polygon.technology");
            when(blockchainConfig.getContractAddress()).thenReturn("0xContractAddress");

            // When
            WalletDto.NetworkInfo info = walletService.getNetworkInfo();

            // Then
            assertThat(info.getName()).isEqualTo("Polygon Amoy Testnet");
            assertThat(info.getChainId()).isEqualTo(80002L);
            assertThat(info.getBlockExplorerUrl()).isEqualTo("https://amoy.polygonscan.com");
            assertThat(info.isTestnet()).isTrue();
        }

        @Test
        @DisplayName("성공 - Polygon Mumbai Testnet 정보")
        void getNetworkInfo_MumbaiTestnet() {
            // Given
            when(blockchainConfig.getChainId()).thenReturn(80001L);
            when(blockchainConfig.getPolygonRpcUrl()).thenReturn("https://rpc-mumbai.polygon.technology");
            when(blockchainConfig.getContractAddress()).thenReturn("0xContractAddress");

            // When
            WalletDto.NetworkInfo info = walletService.getNetworkInfo();

            // Then
            assertThat(info.getName()).isEqualTo("Polygon Mumbai Testnet");
            assertThat(info.getChainId()).isEqualTo(80001L);
            assertThat(info.getBlockExplorerUrl()).isEqualTo("https://mumbai.polygonscan.com");
            assertThat(info.isTestnet()).isTrue();
        }

        @Test
        @DisplayName("성공 - Unknown Network")
        void getNetworkInfo_Unknown() {
            // Given
            when(blockchainConfig.getChainId()).thenReturn(99999L);
            when(blockchainConfig.getPolygonRpcUrl()).thenReturn("https://unknown-rpc.com");
            when(blockchainConfig.getContractAddress()).thenReturn("0xContractAddress");

            // When
            WalletDto.NetworkInfo info = walletService.getNetworkInfo();

            // Then
            assertThat(info.getName()).isEqualTo("Unknown Network");
            assertThat(info.isTestnet()).isTrue();
        }
    }

    @Nested
    @DisplayName("cleanupExpiredNonces 테스트")
    class CleanupExpiredNoncesTest {

        @Test
        @DisplayName("성공 - 만료된 Nonce 정리")
        void cleanupExpiredNonces_Success() throws Exception {
            // Given - 만료된 Nonce와 유효한 Nonce 모두 생성
            Map<String, Object> nonceStore = new ConcurrentHashMap<>();

            Class<?> nonceEntryClass = Class.forName("com.travelmate.service.nft.WalletService$NonceEntry");
            var constructor = nonceEntryClass.getDeclaredConstructors()[0];
            constructor.setAccessible(true);

            // 만료된 Nonce
            Object expiredNonce = constructor.newInstance("expired", Instant.now().getEpochSecond() - 1000);
            nonceStore.put("0xexpired", expiredNonce);

            // 유효한 Nonce
            Object validNonce = constructor.newInstance("valid", Instant.now().getEpochSecond() + 1000);
            nonceStore.put("0xvalid", validNonce);

            ReflectionTestUtils.setField(walletService, "nonceStore", nonceStore);

            // When
            walletService.cleanupExpiredNonces();

            // Then
            assertThat(walletService.getNonceStoreSize()).isEqualTo(1);
        }

        @Test
        @DisplayName("성공 - 정리할 Nonce 없음")
        void cleanupExpiredNonces_NoExpired() {
            // Given - 유효한 Nonce만 생성
            walletService.generateSignMessage(TEST_WALLET_ADDRESS);
            int beforeSize = walletService.getNonceStoreSize();

            // When
            walletService.cleanupExpiredNonces();

            // Then
            assertThat(walletService.getNonceStoreSize()).isEqualTo(beforeSize);
        }
    }

    @Nested
    @DisplayName("getNonceStoreSize 테스트")
    class GetNonceStoreSizeTest {

        @Test
        @DisplayName("성공 - 빈 저장소")
        void getNonceStoreSize_Empty() {
            // Given - 새로운 서비스 인스턴스는 빈 저장소를 가짐
            Map<String, Object> emptyStore = new ConcurrentHashMap<>();
            ReflectionTestUtils.setField(walletService, "nonceStore", emptyStore);

            // When
            int size = walletService.getNonceStoreSize();

            // Then
            assertThat(size).isEqualTo(0);
        }

        @Test
        @DisplayName("성공 - Nonce 추가 후 크기 확인")
        void getNonceStoreSize_AfterGenerate() {
            // Given
            walletService.generateSignMessage(TEST_WALLET_ADDRESS);
            walletService.generateSignMessage("0xAnotherAddress12345678901234567890123456");

            // When
            int size = walletService.getNonceStoreSize();

            // Then
            assertThat(size).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("Balance 포맷팅 테스트")
    class BalanceFormattingTest {

        @Test
        @DisplayName("성공 - Wei를 MATIC으로 변환")
        void formatBalance_Success() {
            // Given
            testUser.setPolygonWalletAddress(TEST_WALLET_ADDRESS);
            testUser.setIsWalletVerified(true);

            // 1.5 MATIC = 1.5 * 10^18 Wei
            BigInteger balanceWei = new BigInteger("1500000000000000000");

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(blockchainService.getBalance(TEST_WALLET_ADDRESS)).thenReturn(balanceWei);
            when(blockchainConfig.getChainId()).thenReturn(80002L);
            when(nftCollectionRepository.countByUserIdAndWalletAddress(1L, TEST_WALLET_ADDRESS)).thenReturn(0);

            // When
            WalletDto.WalletStatusResponse response = walletService.getWalletStatus(1L);

            // Then
            assertThat(response.getWalletInfo().getBalanceFormatted()).contains("1.5");
            assertThat(response.getWalletInfo().getBalanceFormatted()).contains("MATIC");
        }

        @Test
        @DisplayName("성공 - 0 잔액 포맷팅")
        void formatBalance_Zero() {
            // Given
            testUser.setPolygonWalletAddress(TEST_WALLET_ADDRESS);
            testUser.setIsWalletVerified(true);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(blockchainService.getBalance(TEST_WALLET_ADDRESS)).thenReturn(BigInteger.ZERO);
            when(blockchainConfig.getChainId()).thenReturn(80002L);
            when(nftCollectionRepository.countByUserIdAndWalletAddress(1L, TEST_WALLET_ADDRESS)).thenReturn(0);

            // When
            WalletDto.WalletStatusResponse response = walletService.getWalletStatus(1L);

            // Then
            assertThat(response.getWalletInfo().getBalanceFormatted()).contains("0");
        }
    }
}
