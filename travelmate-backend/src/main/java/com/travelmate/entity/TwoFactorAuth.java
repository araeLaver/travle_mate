package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "two_factor_auth", indexes = {
    @Index(name = "idx_2fa_user_id", columnList = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorAuth {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "secret_key", nullable = false, length = 32)
    private String secretKey;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, length = 20)
    private TwoFactorMethod method;
    
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = false;
    
    @Column(name = "backup_codes", columnDefinition = "TEXT")
    private String backupCodes; // JSON array of encrypted backup codes
    
    @Column(name = "phone_number", length = 20)
    private String phoneNumber; // For SMS method
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum TwoFactorMethod {
        TOTP,      // Time-based One-Time Password (Google Authenticator)
        SMS,       // SMS verification
        EMAIL      // Email verification
    }
}