import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { websocketService } from '../services/websocketService';
import { useAuthStore } from '../store/authStore';
import type { Notification, PaginatedResponse } from '../types';

export type { Notification };

// Query Keys
const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

// 알림 목록 조회
export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: [...notificationKeys.list(), page, size],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Notification>>(
        `/notifications?page=${page}&size=${size}`
      );
      return {
        ...response,
        content: response.content.map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          readAt: n.readAt ? new Date(n.readAt) : null,
        })),
      };
    },
  });
}

// 읽지 않은 알림 조회
export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const response = await apiClient.get<Notification[]>('/notifications/unread');
      return response.map((n) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        readAt: n.readAt ? new Date(n.readAt) : null,
      }));
    },
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
}

// 읽지 않은 알림 개수
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>('/notifications/unread/count');
      return response.count;
    },
    refetchInterval: 10000, // 10초마다 자동 갱신
  });
}

// 알림 읽음 처리
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: number[]) =>
      apiClient.post('/notifications/read', notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// 모든 알림 읽음 처리
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/notifications/read/all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// 알림 삭제
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      apiClient.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// 실시간 알림 수신
export function useRealtimeNotifications() {
  const [realtimeNotifications, setRealtimeNotifications] = useState<Notification[]>([]);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !websocketService.isConnected()) {
      return;
    }

    // WebSocket으로 실시간 알림 구독
    const subscription = websocketService.subscribe(
      `/user/queue/notifications`,
      (message) => {
        try {
          const notification: Notification = JSON.parse(message.body);

          // 새 알림 추가
          setRealtimeNotifications((prev) => [notification, ...prev]);

          // 쿼리 캐시 무효화 (목록 갱신)
          queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
          queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });

          // 브라우저 알림 표시 (권한이 있으면)
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo192.png',
              badge: '/logo192.png',
            });
          }
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, queryClient]);

  const clearRealtimeNotifications = useCallback(() => {
    setRealtimeNotifications([]);
  }, []);

  return {
    realtimeNotifications,
    clearRealtimeNotifications,
  };
}

// 브라우저 알림 권한 요청
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(
    Notification.permission
  );

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return {
    permission,
    requestPermission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
  };
}
