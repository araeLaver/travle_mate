package com.travelmate.service.nft;

import com.travelmate.config.BlockchainConfig;
import com.travelmate.entity.nft.MintStatus;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthGetTransactionCount;
import org.web3j.protocol.core.methods.response.EthGetTransactionReceipt;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class PolygonBlockchainService {

    private final Web3j web3j;
    private final BlockchainConfig blockchainConfig;
    private final UserNftCollectionRepository nftCollectionRepository;

    private static final BigInteger GAS_LIMIT = BigInteger.valueOf(300000);
    private static final BigInteger GAS_PRICE = BigInteger.valueOf(30_000_000_000L); // 30 Gwei

    /**
     * NFT 민팅 (비동기 처리)
     */
    @Async
    @Transactional
    public CompletableFuture<MintResult> mintNftAsync(Long nftCollectionId, String recipientAddress, String metadataUri) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return mintNft(nftCollectionId, recipientAddress, metadataUri);
            } catch (Exception e) {
                log.error("NFT 민팅 실패: nftCollectionId={}", nftCollectionId, e);
                updateMintStatus(nftCollectionId, MintStatus.FAILED, null, null);
                return new MintResult(false, null, null, e.getMessage());
            }
        });
    }

    /**
     * NFT 민팅 실행
     */
    public MintResult mintNft(Long nftCollectionId, String recipientAddress, String metadataUri) {
        if (!blockchainConfig.isBlockchainEnabled()) {
            log.info("블록체인이 비활성화되어 있습니다. 로컬 민팅만 수행합니다.");
            // 로컬 민팅 (블록체인 없이)
            String mockTokenId = "LOCAL-" + System.currentTimeMillis();
            updateMintStatus(nftCollectionId, MintStatus.MINTED, mockTokenId, "local-tx-" + mockTokenId);
            return new MintResult(true, mockTokenId, "local-tx-" + mockTokenId, "로컬 민팅 완료");
        }

        try {
            // 민팅 상태 업데이트: PENDING -> MINTING
            updateMintStatus(nftCollectionId, MintStatus.MINTING, null, null);

            String privateKey = blockchainConfig.getPrivateKey();
            if (privateKey == null || privateKey.isBlank()) {
                throw new IllegalStateException("블록체인 개인키가 설정되지 않았습니다.");
            }

            Credentials credentials = Credentials.create(privateKey);
            String contractAddress = blockchainConfig.getContractAddress();

            // Nonce 조회
            EthGetTransactionCount ethGetTransactionCount = web3j.ethGetTransactionCount(
                    credentials.getAddress(), DefaultBlockParameterName.LATEST).send();
            BigInteger nonce = ethGetTransactionCount.getTransactionCount();

            // mintNFT 함수 호출 데이터 생성
            Function function = new Function(
                    "mintNFT",
                    Arrays.asList(new Address(recipientAddress), new Utf8String(metadataUri)),
                    Collections.singletonList(new TypeReference<Uint256>() {})
            );
            String encodedFunction = FunctionEncoder.encode(function);

            // Raw Transaction 생성
            RawTransaction rawTransaction = RawTransaction.createTransaction(
                    nonce,
                    GAS_PRICE,
                    GAS_LIMIT,
                    contractAddress,
                    encodedFunction
            );

            // 트랜잭션 서명
            byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, blockchainConfig.getChainId(), credentials);
            String hexValue = Numeric.toHexString(signedMessage);

            // 트랜잭션 전송
            EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).send();

            if (ethSendTransaction.hasError()) {
                throw new RuntimeException("트랜잭션 전송 실패: " + ethSendTransaction.getError().getMessage());
            }

            String transactionHash = ethSendTransaction.getTransactionHash();
            log.info("NFT 민팅 트랜잭션 전송: txHash={}", transactionHash);

            // 트랜잭션 확인 대기 (최대 2분)
            Optional<TransactionReceipt> receiptOpt = waitForTransactionReceipt(transactionHash, 120);

            if (receiptOpt.isPresent()) {
                TransactionReceipt receipt = receiptOpt.get();
                if (receipt.isStatusOK()) {
                    // Token ID 추출 (이벤트 로그에서)
                    String tokenId = extractTokenIdFromReceipt(receipt);
                    updateMintStatus(nftCollectionId, MintStatus.MINTED, tokenId, transactionHash);
                    log.info("NFT 민팅 성공: tokenId={}, txHash={}", tokenId, transactionHash);
                    return new MintResult(true, tokenId, transactionHash, "NFT 민팅 성공");
                } else {
                    updateMintStatus(nftCollectionId, MintStatus.FAILED, null, transactionHash);
                    return new MintResult(false, null, transactionHash, "트랜잭션 실패");
                }
            } else {
                // 트랜잭션 확인 타임아웃 - 상태를 CONFIRMING으로 유지
                updateMintStatus(nftCollectionId, MintStatus.CONFIRMING, null, transactionHash);
                return new MintResult(false, null, transactionHash, "트랜잭션 확인 대기 중");
            }

        } catch (Exception e) {
            log.error("NFT 민팅 중 오류 발생", e);
            updateMintStatus(nftCollectionId, MintStatus.FAILED, null, null);
            return new MintResult(false, null, null, e.getMessage());
        }
    }

    /**
     * 트랜잭션 영수증 대기
     */
    private Optional<TransactionReceipt> waitForTransactionReceipt(String transactionHash, int maxAttempts) {
        for (int i = 0; i < maxAttempts; i++) {
            try {
                EthGetTransactionReceipt receiptResponse = web3j.ethGetTransactionReceipt(transactionHash).send();
                if (receiptResponse.getTransactionReceipt().isPresent()) {
                    return receiptResponse.getTransactionReceipt();
                }
                Thread.sleep(1000); // 1초 대기
            } catch (Exception e) {
                log.warn("트랜잭션 영수증 조회 실패: {}", e.getMessage());
            }
        }
        return Optional.empty();
    }

    /**
     * 영수증에서 Token ID 추출
     */
    private String extractTokenIdFromReceipt(TransactionReceipt receipt) {
        // Transfer 이벤트 로그에서 tokenId 추출
        // ERC721 Transfer(address from, address to, uint256 tokenId)
        if (receipt.getLogs() != null && !receipt.getLogs().isEmpty()) {
            for (var logEntry : receipt.getLogs()) {
                if (logEntry.getTopics().size() >= 4) {
                    // topics[3]가 tokenId
                    String tokenIdHex = logEntry.getTopics().get(3);
                    BigInteger tokenId = Numeric.toBigInt(tokenIdHex);
                    return tokenId.toString();
                }
            }
        }
        return null;
    }

    /**
     * 민팅 상태 업데이트
     */
    @Transactional
    public void updateMintStatus(Long nftCollectionId, MintStatus status, String tokenId, String transactionHash) {
        nftCollectionRepository.findById(nftCollectionId).ifPresent(nft -> {
            nft.setMintStatus(status);
            if (tokenId != null) {
                nft.setTokenId(tokenId);
            }
            if (transactionHash != null) {
                nft.setTransactionHash(transactionHash);
            }
            nftCollectionRepository.save(nft);
        });
    }

    /**
     * 지갑 잔액 조회 (MATIC)
     */
    public BigInteger getBalance(String walletAddress) {
        try {
            return web3j.ethGetBalance(walletAddress, DefaultBlockParameterName.LATEST)
                    .send()
                    .getBalance();
        } catch (Exception e) {
            log.error("잔액 조회 실패: {}", e.getMessage());
            return BigInteger.ZERO;
        }
    }

    /**
     * NFT 소유자 조회
     */
    public String getOwnerOf(String tokenId) {
        if (!blockchainConfig.isBlockchainEnabled()) {
            return null;
        }

        try {
            Function function = new Function(
                    "ownerOf",
                    Collections.singletonList(new Uint256(new BigInteger(tokenId))),
                    Collections.singletonList(new TypeReference<Address>() {})
            );

            String encodedFunction = FunctionEncoder.encode(function);
            org.web3j.protocol.core.methods.response.EthCall response = web3j.ethCall(
                    org.web3j.protocol.core.methods.request.Transaction.createEthCallTransaction(
                            null, blockchainConfig.getContractAddress(), encodedFunction),
                    DefaultBlockParameterName.LATEST
            ).send();

            List<Type> results = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
            if (!results.isEmpty()) {
                return ((Address) results.get(0)).getValue();
            }
        } catch (Exception e) {
            log.error("NFT 소유자 조회 실패: tokenId={}", tokenId, e);
        }
        return null;
    }

    /**
     * NFT 전송
     */
    public String transferNft(String fromAddress, String toAddress, String tokenId, String privateKey) {
        if (!blockchainConfig.isBlockchainEnabled()) {
            log.info("블록체인이 비활성화되어 있습니다.");
            return "local-transfer-" + System.currentTimeMillis();
        }

        try {
            Credentials credentials = Credentials.create(privateKey);
            String contractAddress = blockchainConfig.getContractAddress();

            EthGetTransactionCount ethGetTransactionCount = web3j.ethGetTransactionCount(
                    credentials.getAddress(), DefaultBlockParameterName.LATEST).send();
            BigInteger nonce = ethGetTransactionCount.getTransactionCount();

            Function function = new Function(
                    "safeTransferFrom",
                    Arrays.asList(
                            new Address(fromAddress),
                            new Address(toAddress),
                            new Uint256(new BigInteger(tokenId))
                    ),
                    Collections.emptyList()
            );

            String encodedFunction = FunctionEncoder.encode(function);

            RawTransaction rawTransaction = RawTransaction.createTransaction(
                    nonce,
                    GAS_PRICE,
                    GAS_LIMIT,
                    contractAddress,
                    encodedFunction
            );

            byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, blockchainConfig.getChainId(), credentials);
            String hexValue = Numeric.toHexString(signedMessage);

            EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).send();

            if (ethSendTransaction.hasError()) {
                throw new RuntimeException("NFT 전송 실패: " + ethSendTransaction.getError().getMessage());
            }

            return ethSendTransaction.getTransactionHash();

        } catch (Exception e) {
            log.error("NFT 전송 중 오류 발생", e);
            throw new RuntimeException("NFT 전송 실패", e);
        }
    }

    /**
     * 서명 검증 (지갑 연동용)
     */
    public boolean verifySignature(String message, String signature, String expectedAddress) {
        try {
            // 서명에서 주소 복구
            byte[] messageHash = org.web3j.crypto.Hash.sha3(
                    ("\u0019Ethereum Signed Message:\n" + message.length() + message).getBytes()
            );

            // 서명 분해 (r, s, v)
            byte[] signatureBytes = Numeric.hexStringToByteArray(signature);
            if (signatureBytes.length != 65) {
                return false;
            }

            byte v = signatureBytes[64];
            if (v < 27) {
                v += 27;
            }

            byte[] r = new byte[32];
            byte[] s = new byte[32];
            System.arraycopy(signatureBytes, 0, r, 0, 32);
            System.arraycopy(signatureBytes, 32, s, 0, 32);

            org.web3j.crypto.Sign.SignatureData signatureData =
                    new org.web3j.crypto.Sign.SignatureData(v, r, s);

            BigInteger publicKey = org.web3j.crypto.Sign.signedMessageHashToKey(messageHash, signatureData);
            String recoveredAddress = "0x" + org.web3j.crypto.Keys.getAddress(publicKey);

            return recoveredAddress.equalsIgnoreCase(expectedAddress);

        } catch (Exception e) {
            log.error("서명 검증 실패", e);
            return false;
        }
    }

    /**
     * 민팅 결과 DTO
     */
    public record MintResult(
            boolean success,
            String tokenId,
            String transactionHash,
            String message
    ) {}
}
