package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity for storing device tokens for push notifications
 */
@Entity
@Table(name = "device_tokens",
        indexes = {
                @Index(name = "idx_device_token_user", columnList = "user_id"),
                @Index(name = "idx_device_token_token", columnList = "token", unique = true)
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceType deviceType;

    @Column(length = 100)
    private String deviceModel;

    @Column(length = 50)
    private String osVersion;

    @Column(length = 50)
    private String appVersion;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime lastUsedAt;

    public enum DeviceType {
        ANDROID,
        IOS,
        WEB
    }

    public void updateLastUsed() {
        this.lastUsedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.active = false;
    }
}
