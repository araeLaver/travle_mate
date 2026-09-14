import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { PendingAction, PendingActionType } from './offlineService';

const PENDING_ACTIONS_KEY = '@travelmate:pending:actions';
const LAST_SYNC_KEY = '@travelmate:lastSync';
const OFFLINE_PAGES_KEY = '@travelmate:offline:pages';

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
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
};

const mockNetInfo = {
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
};

const mockApiClient = {
  post: jest.fn<(...args: unknown[]) => Promise<unknown>>(() => Promise.resolve({})),
  put: jest.fn<(...args: unknown[]) => Promise<unknown>>(() => Promise.resolve({})),
};

const loadOfflineService = () => {
  jest.resetModules();
  jest.doMock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
  jest.doMock('@react-native-community/netinfo', () => ({
    __esModule: true,
    default: mockNetInfo,
  }));
  jest.doMock('./apiClient', () => ({
    __esModule: true,
    apiClient: mockApiClient,
    default: mockApiClient,
  }));
  return require('./offlineService') as typeof import('./offlineService');
};

const createAction = (
  type: PendingActionType,
  payload: Record<string, unknown>,
  retryCount = 0
): PendingAction => ({
  id: `${type}_test`,
  type,
  payload,
  createdAt: 1,
  retryCount,
  priority: 'normal',
});

const storeActions = (actions: PendingAction[]) => {
  mockStorage.set(PENDING_ACTIONS_KEY, JSON.stringify(actions));
};

describe('offlineService pending action sync', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockAsyncStorage.getAllKeys.mockClear();
    mockNetInfo.fetch.mockClear();
    mockNetInfo.addEventListener.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.put.mockClear();
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  });

  it('normalizes offline chat messages to the REST message DTO', async () => {
    const { offlineService } = loadOfflineService();
    storeActions([
      createAction('SEND_MESSAGE', {
        roomId: '12',
        senderId: 99,
        content: ' 현재 위치 ',
        messageType: 'LOCATION',
        latitude: '37.5665',
        longitude: '126.9780',
        locationName: ' 서울역 ',
      }),
    ]);

    await expect(offlineService.syncPendingActions()).resolves.toEqual({
      success: 1,
      failed: 0,
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/chat/rooms/12/messages', {
      content: '현재 위치',
      messageType: 'LOCATION',
      locationLatitude: 37.5665,
      locationLongitude: 126.978,
      locationName: '서울역',
    });
  });

  it('maps mobile group and matching fields to backend DTO field names', async () => {
    const { offlineService } = loadOfflineService();
    storeActions([
      createAction('CREATE_GROUP', {
        name: ' 제주 동행 ',
        description: ' 한라산 일정 ',
        destination: ' 제주 ',
        startDate: '2026-08-10',
        endDate: '2026-08-13',
        purpose: 'LEISURE',
        maxMembers: '6',
        latitude: '33.4996',
        longitude: '126.5312',
        ignoredLocalField: true,
      }),
      createAction('MATCH_REQUEST', {
        targetUserId: '88',
        message: ' 같이 가요 ',
        ignoredLocalField: true,
      }),
    ]);

    await expect(offlineService.syncPendingActions()).resolves.toEqual({
      success: 2,
      failed: 0,
    });

    expect(mockApiClient.post).toHaveBeenNthCalledWith(1, '/groups', {
      title: '제주 동행',
      description: '한라산 일정',
      destination: '제주',
      startDate: '2026-08-10',
      endDate: '2026-08-13',
      purpose: 'LEISURE',
      maxMembers: 6,
      meetingLatitude: 33.4996,
      meetingLongitude: 126.5312,
    });
    expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/matching/requests', {
      receiverId: 88,
      message: '같이 가요',
    });
  });

  it('normalizes NFT collection and user review retry payloads', async () => {
    const { offlineService } = loadOfflineService();
    storeActions([
      createAction('COLLECT_NFT', {
        locationId: '42',
        latitude: '37.1',
        longitude: '127.2',
        gpsAccuracy: '8.5',
        deviceId: ' mobile-device ',
        isMockLocation: 'false',
        ignoredLocalField: true,
      }),
      createAction('SUBMIT_REVIEW', {
        targetUserId: '77',
        rating: '5',
        comment: ' 좋았습니다 ',
        ignoredLocalField: true,
      }),
    ]);

    await expect(offlineService.syncPendingActions()).resolves.toEqual({
      success: 2,
      failed: 0,
    });

    expect(mockApiClient.post).toHaveBeenNthCalledWith(1, '/nft/collect', {
      locationId: 42,
      latitude: 37.1,
      longitude: 127.2,
      gpsAccuracy: 8.5,
      deviceId: 'mobile-device',
      isMockLocation: false,
    });
    expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/users/reviews', {
      reviewedUserId: 77,
      rating: 5,
      comment: '좋았습니다',
    });
  });

  it('keeps invalid pending actions queued with an incremented retry count', async () => {
    const { offlineService } = loadOfflineService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    storeActions([
      createAction('MATCH_REQUEST', {
        message: '대상자가 없습니다',
      }),
    ]);

    await expect(offlineService.syncPendingActions()).resolves.toEqual({
      success: 0,
      failed: 1,
    });

    expect(mockApiClient.post).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to sync action MATCH_REQUEST_test:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
    const stored = JSON.parse(mockStorage.get(PENDING_ACTIONS_KEY) || '[]') as PendingAction[];
    expect(stored).toHaveLength(1);
    expect(stored[0].retryCount).toBe(1);
  });

  it('does not treat a corrupted pending action queue as empty during sync', async () => {
    const { offlineService } = loadOfflineService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockStorage.set(PENDING_ACTIONS_KEY, '{not valid json');

    await expect(offlineService.syncPendingActions()).rejects.toThrow();

    expect(mockApiClient.post).not.toHaveBeenCalled();
    expect(mockStorage.get(PENDING_ACTIONS_KEY)).toBe('{not valid json');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get pending actions:',
      expect.any(SyntaxError)
    );
    consoleErrorSpy.mockRestore();
  });

  it('does not overwrite a corrupted pending action queue when adding a new action', async () => {
    const { offlineService } = loadOfflineService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockStorage.set(PENDING_ACTIONS_KEY, '{}');

    await expect(
      offlineService.addPendingAction('MATCH_REQUEST', {
        receiverId: 88,
      })
    ).rejects.toThrow('Pending actions storage is not an array');

    expect(mockStorage.get(PENDING_ACTIONS_KEY)).toBe('{}');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get pending actions:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});

