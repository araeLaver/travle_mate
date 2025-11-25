package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", nullable = false)
    private User reportedUser;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReportType reportType;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(length = 1000)
    private String adminNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column
    private LocalDateTime processedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum ReportType {
        SPAM("스팸/광고"),
        HARASSMENT("괴롭힘/비방"),
        INAPPROPRIATE_CONTENT("부적절한 콘텐츠"),
        FRAUD("사기/허위정보"),
        IMPERSONATION("사칭"),
        OTHER("기타");

        private final String description;

        ReportType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum ReportStatus {
        PENDING("처리 대기"),
        REVIEWING("검토 중"),
        RESOLVED("처리 완료"),
        DISMISSED("기각"),
        ESCALATED("상위 검토 필요");

        private final String description;

        ReportStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
