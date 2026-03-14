/**
 * Hook for managing push notifications
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import pushNotificationService, {
  NotificationPayload,
  NotificationPreferences,
} from '../services/pushNotificationService';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  requestPermission: () => Promise<boolean>;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Initialize
  useEffect(() => {
    const supported = pushNotificationService.isSupported();
    setIsSupported(supported);
    setPermission(pushNotificationService.getPermissionStatus());
    setIsEnabled(pushNotificationService.getToken() !== null);
    setIsLoading(false);

    // Load preferences
    if (supported) {
      loadPreferences();
    }
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupForegroundListener = async () => {
      unsubscribe = await pushNotificationService.onForegroundMessage(
        (payload: NotificationPayload) => {
          // Show toast for foreground notifications
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    {payload.icon && (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={payload.icon}
                        alt=""
                      />
                    )}
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {payload.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{payload.body}</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ),
            { duration: 5000 }
          );
        }
      );
    };

    setupForegroundListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isSupported, permission]);

  const loadPreferences = async () => {
    try {
      const prefs = await pushNotificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load notification preferences:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const granted = await pushNotificationService.requestPermission();
      setPermission(pushNotificationService.getPermissionStatus());
      setIsEnabled(granted);
      return granted;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enableNotifications = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('알림 권한이 거부되었습니다.');
        }
      } else {
        const token = await pushNotificationService.initializeToken();
        if (token) {
          setIsEnabled(true);
          toast.success('알림이 활성화되었습니다.');
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to enable notifications:', error);
      toast.error('알림 활성화에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [permission, requestPermission]);

  const disableNotifications = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await pushNotificationService.unregisterToken();
      setIsEnabled(false);
      toast.success('알림이 비활성화되었습니다.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to disable notifications:', error);
      toast.error('알림 비활성화에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>): Promise<void> => {
      try {
        const updated = await pushNotificationService.updatePreferences(newPreferences);
        setPreferences(updated);
        toast.success('알림 설정이 업데이트되었습니다.');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to update notification preferences:', error);
        toast.error('알림 설정 업데이트에 실패했습니다.');
      }
    },
    []
  );

  return {
    isSupported,
    permission,
    isEnabled,
    isLoading,
    preferences,
    requestPermission,
    enableNotifications,
    disableNotifications,
    updatePreferences,
  };
}

export default usePushNotifications;