describe('offlineService offline-first fetch', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockAsyncStorage.getAllKeys.mockClear();
    mockNetInfo.fetch.mockReset();
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
    mockNetInfo.addEventListener.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.put.mockClear();
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  });

  it('removes corrupted cached data entries instead of retrying the same parse failure', async () => {
    const { offlineService } = loadOfflineService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockStorage.set('@travelmate:cache:test', '{not valid json');

    await expect(offlineService.getCachedData('@travelmate:cache:test')).resolves.toBeNull();

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@travelmate:cache:test');
    expect(mockStorage.has('@travelmate:cache:test')).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get cached data:',
      expect.any(SyntaxError)
    );
    consoleErrorSpy.mockRestore();
  });

  it('removes cached data entries with invalid storage shape', async () => {
    const { offlineService } = loadOfflineService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockStorage.set(
      '@travelmate:cache:test',
      JSON.stringify({
        data: { cached: true },
        timestamp: Date.now(),
        expiresAt: 'not-a-number',
      })
    );

    await expect(offlineService.getCachedData('@travelmate:cache:test')).resolves.toBeNull();

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@travelmate:cache:test');
    expect(mockStorage.has('@travelmate:cache:test')).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get cached data:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('exposes online fetch failures when no cache is available', async () => {
    const { offlineService } = loadOfflineService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchError = new Error('network down');
    const fetcher = jest.fn(() => Promise.reject(fetchError));

    await expect(
      offlineService.fetchWithOfflineFirst('@travelmate:cache:test', fetcher, 1000)
    ).rejects.toBe(fetchError);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(mockStorage.has('@travelmate:cache:test')).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Fetch failed, no cache available:', fetchError);
    consoleErrorSpy.mockRestore();
  });

  it('returns null for an offline cache miss without calling the network fetcher', async () => {
    mockNetInfo.fetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
    });
    const { offlineService } = loadOfflineService();
    await offlineService.initialize();
    const fetcher = jest.fn(() => Promise.resolve({ fresh: true }));

    await expect(
      offlineService.fetchWithOfflineFirst('@travelmate:cache:test', fetcher, 1000)
    ).resolves.toBeNull();

    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('offlineService local metadata storage', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockAsyncStorage.getAllKeys.mockClear();
    mockNetInfo.fetch.mockReset();
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
    mockNetInfo.addEventListener.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.put.mockClear();
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  });

  it('removes corrupted offline pages instead of repeatedly treating them as empty', async () => {
    const { offlineService } = loadOfflineService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockStorage.set(OFFLINE_PAGES_KEY, '{not valid json');

    await expect(offlineService.getOfflinePages()).resolves.toEqual({});

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(OFFLINE_PAGES_KEY);
    expect(mockStorage.has(OFFLINE_PAGES_KEY)).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get offline pages:',
      expect.any(SyntaxError)
    );
    consoleErrorSpy.mockRestore();
  });

  it('removes offline pages with invalid storage shape', async () => {
    const { offlineService } = loadOfflineService();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockStorage.set(
      OFFLINE_PAGES_KEY,
      JSON.stringify({
        seoul: {
          content: { title: '서울 일정' },
          savedAt: 'not-a-number',
        },
      })
    );

    await expect(offlineService.getOfflinePages()).resolves.toEqual({});

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(OFFLINE_PAGES_KEY);
    expect(mockStorage.has(OFFLINE_PAGES_KEY)).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get offline pages:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('returns null and removes invalid last sync timestamps', async () => {
    const { offlineService } = loadOfflineService();
    mockStorage.set(LAST_SYNC_KEY, 'not-a-number');

    await expect(offlineService.getLastSyncTime()).resolves.toBeNull();

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(LAST_SYNC_KEY);
    expect(mockStorage.has(LAST_SYNC_KEY)).toBe(false);
  });

  it('returns valid last sync timestamps unchanged', async () => {
    const { offlineService } = loadOfflineService();
    mockStorage.set(LAST_SYNC_KEY, '1785123456789');

    await expect(offlineService.getLastSyncTime()).resolves.toBe(1785123456789);

    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('removes malformed cache entries during expired cache cleanup', async () => {
    const { offlineService } = loadOfflineService();
    mockStorage.set(
      '@travelmate:cache:malformed',
      JSON.stringify({
        data: { stale: true },
        timestamp: Date.now(),
        expiresAt: 'not-a-number',
      })
    );
    mockStorage.set(
      '@travelmate:cache:valid',
      JSON.stringify({
        data: { fresh: true },
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000,
      })
    );

    await offlineService.clearExpiredCache();

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@travelmate:cache:malformed');
    expect(mockStorage.has('@travelmate:cache:malformed')).toBe(false);
    expect(mockStorage.has('@travelmate:cache:valid')).toBe(true);
  });
});
