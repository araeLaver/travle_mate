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
  const allNotifications = [...realtimeNotifications, ...(notifications?.content || [])];

  const handleNotificationClick = (notification: {
    id: string;
    isRead: boolean;
    actionUrl?: string;
  }) => {
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
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`알림 ${(unreadCount || 0) > 0 ? `(읽지 않은 알림 ${unreadCount}개)` : ''}`}
      >
        <span aria-hidden="true">🔔</span>
        {(unreadCount || 0) > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <>
          <div
            className="notification-overlay"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="notification-dropdown"
            role="dialog"
            aria-label="알림 목록"
            aria-modal="true"
          >
            <div className="notification-header">
              <h3 id="notification-title">알림</h3>
              {(unreadCount || 0) > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  aria-busy={markAllAsReadMutation.isPending}
                >
                  모두 읽음
                </button>
              )}
            </div>

            <div className="notification-list" role="list" aria-labelledby="notification-title">
              {isLoading && (
                <div className="loading" role="status" aria-live="polite">
                  로딩 중...
                </div>
              )}

              {!isLoading && allNotifications.length === 0 && (
                <div className="empty-notifications" role="status">
                  <p>새로운 알림이 없습니다.</p>
                </div>
              )}

              {allNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                  aria-label={`${notification.isRead ? '' : '읽지 않음: '}${notification.title} - ${notification.message}`}
                >
                  <div className="notification-icon" aria-hidden="true">
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
                    onClick={e => handleDeleteNotification(notification.id, e)}
                    disabled={deleteNotificationMutation.isPending}
                    aria-label={`${notification.title} 알림 삭제`}
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>
              ))}
            </div>

            {notifications && notifications.totalPages > 1 && (
              <nav className="notification-pagination" aria-label="알림 페이지 탐색">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  aria-label="이전 페이지"
                >
                  이전
                </button>
                <span aria-current="page">
                  {page + 1} / {notifications.totalPages}
                </span>
                <button
                  disabled={page >= notifications.totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  aria-label="다음 페이지"
                >
                  다음
                </button>
              </nav>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
