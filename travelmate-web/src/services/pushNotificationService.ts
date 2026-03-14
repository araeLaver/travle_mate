/**
 * Push Notification Service
 */

import { apiClient } from './apiClient';
import { getFirebaseMessaging, vapidKey, isFirebaseConfigured } from '../lib/firebase';

export type DeviceType = 'ANDROID' | 'IOS' | 'WEB';

export interface RegisterTokenRequest {
  token: string;
  deviceType: DeviceType;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  clickAction?: string;
}

export interface NotificationPreferences {
  follow: boolean;
  message: boolean;
  nftCollected: boolean;
  mintingComplete: boolean;
  groupInvite: boolean;
  reviewHelpful: boolean;
  email: boolean;
  push: boolean;
}

class PushNotificationService {
  private fcmToken: string | null = null;
  private permissionGranted = false;

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      isFirebaseConfigured()
    );
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      // eslint-disable-next-line no-console
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';

      if (this.permissionGranted) {
        await this.initializeToken();
      }

      return this.permissionGranted;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Initialize FCM token
   */
  async initializeToken(): Promise<string | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        return null;
      }

      const { getToken } = await import('firebase/messaging');

      // Register service worker
      const registration = await this.registerServiceWorker();
      if (!registration) {
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        this.fcmToken = token;
        await this.registerTokenWithServer(token);
        // eslint-disable-next-line no-console
        console.log('FCM token initialized');
      }

      return token;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize FCM token:', error);
      return null;
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      );
      // eslint-disable-next-line no-console
      console.log('Service Worker registered');
      return registration;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Register token with backend server
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      const request: RegisterTokenRequest = {
        token,
        deviceType: 'WEB',
        deviceModel: this.getDeviceModel(),
        osVersion: this.getOsVersion(),
        appVersion: process.env.REACT_APP_VERSION || '1.0.0',
      };

      await apiClient.post('/push/register', request);
      // eslint-disable-next-line no-console
      console.log('Token registered with server');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to register token with server:', error);
    }
  }

  /**
   * Unregister token
   */
  async unregisterToken(): Promise<void> {
    if (!this.fcmToken) {
      return;
    }

    try {
      await apiClient.post('/push/unregister', { token: this.fcmToken });
      this.fcmToken = null;
      // eslint-disable-next-line no-console
      console.log('Token unregistered');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to unregister token:', error);
    }
  }

  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await apiClient.post(`/push/subscribe/${topic}`);
      // eslint-disable-next-line no-console
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to subscribe to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await apiClient.delete(`/push/subscribe/${topic}`);
      // eslint-disable-next-line no-console
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
    }
  }

  /**
   * Listen for foreground messages
   */
  async onForegroundMessage(
    callback: (payload: NotificationPayload) => void
  ): Promise<() => void> {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return () => {};
    }

    const { onMessage } = await import('firebase/messaging');

    return onMessage(messaging, (payload) => {
      // eslint-disable-next-line no-console
      console.log('Foreground message received:', payload);

      const notificationPayload: NotificationPayload = {
        title: payload.notification?.title || '',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon,
        image: payload.notification?.image,
        data: payload.data,
      };

      callback(notificationPayload);

      // Show notification if the tab is not focused
      if (document.hidden) {
        this.showNotification(notificationPayload);
      }
    });
  }

  /**
   * Show a notification
   */
  showNotification(payload: NotificationPayload): void {
    if (Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions & { image?: string } = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: payload.data,
      tag: payload.data?.type || 'default',
      requireInteraction: false,
      silent: false,
    };

    if (payload.image) {
      options.image = payload.image;
    }

    const notification = new Notification(payload.title, options as NotificationOptions);

    notification.onclick = () => {
      window.focus();
      notification.close();

      if (payload.clickAction) {
        window.location.href = payload.clickAction;
      } else if (payload.data?.clickAction) {
        window.location.href = payload.data.clickAction;
      }
    };
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return await apiClient.get<NotificationPreferences>('/settings/notifications');
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return await apiClient.put<NotificationPreferences>(
      '/settings/notifications',
      preferences
    );
  }

  /**
   * Get device model from user agent
   */
  private getDeviceModel(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  }

  /**
   * Get OS version from user agent
   */
  private getOsVersion(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows NT 10')) return 'Windows 10';
    if (ua.includes('Windows NT 11')) return 'Windows 11';
    if (ua.includes('Mac OS X')) {
      const match = ua.match(/Mac OS X (\d+[._]\d+)/);
      return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
    }
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown OS';
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
