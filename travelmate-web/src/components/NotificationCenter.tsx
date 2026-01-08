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

// SVG Icons
const BellIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UserPlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const UserMinusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const MessageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const AtSignIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </svg>
);

const CommentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const HeartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const StarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const MegaphoneIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 11l18-5v12L3 13v-2z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

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
    id: number;
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
    const icons: { [key: string]: React.ReactNode } = {
      GROUP_INVITE: <UsersIcon />,
      GROUP_JOIN: <UserPlusIcon />,
      GROUP_LEAVE: <UserMinusIcon />,
      GROUP_UPDATE: <EditIcon />,
      NEW_MESSAGE: <MessageIcon />,
      MENTION: <AtSignIcon />,
      COMMENT: <CommentIcon />,
      LIKE: <HeartIcon />,
      REVIEW: <StarIcon />,
      SYSTEM: <BellIcon />,
    };
    return icons[type] || <MegaphoneIcon />;
  };

  const formatTimestamp = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
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
        <span className="bell-icon" aria-hidden="true">
          <BellIcon />
        </span>
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
                  <div className="loading-spinner" aria-hidden="true" />
                  <span>로딩 중...</span>
                </div>
              )}

              {!isLoading && allNotifications.length === 0 && (
                <div className="empty-notifications" role="status">
                  <div className="empty-icon" aria-hidden="true">
                    <BellIcon />
                  </div>
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
                    <XIcon />
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
