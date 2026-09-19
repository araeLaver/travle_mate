import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { notificationService } from '../services/notificationService';
import { useToast } from '../components/Toast';
import { Notification } from '../types';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
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
      // eslint-disable-next-line no-console
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
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error('Failed to mark all as read:', error);
      showToast('읽음 처리에 실패했습니다.', 'error');
    }
  };

  // Delete notification
  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('알림이 삭제되었습니다.', 'success');
    } catch (error) {
      // eslint-disable-next-line no-console
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
        return '👥';
      case 'NEW_MESSAGE':
        return '💬';
      case 'NFT_COLLECTED':
        return '🖼️';
      case 'MARKETPLACE_SOLD':
      case 'MARKETPLACE_PURCHASED':
        return '🛒';
      case 'POINTS_RECEIVED':
      case 'POINTS_SPENT':
        return '💰';
      case 'ACHIEVEMENT_UNLOCKED':
        return '🏆';
      default:
        return '🔔';
    }
  };

  const settingItems = [
    { key: 'groupInvite' as const, label: '그룹 초대/가입', icon: '👥' },
    { key: 'newMessage' as const, label: '새 메시지', icon: '💬' },
    { key: 'nftCollect' as const, label: 'NFT 수집/업적', icon: '🖼️' },
    { key: 'marketplace' as const, label: '마켓플레이스 거래', icon: '🛒' },
    { key: 'pointTransfer' as const, label: '포인트 전송', icon: '💰' },
    { key: 'achievements' as const, label: '업적 달성', icon: '🏆' },
    { key: 'systemNotice' as const, label: '시스템 공지', icon: '📢' },
  ];

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] relative overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-[#F2F1ED] dark:border-gray-800"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-[13px] bg-sand-100 hover:bg-sand-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <Logo size="sm" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink dark:text-white">
            알림 설정
          </h1>
          <ThemeToggle />
        </div>
      </motion.nav>

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* 푸시 알림 섹션 */}
        <motion.section
          {...fadeInUp}
          className="bg-white dark:bg-gray-900 rounded-[18px] shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 overflow-hidden"
        >
          <div className="p-4 border-b border-[#F2F1ED] dark:border-gray-800">
            <h2 className="text-lg font-extrabold tracking-tight text-ink dark:text-white">
              푸시 알림
            </h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="font-bold text-ink dark:text-white">푸시 알림 받기</p>
                  <p className="text-sm text-[#74747F] dark:text-gray-400">
                    모든 알림을 실시간으로 받습니다
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.pushEnabled}
                  onChange={() => handleToggle('pushEnabled')}
                  className="sr-only peer"
                />
                <div className="w-12 h-[29px] bg-sand-400 dark:bg-gray-700 peer-focus:outline-none rounded-[15px] peer peer-checked:after:translate-x-[19px] rtl:peer-checked:after:-translate-x-[19px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-transparent after:border after:rounded-full after:h-[25px] after:w-[25px] after:transition-all after:shadow-sm peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </motion.section>

        {/* 알림 유형 섹션 */}
        <motion.section
          {...fadeInUp}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-[18px] shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 overflow-hidden"
        >
          <div className="p-4 border-b border-[#F2F1ED] dark:border-gray-800">
            <h2 className="text-lg font-extrabold tracking-tight text-ink dark:text-white">
              알림 유형
            </h2>
          </div>
          <div className="divide-y divide-[#F2F1ED] dark:divide-gray-800">
            {settingItems.map(item => (
              <div key={item.key} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-bold text-ink dark:text-white">{item.label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={() => handleToggle(item.key)}
                    disabled={!preferences.pushEnabled}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-12 h-[29px] bg-sand-400 dark:bg-gray-700 peer-focus:outline-none rounded-[15px] peer peer-checked:after:translate-x-[19px] rtl:peer-checked:after:-translate-x-[19px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-transparent after:border after:rounded-full after:h-[25px] after:w-[25px] after:transition-all after:shadow-sm peer-checked:bg-primary-500 ${
                      !preferences.pushEnabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  ></div>
                </label>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 최근 알림 섹션 */}
        <motion.section
          {...fadeInUp}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-[18px] shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 overflow-hidden"
        >
          <div className="p-4 border-b border-[#F2F1ED] dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight text-ink dark:text-white">
              최근 알림{' '}
              {unreadCount > 0 && <span className="text-primary-500">({unreadCount})</span>}
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-500 dark:text-primary-300 font-bold hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-5xl mb-3">🔕</span>
              <p className="text-[#74747F] dark:text-gray-400">읽지 않은 알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F2F1ED] dark:divide-gray-800">
              {notifications.map(notif => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 flex items-start gap-3"
                >
                  <div className="w-[34px] h-[34px] rounded-[11px] bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-lg flex-shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-ink dark:text-white truncate">{notif.title}</h4>
                    <p className="text-sm text-[#74747F] dark:text-gray-400 line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-xs text-[#9A9AA4] dark:text-gray-500">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 rounded-lg hover:bg-success/10 dark:hover:bg-green-900/30 text-success dark:text-green-400 transition-colors"
                      title="읽음 처리"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 rounded-lg hover:bg-[#FBF0EF] dark:hover:bg-red-900/30 text-danger dark:text-red-400 transition-colors"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default NotificationSettings;
