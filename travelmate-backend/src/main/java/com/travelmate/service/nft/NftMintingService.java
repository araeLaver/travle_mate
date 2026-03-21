package com.travelmate.service.nft;

import com.travelmate.dto.nft.MintingDto;
import com.travelmate.entity.nft.MintStatus;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class NftMintingService {

    private final UserNftCollectionRepository userNftCollectionRepository;
    private final PolygonBlockchainService blockchainService;

    /**
     * 민팅 요청
     */
    @Transactional
    public MintingDto.MintingResponse requestMinting(Long userId, Long collectionId, String walletAddress) {
        UserNftCollection collection = userNftCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new BusinessException("NFT 컬렉션을 찾을 수 없습니다."));

        // 권한 확인
        if (!collection.getUser().getId().equals(userId)) {
            throw new BusinessException("권한이 없습니다.");
        }

        // 이미 민팅된 경우
        if (collection.getMintStatus() == MintStatus.MINTED) {
            throw new BusinessException("이미 민팅된 NFT입니다.");
        }

        // 민팅 중인 경우
        if (collection.getMintStatus() == MintStatus.MINTING ||
            collection.getMintStatus() == MintStatus.CONFIRMING) {
            throw new BusinessException("민팅이 진행 중입니다.");
        }

        // 지갑 주소 설정
        if (walletAddress != null && !walletAddress.isEmpty()) {
            collection.setWalletAddress(walletAddress);
        } else if (collection.getWalletAddress() == null || collection.getWalletAddress().isEmpty()) {
            throw new BusinessException("지갑 주소가 필요합니다.");
        }

        // 민팅 상태 업데이트
        collection.setMintStatus(MintStatus.MINTING);
        userNftCollectionRepository.save(collection);

        // 비동기 민팅 시작
        mintAsync(collection);

        return MintingDto.MintingResponse.builder()
                .collectionId(collection.getId())
                .locationId(collection.getLocation().getId())
                .locationName(collection.getLocation().getName())
                .mintStatus(collection.getMintStatus())
                .walletAddress(collection.getWalletAddress())
                .message("민팅이 시작되었습니다.")
                .build();
    }

    /**
     * 비동기 민팅 처리
     */
    @Async
    protected void mintAsync(UserNftCollection collection) {
        try {
            log.info("민팅 시작: collectionId={}, locationName={}",
                    collection.getId(), collection.getLocation().getName());

            // 메타데이터 URI
            String metadataUri = collection.getLocation().getNftMetadataUri();
            if (metadataUri == null || metadataUri.isEmpty()) {
                metadataUri = "ipfs://bafkreigj7klnj34hcdi5bklnj34hcdi5bklnj34hcdi5bklnj34hcdi5";
            }

            // 민팅 실행 (PolygonBlockchainService가 상태 업데이트를 처리함)
            CompletableFuture<PolygonBlockchainService.MintResult> future =
                    blockchainService.mintNftAsync(collection.getId(), collection.getWalletAddress(), metadataUri);

            PolygonBlockchainService.MintResult result = future.get();

            if (result.success()) {
                log.info("민팅 성공: collectionId={}, tokenId={}",
                        collection.getId(), result.tokenId());
            } else {
                log.error("민팅 실패: collectionId={}, error={}",
                        collection.getId(), result.message());
            }

        } catch (Exception e) {
            log.error("민팅 처리 중 오류: collectionId={}", collection.getId(), e);
            blockchainService.updateMintStatus(collection.getId(), MintStatus.FAILED, null, null);
        }
    }

    /**
     * 민팅 상태 조회
     */
    @Transactional(readOnly = true)
    public MintingDto.MintingStatusResponse getMintingStatus(Long userId, Long collectionId) {
        UserNftCollection collection = userNftCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new BusinessException("NFT 컬렉션을 찾을 수 없습니다."));

        // 권한 확인
        if (!collection.getUser().getId().equals(userId)) {
            throw new BusinessException("권한이 없습니다.");
        }

        return MintingDto.MintingStatusResponse.builder()
                .collectionId(collection.getId())
                .locationId(collection.getLocation().getId())
                .locationName(collection.getLocation().getName())
                .nftImageUrl(collection.getLocation().getNftImageUrl())
                .rarity(collection.getLocation().getRarity().name())
                .mintStatus(collection.getMintStatus())
                .tokenId(collection.getTokenId())
                .transactionHash(collection.getTransactionHash())
                .contractAddress(collection.getContractAddress())
                .walletAddress(collection.getWalletAddress())
                .build();
    }

    /**
     * 민팅 가능한 NFT 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<MintingDto.MintableNftResponse> getMintableNfts(Long userId, Pageable pageable) {
        // PENDING 또는 FAILED 상태인 NFT만 조회
        List<MintStatus> mintableStatuses = List.of(MintStatus.PENDING, MintStatus.FAILED);
        Page<UserNftCollection> collections = userNftCollectionRepository
                .findByUserIdAndMintStatusIn(userId, mintableStatuses, pageable);

        return collections.map(this::toMintableNftResponse);
    }

    /**
     * 민팅 재시도
     */
    @Transactional
    public MintingDto.MintingResponse retryMinting(Long userId, Long collectionId) {
        UserNftCollection collection = userNftCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new BusinessException("NFT 컬렉션을 찾을 수 없습니다."));

        // 권한 확인
        if (!collection.getUser().getId().equals(userId)) {
            throw new BusinessException("권한이 없습니다.");
        }

        // FAILED 상태인 경우에만 재시도 가능
        if (collection.getMintStatus() != MintStatus.FAILED) {
            throw new BusinessException("실패한 NFT만 재시도할 수 있습니다.");
        }

        // 지갑 주소 확인
        if (collection.getWalletAddress() == null || collection.getWalletAddress().isEmpty()) {
            throw new BusinessException("지갑 주소가 필요합니다.");
        }

        // 민팅 상태 업데이트
        collection.setMintStatus(MintStatus.MINTING);
        userNftCollectionRepository.save(collection);

        // 비동기 민팅 시작
        mintAsync(collection);

        return MintingDto.MintingResponse.builder()
                .collectionId(collection.getId())
                .locationId(collection.getLocation().getId())
                .locationName(collection.getLocation().getName())
                .mintStatus(collection.getMintStatus())
                .walletAddress(collection.getWalletAddress())
                .message("민팅이 재시도됩니다.")
                .build();
    }

    /**
     * 사용자의 민팅 통계 조회
     */
    @Transactional(readOnly = true)
    public MintingDto.MintingStatsResponse getMintingStats(Long userId) {
        long totalCollected = userNftCollectionRepository.countByUserId(userId);
        long mintedCount = userNftCollectionRepository.countByUserIdAndMintStatus(userId, MintStatus.MINTED);
        long pendingCount = userNftCollectionRepository.countByUserIdAndMintStatus(userId, MintStatus.PENDING);
        long mintingCount = userNftCollectionRepository.countByUserIdAndMintStatusIn(
                userId, List.of(MintStatus.MINTING, MintStatus.CONFIRMING));
        long failedCount = userNftCollectionRepository.countByUserIdAndMintStatus(userId, MintStatus.FAILED);

        return MintingDto.MintingStatsResponse.builder()
                .totalCollected(totalCollected)
                .mintedCount(mintedCount)
                .pendingCount(pendingCount)
                .mintingCount(mintingCount)
                .failedCount(failedCount)
                .build();
    }

    private MintingDto.MintableNftResponse toMintableNftResponse(UserNftCollection collection) {
        return MintingDto.MintableNftResponse.builder()
                .collectionId(collection.getId())
                .locationId(collection.getLocation().getId())
                .locationName(collection.getLocation().getName())
                .locationDescription(collection.getLocation().getDescription())
                .nftImageUrl(collection.getLocation().getNftImageUrl())
                .rarity(collection.getLocation().getRarity().name())
                .mintStatus(collection.getMintStatus())
                .collectedAt(collection.getCollectedAt())
                .earnedPoints(collection.getEarnedPoints())
                .build();
    }
}
