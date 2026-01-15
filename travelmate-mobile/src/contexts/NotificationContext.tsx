/**
 * Notification Context for TravelMate Mobile
 * Manages notification state and initialization
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationService, NotificationPreferences } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isInitialized: boolean;
  refreshUnreadCount: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize notification service when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    } else {
      // Cleanup on logout
      notificationService.cleanup();
      setUnreadCount(0);
      setPreferences(null);
      setIsInitialized(false);
    }
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      // Initialize push notifications
      await notificationService.initialize();

      // Load initial data
      const [count, prefs] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getPreferences(),
      ]);

      setUnreadCount(count);
      setPreferences(prefs);
      setIsInitialized(true);

      // Set badge count
      await notificationService.setBadgeCount(count);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setIsInitialized(true);
    }
  };

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      await notificationService.setBadgeCount(count);
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      const updatedPrefs = await notificationService.updatePreferences(prefs);
      setPreferences(updatedPrefs);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }, []);

  // Poll for unread count periodically
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;

    const interval = setInterval(refreshUnreadCount, 60000); // Every minute
    return () => clearInterval(interval);
  }, [isAuthenticated, isInitialized, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        preferences,
        isInitialized,
        refreshUnreadCount,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
