import { pushNotificationService } from './pushNotificationService';
import { apiClient } from './apiClient';
import { getFirebaseMessaging, isFirebaseConfigured } from '../lib/firebase';
import { getToken } from 'firebase/messaging';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../lib/firebase', () => ({
  getFirebaseMessaging: jest.fn(),
  vapidKey: 'test-vapid-key',
  isFirebaseConfigured: jest.fn(() => false),
}));
jest.mock('../lib/utils', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock('firebase/messaging', () => ({
  getToken: jest.fn(),
  onMessage: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockGetFirebaseMessaging = getFirebaseMessaging as jest.MockedFunction<
  typeof getFirebaseMessaging
>;
const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockServiceWorkerRegistration = {} as ServiceWorkerRegistration;

const setPushBrowserSupport = () => {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: {
      permission: 'granted',
      requestPermission: jest.fn(() => Promise.resolve('granted')),
    },
  });
  Object.defineProperty(window, 'PushManager', {
    configurable: true,
    value: function PushManager() {},
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      register: jest.fn(() => Promise.resolve(mockServiceWorkerRegistration)),
    },
  });
};

describe('PushNotificationService preferences', () => {
  beforeEach(async () => {
    if (pushNotificationService.getToken()) {
      mockApiClient.post.mockResolvedValueOnce({});
      await pushNotificationService.unregisterToken();
    }
    jest.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(false);
    mockGetFirebaseMessaging.mockResolvedValue(null);
    mockGetToken.mockReset();
  });

  it('gets preferences from the push preferences endpoint', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      follow: true,
      message: true,
      nftCollected: true,
      mintingComplete: true,
      groupInvite: true,
      reviewHelpful: true,
      email: true,
      push: true,
    });

    const preferences = await pushNotificationService.getPreferences();

    expect(mockApiClient.get).toHaveBeenCalledWith('/push/preferences');
    expect(preferences.push).toBe(true);
  });

  it('updates preferences through the push preferences endpoint', async () => {
    mockApiClient.put.mockResolvedValueOnce({
      follow: false,
      message: false,
      nftCollected: false,
      mintingComplete: false,
      groupInvite: false,
      reviewHelpful: false,
      email: false,
      push: false,
    });

    const preferences = await pushNotificationService.updatePreferences({ push: false });

    expect(mockApiClient.put).toHaveBeenCalledWith('/push/preferences', { push: false });
    expect(preferences.push).toBe(false);
  });

  it('registers the FCM token with the backend before marking notifications enabled', async () => {
    setPushBrowserSupport();
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetFirebaseMessaging.mockResolvedValue({ app: { name: 'test-app' } } as never);
    mockGetToken.mockResolvedValue('fcm-token');
    mockApiClient.post.mockResolvedValueOnce({});

    const token = await pushNotificationService.initializeToken();

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/firebase-messaging-sw.js');
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/push/register',
      expect.objectContaining({
        token: 'fcm-token',
        deviceType: 'WEB',
      })
    );
    expect(token).toBe('fcm-token');
    expect(pushNotificationService.getToken()).toBe('fcm-token');
  });

  it('rejects token initialization when backend registration fails', async () => {
    setPushBrowserSupport();
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetFirebaseMessaging.mockResolvedValue({ app: { name: 'test-app' } } as never);
    mockGetToken.mockResolvedValue('fcm-token');
    mockApiClient.post.mockRejectedValueOnce({ status: 500, message: 'push backend down' });

    await expect(pushNotificationService.initializeToken()).rejects.toMatchObject({ status: 500 });
    expect(pushNotificationService.getToken()).toBeNull();
  });

  it('rejects topic subscription failures instead of logging success', async () => {
    mockApiClient.post.mockRejectedValueOnce({ status: 503, message: 'topic service down' });

    await expect(pushNotificationService.subscribeToTopic('travel')).rejects.toMatchObject({
      status: 503,
    });
  });

  it('rejects token unregister failures and keeps the local token for retry', async () => {
    setPushBrowserSupport();
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetFirebaseMessaging.mockResolvedValue({ app: { name: 'test-app' } } as never);
    mockGetToken.mockResolvedValue('fcm-token');
    mockApiClient.post.mockResolvedValueOnce({});
    await pushNotificationService.initializeToken();

    mockApiClient.post.mockRejectedValueOnce({ status: 503, message: 'unregister failed' });

    await expect(pushNotificationService.unregisterToken()).rejects.toMatchObject({ status: 503 });
    expect(pushNotificationService.getToken()).toBe('fcm-token');
  });
});
