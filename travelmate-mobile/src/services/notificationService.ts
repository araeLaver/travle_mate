/**
 * Notification Service for TravelMate Mobile
 * Handles push notifications using Expo Notifications API
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface PushNotification {
  id: number;
  title: string;
  body: string;
  type: NotificationType;
  data?: NotificationData;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'FOLLOW'
  | 'LIKE'
  | 'COMMENT'
  | 'GROUP_INVITE'
  | 'GROUP_MESSAGE'
  | 'NFT_COLLECTED'
  | 'NFT_MINTED'
  | 'NEARBY_LOCATION'
  | 'ACHIEVEMENT'
  | 'SYSTEM';

export interface NotificationData {
  targetId?: number;
  targetType?: string;
  userId?: number;
  groupId?: number;
  locationId?: number;
  [key: string]: unknown;
}

export interface NotificationPreferences {
  enabled: boolean;
  followNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  groupNotifications: boolean;
  nftNotifications: boolean;
  nearbyNotifications: boolean;
  marketingNotifications: boolean;
}

const FCM_TOKEN_KEY = '@travelmate:fcmToken';
const NOTIFICATION_PREFS_KEY = '@travelmate:notificationPrefs';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    // Register for push notifications
    await this.registerForPushNotifications();

    // Set up notification listeners
    this.setupNotificationListeners();
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Check if physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    try {
      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });
      this.expoPushToken = tokenData.data;

      // Store token locally
      await AsyncStorage.setItem(FCM_TOKEN_KEY, this.expoPushToken);

      // Register token with backend
      await this.registerTokenWithServer(this.expoPushToken);

      // Android-specific channel setup
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      console.log('Push token registered:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to register push token:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: '일반 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });

    await Notifications.setNotificationChannelAsync('chat', {
      name: '채팅 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'chat.wav',
    });

    await Notifications.setNotificationChannelAsync('nft', {
      name: 'NFT 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#F59E0B',
    });

    await Notifications.setNotificationChannelAsync('nearby', {
      name: '주변 장소 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#8B5CF6',
    });
  }

  /**
   * Register token with backend server
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register-device', {
        token,
        platform: Platform.OS,
        deviceType: Device.modelName || 'Unknown',
      });
    } catch (error) {
      console.error('Failed to register token with server:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for user interaction with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle incoming notification
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;

    // You can add custom logic here, e.g., update badge count, show in-app notification
    console.log('Received notification:', { title, body, data });
  }

  /**
   * Handle notification interaction
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as NotificationData;

    // Navigate based on notification type
    if (data) {
      this.navigateToTarget(data);
    }
  }

  /**
   * Navigate to target screen based on notification data
   */
  private navigateToTarget(data: NotificationData): void {
    // This should be implemented with navigation reference
    // For now, just log the navigation intent
    console.log('Navigate to:', data);

    // Example navigation logic:
    // if (data.groupId) {
    //   navigationRef.navigate('ChatRoom', { groupId: data.groupId });
    // } else if (data.locationId) {
    //   navigationRef.navigate('LocationDetail', { locationId: data.locationId });
    // }
  }

  /**
   * Get notifications from server
   */
  async getNotifications(page: number = 0): Promise<{
    content: PushNotification[];
    totalElements: number;
    totalPages: number;
  }> {
    return apiClient.get(`/notifications?page=${page}&size=20`);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Fetch from server
      const prefs = await apiClient.get<NotificationPreferences>('/notifications/preferences');
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
      return prefs;
    } catch (error) {
      // Return defaults
      return {
        enabled: true,
        followNotifications: true,
        likeNotifications: true,
        commentNotifications: true,
        groupNotifications: true,
        nftNotifications: true,
        nearbyNotifications: true,
        marketingNotifications: false,
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const currentPrefs = await this.getPreferences();
    const updatedPrefs = { ...currentPrefs, ...prefs };

    await apiClient.put('/notifications/preferences', updatedPrefs);
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updatedPrefs));

    return updatedPrefs;
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null, // null = immediate
    });

    return id;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Unregister device from push notifications
   */
  async unregister(): Promise<void> {
    if (this.expoPushToken) {
      try {
        await apiClient.delete('/notifications/unregister-device', {
          data: { token: this.expoPushToken },
        });
      } catch (error) {
        console.error('Failed to unregister device:', error);
      }
    }

    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    this.expoPushToken = null;
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      FOLLOW: '👤',
      LIKE: '❤️',
      COMMENT: '💬',
      GROUP_INVITE: '👥',
      GROUP_MESSAGE: '✉️',
      NFT_COLLECTED: '🎨',
      NFT_MINTED: '⛓️',
      NEARBY_LOCATION: '📍',
      ACHIEVEMENT: '🏆',
      SYSTEM: '🔔',
    };

    return icons[type] || '🔔';
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      FOLLOW: '#3B82F6',
      LIKE: '#EF4444',
      COMMENT: '#10B981',
      GROUP_INVITE: '#8B5CF6',
      GROUP_MESSAGE: '#06B6D4',
      NFT_COLLECTED: '#F59E0B',
      NFT_MINTED: '#6366F1',
      NEARBY_LOCATION: '#EC4899',
      ACHIEVEMENT: '#FBBF24',
      SYSTEM: '#6B7280',
    };

    return colors[type] || '#6B7280';
  }
}

export const notificationService = new NotificationService();
export default notificationService;
