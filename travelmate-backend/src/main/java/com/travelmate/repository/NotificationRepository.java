package com.travelmate.repository;

import com.travelmate.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 사용자별 알림 조회 (페이징)
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // 읽지 않은 알림 조회
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    // 읽지 않은 알림 개수
    long countByUserIdAndIsReadFalse(Long userId);

    // 알림 읽음 처리
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id IN :ids AND n.user.id = :userId")
    int markAsRead(@Param("ids") List<Long> ids, @Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    // 모든 알림 읽음 처리
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    // 오래된 알림 삭제 (정리용)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :beforeDate")
    int deleteOldNotifications(@Param("beforeDate") LocalDateTime beforeDate);

    // 특정 타입의 알림 조회
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, Notification.NotificationType type);
}
