package com.travelmate.service.nft;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.PointTransactionRepository;
import com.travelmate.repository.nft.UserPointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PointService {

    private final UserPointRepository userPointRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final UserRepository userRepository;

    /**
     * 사용자 포인트 잔액 조회
     */
    @Transactional(readOnly = true)
    public NftDto.PointBalanceResponse getBalance(Long userId) {
        UserPoint userPoint = getUserPointOrCreate(userId);

        return NftDto.PointBalanceResponse.builder()
                .totalPoints(userPoint.getTotalPoints())
                .lifetimeEarned(userPoint.getLifetimeEarned())
                .lifetimeSpent(userPoint.getLifetimeSpent())
                .seasonPoints(userPoint.getSeasonPoints())
                .currentRank(userPoint.getCurrentRank())
                .build();
    }

    /**
     * 포인트 획득
     */
    @Transactional
    public NftDto.PointTransactionResponse earnPoints(
            Long userId,
            Long amount,
            PointSource source,
            String description,
            Long referenceId,
            String referenceType) {

        if (amount <= 0) {
            throw new IllegalArgumentException("포인트는 양수여야 합니다");
        }

        // 중복 지급 방지
        if (referenceId != null && referenceType != null) {
            boolean exists = pointTransactionRepository.existsByUserIdAndReferenceIdAndReferenceType(
                    userId, referenceId, referenceType);
            if (exists) {
                throw new IllegalStateException("이미 포인트가 지급된 항목입니다");
            }
        }

        UserPoint userPoint = getUserPointOrCreate(userId);

        // 포인트 추가
        userPoint.earnPoints(amount);
        userPointRepository.save(userPoint);

        // 거래 내역 생성
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        PointTransaction transaction = PointTransaction.builder()
                .user(user)
                .type(PointTransactionType.EARN)
                .amount(amount)
                .balanceAfter(userPoint.getTotalPoints())
                .source(source)
                .description(description)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();

        transaction = pointTransactionRepository.save(transaction);

        log.info("포인트 획득: userId={}, amount={}, source={}, balance={}",
                userId, amount, source, userPoint.getTotalPoints());

        return toTransactionResponse(transaction);
    }

    /**
     * 포인트 사용
     */
    @Transactional
    public NftDto.PointTransactionResponse spendPoints(
            Long userId,
            Long amount,
            PointSource source,
            String description,
            Long referenceId,
            String referenceType) {

        if (amount <= 0) {
            throw new IllegalArgumentException("포인트는 양수여야 합니다");
        }

        UserPoint userPoint = getUserPointOrCreate(userId);

        // 잔액 확인
        if (userPoint.getTotalPoints() < amount) {
            throw new IllegalStateException("포인트가 부족합니다. 잔액: " + userPoint.getTotalPoints());
        }

        // 포인트 차감
        userPoint.spendPoints(amount);
        userPointRepository.save(userPoint);

        // 거래 내역 생성
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        PointTransaction transaction = PointTransaction.builder()
                .user(user)
                .type(PointTransactionType.SPEND)
                .amount(amount)
                .balanceAfter(userPoint.getTotalPoints())
                .source(source)
                .description(description)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();

        transaction = pointTransactionRepository.save(transaction);

        log.info("포인트 사용: userId={}, amount={}, source={}, balance={}",
                userId, amount, source, userPoint.getTotalPoints());

        return toTransactionResponse(transaction);
    }

    /**
     * 포인트 전송
     */
    @Transactional
    public void transferPoints(Long senderId, Long receiverId, Long amount, String message) {
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("자신에게 포인트를 전송할 수 없습니다");
        }

        if (amount <= 0) {
            throw new IllegalArgumentException("전송 포인트는 양수여야 합니다");
        }

        // 송신자 포인트 차감
        UserPoint senderPoint = getUserPointOrCreate(senderId);
        if (senderPoint.getTotalPoints() < amount) {
            throw new IllegalStateException("포인트가 부족합니다. 잔액: " + senderPoint.getTotalPoints());
        }

        senderPoint.spendPoints(amount);
        userPointRepository.save(senderPoint);

        // 수신자 포인트 추가
        UserPoint receiverPoint = getUserPointOrCreate(receiverId);
        receiverPoint.earnPoints(amount);
        userPointRepository.save(receiverPoint);

        // 송신자 거래 내역
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("송신자를 찾을 수 없습니다"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("수신자를 찾을 수 없습니다"));

        String description = String.format("%s님에게 전송", receiver.getNickname());
        if (message != null && !message.isBlank()) {
            description += " - " + message;
        }

        PointTransaction senderTx = PointTransaction.builder()
                .user(sender)
                .type(PointTransactionType.TRANSFER_OUT)
                .amount(amount)
                .balanceAfter(senderPoint.getTotalPoints())
                .source(PointSource.TRANSFER)
                .description(description)
                .referenceId(receiverId)
                .referenceType("USER_TRANSFER")
                .build();
        pointTransactionRepository.save(senderTx);

        // 수신자 거래 내역
        String receiverDescription = String.format("%s님으로부터 수신", sender.getNickname());
        if (message != null && !message.isBlank()) {
            receiverDescription += " - " + message;
        }

        PointTransaction receiverTx = PointTransaction.builder()
                .user(receiver)
                .type(PointTransactionType.TRANSFER_IN)
                .amount(amount)
                .balanceAfter(receiverPoint.getTotalPoints())
                .source(PointSource.TRANSFER)
                .description(receiverDescription)
                .referenceId(senderId)
                .referenceType("USER_TRANSFER")
                .build();
        pointTransactionRepository.save(receiverTx);

        log.info("포인트 전송: sender={}, receiver={}, amount={}", senderId, receiverId, amount);
    }

    /**
     * 거래 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.PointTransactionResponse> getTransactions(Long userId, Pageable pageable) {
        Page<PointTransaction> transactions = pointTransactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return transactions.map(this::toTransactionResponse);
    }

    /**
     * 타입별 거래 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.PointTransactionResponse> getTransactionsByType(
            Long userId, PointTransactionType type, Pageable pageable) {
        Page<PointTransaction> transactions = pointTransactionRepository
                .findByUserIdAndTypeOrderByCreatedAtDesc(userId, type, pageable);
        return transactions.map(this::toTransactionResponse);
    }

    /**
     * 리더보드 조회
     */
    @Transactional(readOnly = true)
    public List<NftDto.LeaderboardEntry> getLeaderboard(int limit) {
        List<UserPoint> topUsers = userPointRepository.findTopByTotalPoints(PageRequest.of(0, limit));

        return topUsers.stream()
                .map(up -> {
                    User user = up.getUser();
                    int rank = userPointRepository.getUserRank(user.getId());
                    return NftDto.LeaderboardEntry.builder()
                            .rank(rank)
                            .userId(user.getId())
                            .nickname(user.getNickname())
                            .profileImageUrl(user.getProfileImageUrl())
                            .totalPoints(up.getTotalPoints())
                            .totalNftsCollected(user.getTotalNftsCollected())
                            .build();
                })
                .toList();
    }

    /**
     * 시즌 리더보드 조회
     */
    @Transactional(readOnly = true)
    public List<NftDto.LeaderboardEntry> getSeasonLeaderboard(int limit) {
        List<UserPoint> topUsers = userPointRepository.findTopBySeasonPoints(PageRequest.of(0, limit));

        return topUsers.stream()
                .map((up) -> {
                    User user = up.getUser();
                    return NftDto.LeaderboardEntry.builder()
                            .rank(topUsers.indexOf(up) + 1)
                            .userId(user.getId())
                            .nickname(user.getNickname())
                            .profileImageUrl(user.getProfileImageUrl())
                            .totalPoints(up.getSeasonPoints())
                            .totalNftsCollected(user.getTotalNftsCollected())
                            .build();
                })
                .toList();
    }

    /**
     * 사용자의 현재 랭킹 조회
     */
    @Transactional(readOnly = true)
    public int getUserRank(Long userId) {
        return userPointRepository.getUserRank(userId);
    }

    /**
     * 포인트 통계 조회
     */
    @Transactional(readOnly = true)
    public NftDto.PointBalanceResponse getPointStats(Long userId) {
        UserPoint userPoint = getUserPointOrCreate(userId);
        int rank = userPointRepository.getUserRank(userId);

        return NftDto.PointBalanceResponse.builder()
                .totalPoints(userPoint.getTotalPoints())
                .lifetimeEarned(userPoint.getLifetimeEarned())
                .lifetimeSpent(userPoint.getLifetimeSpent())
                .seasonPoints(userPoint.getSeasonPoints())
                .currentRank(rank)
                .build();
    }

    /**
     * 잔액 확인 (포인트 사용 전 검증용)
     */
    @Transactional(readOnly = true)
    public boolean hasEnoughPoints(Long userId, Long requiredAmount) {
        UserPoint userPoint = userPointRepository.findByUserId(userId).orElse(null);
        return userPoint != null && userPoint.getTotalPoints() >= requiredAmount;
    }

    // ===== Helper Methods =====

    private UserPoint getUserPointOrCreate(Long userId) {
        return userPointRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
                    return userPointRepository.findOrCreateByUserId(userId, user);
                });
    }

    private NftDto.PointTransactionResponse toTransactionResponse(PointTransaction tx) {
        return NftDto.PointTransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType())
                .amount(tx.getAmount())
                .balanceAfter(tx.getBalanceAfter())
                .source(tx.getSource())
                .description(tx.getDescription())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
