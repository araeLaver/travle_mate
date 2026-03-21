package com.travelmate.service;

import com.travelmate.entity.BetaConfig;
import com.travelmate.entity.BetaInvite;
import com.travelmate.repository.BetaConfigRepository;
import com.travelmate.repository.BetaInviteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BetaInviteService {

    private final BetaInviteRepository betaInviteRepository;
    private final BetaConfigRepository betaConfigRepository;

    public boolean isBetaEnabled() {
        return betaConfigRepository.findById(BetaConfig.BETA_ENABLED)
                .map(config -> "true".equalsIgnoreCase(config.getValue()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public BetaInvite validateInviteCode(String inviteCode) {
        BetaInvite invite = betaInviteRepository.findByInviteCode(inviteCode)
                .orElse(null);

        if (invite == null || !invite.isValid()) {
            return null;
        }

        return invite;
    }

    public void consumeInvite(String inviteCode, Long userId) {
        BetaInvite invite = betaInviteRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 초대 코드입니다."));

        invite.setStatus(BetaInvite.InviteStatus.USED);
        invite.setUsedByUserId(userId);
        invite.setUsedAt(LocalDateTime.now());
        betaInviteRepository.save(invite);
        log.info("베타 초대 코드 사용: {} -> userId={}", inviteCode, userId);
    }

    public List<BetaInvite> generateInvites(int count, String note, LocalDateTime expiresAt) {
        List<BetaInvite> invites = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String code = generateUniqueCode();
            BetaInvite invite = new BetaInvite();
            invite.setInviteCode(code);
            invite.setStatus(BetaInvite.InviteStatus.AVAILABLE);
            invite.setNote(note);
            invite.setExpiresAt(expiresAt);
            invites.add(betaInviteRepository.save(invite));
        }
        log.info("베타 초대 코드 {}개 생성", count);
        return invites;
    }

    public BetaInvite generateInviteForEmail(String email, String note, LocalDateTime expiresAt) {
        BetaInvite invite = new BetaInvite();
        invite.setInviteCode(generateUniqueCode());
        invite.setEmail(email);
        invite.setStatus(BetaInvite.InviteStatus.AVAILABLE);
        invite.setNote(note);
        invite.setExpiresAt(expiresAt);
        BetaInvite saved = betaInviteRepository.save(invite);
        log.info("베타 초대 코드 생성 (이메일: {})", email);
        return saved;
    }

    public void revokeInvite(String inviteCode) {
        BetaInvite invite = betaInviteRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("초대 코드를 찾을 수 없습니다."));

        if (invite.getStatus() == BetaInvite.InviteStatus.USED) {
            throw new IllegalStateException("이미 사용된 초대 코드는 취소할 수 없습니다.");
        }

        invite.setStatus(BetaInvite.InviteStatus.REVOKED);
        betaInviteRepository.save(invite);
        log.info("베타 초대 코드 취소: {}", inviteCode);
    }

    @Transactional(readOnly = true)
    public BetaInviteStats getStats() {
        long available = betaInviteRepository.countAvailable();
        long used = betaInviteRepository.countUsed();
        long total = betaInviteRepository.count();
        boolean betaEnabled = isBetaEnabled();

        return new BetaInviteStats(total, available, used, total - available - used, betaEnabled);
    }

    public void setBetaEnabled(boolean enabled) {
        BetaConfig config = betaConfigRepository.findById(BetaConfig.BETA_ENABLED)
                .orElse(new BetaConfig(BetaConfig.BETA_ENABLED, null));
        config.setValue(String.valueOf(enabled));
        betaConfigRepository.save(config);
        log.info("베타 모드 {}", enabled ? "활성화" : "비활성화");
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        } while (betaInviteRepository.existsByInviteCode(code));
        return code;
    }

    public record BetaInviteStats(long total, long available, long used, long other, boolean betaEnabled) {}
}
