import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { useToast } from '../components/Toast';
import { Notification } from '../types';
import './NotificationSettings.css';

interface NotificationPreferences {
  pushEnabled: boolean;
  groupInvite: boolean;
  newMessage: boolean;
  nftCollect: boolean;
  marketplace: boolean;
  pointTransfer: boolean;
  achievements: boolean;
  systemNotice: boolean;
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  groupInvite: true,
  newMessage: true,
  nftCollect: true,
  marketplace: true,
  pointTransfer: true,
  achievements: true,
  systemNotice: true,
};

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getUnreadNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notificationPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
    loadNotifications();
  }, [loadNotifications]);

  // Save preferences to localStorage
  const savePreferences = (newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs));
    showToast('설정이 저장되었습니다.', 'success');
  };

  // Toggle preference
  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    savePreferences(newPrefs);
  };

  // Mark notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead([id]);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      showToast('모든 알림을 읽음 처리했습니다.', 'success');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast('읽음 처리에 실패했습니다.', 'error');
    }
  };

  // Delete notification
  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast('알림이 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
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

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'GROUP_INVITE':
      case 'GROUP_JOIN':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        );
      case 'NEW_MESSAGE':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        );
      case 'NFT_COLLECTED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        );
      case 'MARKETPLACE_SOLD':
      case 'MARKETPLACE_PURCHASED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        );
      case 'POINTS_RECEIVED':
      case 'POINTS_SPENT':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
            <path d="M12 18V6"/>
          </svg>
        );
      case 'ACHIEVEMENT_UNLOCKED':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"/>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        );
    }
  };

  return (
    <div className="notification-settings">
      {/* Header */}
      <header className="settings-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>알림 설정</h1>
        <div className="header-spacer" />
      </header>

      {/* Push Notification Toggle */}
      <section className="settings-section">
        <div className="section-header">
          <h2>푸시 알림</h2>
        </div>
        <div className="setting-item main">
          <div className="setting-info">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div>
              <span className="setting-title">푸시 알림 받기</span>
              <span className="setting-desc">모든 알림을 실시간으로 받습니다</span>
            </div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.pushEnabled}
              onChange={() => handleToggle('pushEnabled')}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </section>

      {/* Notification Types */}
      <section className="settings-section">
        <div className="section-header">
          <h2>알림 유형</h2>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-title">그룹 초대/가입</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.groupInvite}
              onChange={() => handleToggle('groupInvite')}
              disabled={!preferences.pushEnabled}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-title">새 메시지</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.newMessage}
              onChange={() => handleToggle('newMessage')}
              disabled={!preferences.pushEnabled}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-title">NFT 수집/업적</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.nftCollect}
              onChange={() => handleToggle('nftCollect')}
              disabled={!preferences.pushEnabled}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-title">마켓플레이스 거래</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.marketplace}
              onChange={() => handleToggle('marketplace')}
              disabled={!preferences.pushEnabled}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-title">포인트 전송</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.pointTransfer}
              onChange={() => handleToggle('pointTransfer')}
              disabled={!preferences.pushEnabled}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-title">업적 달성</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.achievements}
              onChange={() => handleToggle('achievements')}
              disabled={!preferences.pushEnabled}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-title">시스템 공지</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.systemNotice}
              onChange={() => handleToggle('systemNotice')}
              disabled={!preferences.pushEnabled}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </section>

      {/* Recent Notifications */}
      <section className="settings-section">
        <div className="section-header">
          <h2>최근 알림</h2>
          {unreadCount > 0 && (
            <button className="btn-mark-all" onClick={handleMarkAllAsRead}>
              모두 읽음
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <p>읽지 않은 알림이 없습니다</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notif) => (
              <div key={notif.id} className="notification-item">
                <div className="notif-icon">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="notif-content">
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <span className="notif-time">{formatDate(notif.createdAt)}</span>
                </div>
                <div className="notif-actions">
                  <button
                    className="btn-action"
                    onClick={() => handleMarkAsRead(notif.id)}
                    title="읽음 처리"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={() => handleDelete(notif.id)}
                    title="삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationSettings;
