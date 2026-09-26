import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const FCM_TOKEN_KEY = '@travelmate:fcmToken';
const NOTIFICATION_PREFS_KEY = '@travelmate:notificationPrefs';

const mockStorage = new Map<string, string>();

const mockAsyncStorage = {
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
};

const mockApiClient = {
  get: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  post: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  put: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  delete: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

const mockNotifications = {
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
  },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'expo-push-token' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('scheduled-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
};

const mockDevice = {
  isDevice: true,
  modelName: 'iPhone Test',
  osVersion: '17.0',
};

const loadNotificationService = () => {
  jest.resetModules();
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  jest.doMock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
  jest.doMock('expo-notifications', () => mockNotifications);
  jest.doMock('expo-device', () => mockDevice);
  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: {
      expoConfig: {
        extra: {
          eas: {
            projectId: 'test-project-id',
          },
        },
        version: '1.0.0',
      },
    },
  }));
  jest.doMock('react-native', () => ({
    Platform: {
      OS: 'ios',
      Version: '17.0',
    },
  }));
  jest.doMock('./apiClient', () => ({
    __esModule: true,
    apiClient: mockApiClient,
    default: mockApiClient,
  }));

  return require('./notificationService') as typeof import('./notificationService');
};

describe('mobile notificationService server state handling', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockApiClient.get.mockReset();
    mockApiClient.post.mockReset();
    mockApiClient.put.mockReset();
    mockApiClient.delete.mockReset();
    Object.values(mockNotifications).forEach(value => {
      if (typeof value === 'function' && 'mockClear' in value) {
        value.mockClear();
      }
    });
    mockDevice.isDevice = true;
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'expo-push-token' });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers the Expo token with the backend before storing it locally', async () => {
    const { notificationService } = loadNotificationService();
    mockApiClient.post.mockResolvedValueOnce({});

    const token = await notificationService.registerForPushNotifications();

    expect(token).toBe('expo-push-token');
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/push/register',
      expect.objectContaining({
        token: 'expo-push-token',
        deviceType: 'IOS',
      })
    );
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(FCM_TOKEN_KEY, 'expo-push-token');
    expect(mockApiClient.post.mock.invocationCallOrder[0]).toBeLessThan(
      mockAsyncStorage.setItem.mock.invocationCallOrder[0]
    );
  });

  it('does not store a local token when backend token registration fails', async () => {
    const { notificationService } = loadNotificationService();
    const error = { response: { status: 503 }, message: 'push backend down' };
    mockApiClient.post.mockRejectedValueOnce(error);

    await expect(notificationService.registerForPushNotifications()).rejects.toBe(error);
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalledWith(FCM_TOKEN_KEY, 'expo-push-token');
  });

  it('keeps the local token when backend unregister fails', async () => {
    const { notificationService } = loadNotificationService();
    mockApiClient.post.mockResolvedValueOnce({});
    await notificationService.registerForPushNotifications();
    mockApiClient.post.mockClear();
    mockAsyncStorage.removeItem.mockClear();

    const error = { response: { status: 503 }, message: 'unregister failed' };
    mockApiClient.post.mockRejectedValueOnce(error);

    await expect(notificationService.unregister()).rejects.toBe(error);
    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith(FCM_TOKEN_KEY);
  });

  it('uses cached preferences when the backend is temporarily unavailable', async () => {
    const cached = {
      enabled: true,
      followNotifications: true,
      likeNotifications: false,
      commentNotifications: false,
      groupNotifications: true,
      nftNotifications: true,
      nearbyNotifications: true,
      marketingNotifications: false,
    };
    mockStorage.set(NOTIFICATION_PREFS_KEY, JSON.stringify(cached));
    const { notificationService } = loadNotificationService();
    mockApiClient.get.mockRejectedValueOnce({ response: { status: 503 }, message: 'down' });

    await expect(notificationService.getPreferences()).resolves.toEqual(cached);
  });

  it('removes corrupted cached preferences and exposes backend failures without a valid cache', async () => {
    mockStorage.set(NOTIFICATION_PREFS_KEY, '{not valid json');
    const { notificationService } = loadNotificationService();
    const error = { response: { status: 503 }, message: 'down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(notificationService.getPreferences()).rejects.toBe(error);

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(NOTIFICATION_PREFS_KEY);
    expect(mockStorage.has(NOTIFICATION_PREFS_KEY)).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to parse cached notification preferences:',
      expect.any(SyntaxError)
    );
  });

  it('removes cached preferences with invalid storage shape', async () => {
    mockStorage.set(
      NOTIFICATION_PREFS_KEY,
      JSON.stringify({
        enabled: true,
        followNotifications: 'yes',
        likeNotifications: false,
        commentNotifications: false,
        groupNotifications: true,
        nftNotifications: true,
        nearbyNotifications: true,
        marketingNotifications: false,
      })
    );
    const { notificationService } = loadNotificationService();
    const error = { response: { status: 503 }, message: 'down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(notificationService.getPreferences()).rejects.toBe(error);

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(NOTIFICATION_PREFS_KEY);
    expect(mockStorage.has(NOTIFICATION_PREFS_KEY)).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to parse cached notification preferences:',
      expect.any(Error)
    );
  });

  it('throws preference backend failures when no cache exists', async () => {
    const { notificationService } = loadNotificationService();
    const error = { response: { status: 500 }, message: 'preferences down' };
    mockApiClient.get.mockRejectedValueOnce(error);

    await expect(notificationService.getPreferences()).rejects.toBe(error);
  });

  it('returns default preferences for a missing preference record', async () => {
    const { notificationService } = loadNotificationService();
    mockApiClient.get.mockRejectedValueOnce({ response: { status: 404 }, message: 'missing' });

    await expect(notificationService.getPreferences()).resolves.toEqual({
      enabled: true,
      followNotifications: true,
      likeNotifications: true,
      commentNotifications: true,
      groupNotifications: true,
      nftNotifications: true,
      nearbyNotifications: true,
      marketingNotifications: false,
    });
  });
});
