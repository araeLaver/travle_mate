import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useRealtimeNotifications,
} from '../hooks/useNotifications';
import './NotificationCenter.css';

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);

  const { data: notifications, isLoading } = useNotifications(page, 20);
  const { data: unreadCount } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const { realtimeNotifications, clearRealtimeNotifications } = useRealtimeNotifications();

  // 모든 알림 (실시간 + 서버)
  const allNotifications = [
    ...realtimeNotifications,
    ...(notifications?.content || []),
  ];

  const handleNotificationClick = (notification: any) => {
    // 읽음 처리
    if (!notification.isRead) {
      markAsReadMutation.mutate([notification.id]);
    }

    // 액션 URL로 이동
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
    clearRealtimeNotifications();
  };

  const handleDeleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(id);
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      GROUP_INVITE: '👥',
      GROUP_JOIN: '➕',
      GROUP_LEAVE: '➖',
      GROUP_UPDATE: '📝',
      NEW_MESSAGE: '💬',
      MENTION: '@',
      COMMENT: '💭',
      LIKE: '❤️',
      REVIEW: '⭐',
      SYSTEM: '🔔',
    };
    return icons[type] || '📢';
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="notification-center">
      {/* 알림 벨 아이콘 */}
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {(unreadCount || 0) > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>알림</h3>
              {(unreadCount || 0) > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                >
                  모두 읽음
                </button>
              )}
            </div>

            <div className="notification-list">
              {isLoading && <div className="loading">로딩 중...</div>}

              {!isLoading && allNotifications.length === 0 && (
                <div className="empty-notifications">
                  <p>새로운 알림이 없습니다.</p>
                </div>
              )}

              {allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.isRead ? 'read' : 'unread'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {formatTimestamp(notification.createdAt)}
                    </div>
                  </div>

                  <button
                    className="notification-delete"
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                    disabled={deleteNotificationMutation.isPending}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {notifications && notifications.totalPages > 1 && (
              <div className="notification-pagination">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  이전
                </button>
                <span>
                  {page + 1} / {notifications.totalPages}
                </span>
                <button
                  disabled={page >= notifications.totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
