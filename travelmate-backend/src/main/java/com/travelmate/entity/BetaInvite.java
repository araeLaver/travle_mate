package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "beta_invites", indexes = {
    @Index(name = "idx_beta_invites_code", columnList = "invite_code", unique = true),
    @Index(name = "idx_beta_invites_email", columnList = "email"),
    @Index(name = "idx_beta_invites_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BetaInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invite_code", unique = true, nullable = false, length = 64)
    private String inviteCode;

    @Column(name = "email", length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InviteStatus status = InviteStatus.AVAILABLE;

    @Column(name = "used_by_user_id")
    private Long usedByUserId;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "note", length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum InviteStatus {
        AVAILABLE,
        USED,
        EXPIRED,
        REVOKED
    }

    public boolean isValid() {
        if (status != InviteStatus.AVAILABLE) return false;
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) return false;
        return true;
    }
}
