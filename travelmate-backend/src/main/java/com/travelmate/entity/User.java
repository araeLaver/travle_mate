package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_nickname", columnList = "nickname"),
    @Index(name = "idx_users_location", columnList = "current_latitude, current_longitude"),
    @Index(name = "idx_users_active", columnList = "is_active"),
    @Index(name = "idx_users_matching_enabled", columnList = "is_matching_enabled"),
    @Index(name = "idx_users_travel_style", columnList = "travel_style"),
    @Index(name = "idx_users_last_activity", columnList = "last_activity_at"),
    @Index(name = "idx_users_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;
    
    @Column(name = "password", nullable = false)
    private String password;
    
    @Column(name = "nickname", unique = true, nullable = false, length = 50)
    private String nickname;
    
    @Column(name = "full_name", nullable = true, length = 100)
    private String fullName;
    
    @Column(name = "age")
    private Integer age;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private Gender gender;
    
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;
    
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "travel_style", length = 50)
    private TravelStyle travelStyle;
    
    @ElementCollection
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "interest")
    private List<String> interests;
    
    @ElementCollection
    @CollectionTable(name = "user_languages", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "language")
    private List<String> languages;
    
    @Column(name = "current_latitude")
    private Double currentLatitude;
    
    @Column(name = "current_longitude")
    private Double currentLongitude;
    
    @Column(name = "is_location_enabled", nullable = false)
    private Boolean isLocationEnabled = false;
    
    @Column(name = "is_matching_enabled", nullable = false)
    private Boolean isMatchingEnabled = false;
    
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    @Column(name = "phone_verified", nullable = false)
    private Boolean phoneVerified = false;
    
    @Column(name = "fcm_token")
    private String fcmToken;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "is_email_verified", nullable = false)
    private Boolean isEmailVerified = false;
    
    @Column(name = "rating")
    private Double rating = 0.0;
    
    @Column(name = "review_count")
    private Integer reviewCount = 0;
    
    @Column(name = "login_attempts", nullable = false)
    private Integer loginAttempts = 0;
    
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;
    
    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;
    
    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;
    
    @Column(name = "deletion_requested_at")
    private LocalDateTime deletionRequestedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", length = 20)
    private AuthProvider provider = AuthProvider.LOCAL;
    
    @Column(name = "provider_id", length = 100)
    private String providerId;
    
    @Column(name = "email_notification_enabled", nullable = false)
    private Boolean emailNotificationEnabled = true;
    
    @Column(name = "push_notification_enabled", nullable = false)
    private Boolean pushNotificationEnabled = true;
    
    @Column(name = "privacy_profile_visible", nullable = false)
    private Boolean privacyProfileVisible = true;
    
    @Column(name = "privacy_location_visible", nullable = false)
    private Boolean privacyLocationVisible = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role = Role.USER;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RefreshToken> refreshTokens;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<LoginHistory> loginHistories;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private TwoFactorAuth twoFactorAuth;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum TravelStyle {
        ADVENTURE, CULTURE, FOOD, RELAXATION, NATURE, SHOPPING
    }
    
    public enum Gender {
        MALE, FEMALE, OTHER
    }
    
    public enum AuthProvider {
        LOCAL, GOOGLE, KAKAO, NAVER, FACEBOOK
    }

    public enum Role {
        USER, ADMIN, MODERATOR
    }
    
    public boolean isAccountLocked() {
        return lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);
    }
    
    public void incrementLoginAttempts() {
        this.loginAttempts = (this.loginAttempts == null ? 0 : this.loginAttempts) + 1;
        if (this.loginAttempts >= 5) {
            this.lockedUntil = LocalDateTime.now().plusMinutes(30);
        }
    }
    
    public void resetLoginAttempts() {
        this.loginAttempts = 0;
        this.lockedUntil = null;
    }
    
    public boolean isPasswordExpired() {
        if (passwordChangedAt == null) {
            return true;
        }
        return passwordChangedAt.isBefore(LocalDateTime.now().minusDays(90));
    }

    public Double getRatingAverage() {
        return this.rating;
    }

    public String getName() {
        return this.fullName;
    }
}