import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

type RequestConfig = {
  url: string;
  headers: Record<string, string>;
  _retry?: boolean;
};

type AxiosErrorLike = {
  response?: { status: number };
  config?: RequestConfig;
};

type ResponseRejected = (error: AxiosErrorLike) => Promise<unknown>;
type RequestFulfilled = (config: RequestConfig) => Promise<RequestConfig>;

const TOKEN_KEY = '@travelmate:token';
const REFRESH_TOKEN_KEY = '@travelmate:refreshToken';
const DEVICE_ID_KEY = '@travelmate:deviceId';
const originalApiUrl = process.env.API_URL;
const originalExpoPublicApiUrl = process.env.EXPO_PUBLIC_API_URL;

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

const mockClient = Object.assign(
  jest.fn((config: RequestConfig) => Promise.resolve({ data: { retried: config.url, config } })),
  {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  }
);

const mockAxios = {
  create: jest.fn(() => mockClient),
  post: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios,
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
      version: '1.0.0',
    },
  },
}));
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-random-uuid'),
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

const resetMocks = () => {
  mockStorage.clear();
  delete process.env.API_URL;
  delete process.env.EXPO_PUBLIC_API_URL;
  mockAsyncStorage.getItem.mockClear();
  mockAsyncStorage.setItem.mockClear();
  mockAsyncStorage.removeItem.mockClear();
  mockClient.mockClear();
  mockClient.get.mockClear();
  mockClient.post.mockClear();
  mockClient.put.mockClear();
  mockClient.delete.mockClear();
  mockClient.patch.mockClear();
  mockClient.interceptors.request.use.mockClear();
  mockClient.interceptors.response.use.mockClear();
  mockAxios.create.mockClear();
  mockAxios.post.mockReset();
};

const loadResponseRejected = async (): Promise<ResponseRejected> => {
  jest.resetModules();
  resetMocks();
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;

  jest.isolateModules(() => {
    require('./apiClient');
  });

  const rejected = mockClient.interceptors.response.use.mock.calls[0]?.[1] as
    | ResponseRejected
    | undefined;
  expect(rejected).toBeDefined();
  return rejected as ResponseRejected;
};

const loadRequestFulfilled = async (): Promise<RequestFulfilled> => {
  jest.resetModules();
  resetMocks();
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;

  jest.isolateModules(() => {
    require('./apiClient');
  });

  const fulfilled = mockClient.interceptors.request.use.mock.calls[0]?.[0] as
    | RequestFulfilled
    | undefined;
  expect(fulfilled).toBeDefined();
  return fulfilled as RequestFulfilled;
};

const flushMicrotasks = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

describe('mobile apiClient refresh queue', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('trims stored access tokens before attaching authorization headers', async () => {
    const fulfilled = await loadRequestFulfilled();
    mockStorage.set(TOKEN_KEY, '  stored-access-token  ');

    const config = await fulfilled({ url: '/users/me', headers: {} });

    expect(config.headers.Authorization).toBe('Bearer stored-access-token');
    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith(TOKEN_KEY);
  });

  it('removes blank stored access tokens instead of attaching invalid authorization headers', async () => {
    const fulfilled = await loadRequestFulfilled();
    mockStorage.set(TOKEN_KEY, '   ');

    const config = await fulfilled({ url: '/users/me', headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(mockStorage.has(TOKEN_KEY)).toBe(false);
  });

  it('retries queued 401 requests with the refreshed access token', async () => {
    const rejected = await loadResponseRejected();
    mockStorage.set(REFRESH_TOKEN_KEY, 'stored-refresh-token');
    mockStorage.set(DEVICE_ID_KEY, 'mobile-test-device');

    let resolveRefresh:
      | ((value: { data: { accessToken: string; refreshToken: string } }) => void)
      | undefined;
    mockAxios.post.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveRefresh = resolve;
        })
    );

    const firstConfig: RequestConfig = { url: '/first', headers: {} };
    const secondConfig: RequestConfig = { url: '/second', headers: {} };

    const firstRequest = rejected({ response: { status: 401 }, config: firstConfig });
    const secondRequest = rejected({ response: { status: 401 }, config: secondConfig });

    await flushMicrotasks();
    expect(resolveRefresh).toBeDefined();
    resolveRefresh?.({
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });

    await expect(firstRequest).resolves.toMatchObject({
      data: { retried: '/first' },
    });
    await expect(secondRequest).resolves.toMatchObject({
      data: { retried: '/second' },
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(TOKEN_KEY, 'new-access-token');
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY, 'new-refresh-token');
    expect(mockAxios.post).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/refresh',
      {
        refreshToken: 'stored-refresh-token',
        deviceId: 'mobile-test-device',
      },
      {
        headers: {
          'X-Client-Type': 'mobile',
        },
      }
    );
    expect(firstConfig.headers.Authorization).toBe('Bearer new-access-token');
    expect(secondConfig.headers.Authorization).toBe('Bearer new-access-token');
    expect(mockClient).toHaveBeenCalledTimes(2);
  });

  it('rejects queued 401 requests and clears tokens when refresh fails', async () => {
    const rejected = await loadResponseRejected();
    mockStorage.set(TOKEN_KEY, 'stale-access-token');
    mockStorage.set(REFRESH_TOKEN_KEY, 'stale-refresh-token');
    mockStorage.set(DEVICE_ID_KEY, 'mobile-test-device');

    const refreshError = new Error('refresh failed');
    let rejectRefresh: ((error: Error) => void) | undefined;
    mockAxios.post.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectRefresh = reject;
        })
    );

    const firstRequest = rejected({
      response: { status: 401 },
      config: { url: '/first', headers: {} },
    });
    const secondRequest = rejected({
      response: { status: 401 },
      config: { url: '/second', headers: {} },
    });

    await flushMicrotasks();
    expect(rejectRefresh).toBeDefined();
    rejectRefresh?.(refreshError);

    const results = await Promise.allSettled([firstRequest, secondRequest]);

    expect(results).toEqual([
      expect.objectContaining({ status: 'rejected', reason: refreshError }),
      expect.objectContaining({ status: 'rejected', reason: refreshError }),
    ]);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
    expect(mockClient).not.toHaveBeenCalled();
  });

  it('rejects refresh retries without calling the backend when the stored refresh token is blank', async () => {
    const rejected = await loadResponseRejected();
    mockStorage.set(TOKEN_KEY, 'stale-access-token');
    mockStorage.set(REFRESH_TOKEN_KEY, '   ');

    await expect(
      rejected({
        response: { status: 401 },
        config: { url: '/needs-refresh', headers: {} },
      })
    ).rejects.toThrow('No refresh token');

    expect(mockAxios.post).not.toHaveBeenCalled();
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
    expect(mockStorage.has(TOKEN_KEY)).toBe(false);
    expect(mockStorage.has(REFRESH_TOKEN_KEY)).toBe(false);
  });

  it('creates stable device headers for login requests', async () => {
    jest.resetModules();
    resetMocks();
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;

    const { apiClient } = require('./apiClient') as typeof import('./apiClient');

    const firstHeaders = await apiClient.getDeviceHeaders();
    const secondHeaders = await apiClient.getDeviceHeaders();

    expect(firstHeaders).toEqual({
      'X-Device-Id': 'mobile-ios-test-random-uuid',
      'X-Device-Name': 'TravelMate ios 1.0.0',
    });
    expect(secondHeaders).toEqual(firstHeaders);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      DEVICE_ID_KEY,
      'mobile-ios-test-random-uuid'
    );
    expect(mockStorage.get(DEVICE_ID_KEY)).toBe('mobile-ios-test-random-uuid');
  });

  it('regenerates blank stored device ids before creating device headers', async () => {
    jest.resetModules();
    resetMocks();
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    mockStorage.set(DEVICE_ID_KEY, '   ');

    const { apiClient } = require('./apiClient') as typeof import('./apiClient');

    await expect(apiClient.getDeviceHeaders()).resolves.toEqual({
      'X-Device-Id': 'mobile-ios-test-random-uuid',
      'X-Device-Name': 'TravelMate ios 1.0.0',
    });

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(DEVICE_ID_KEY);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      DEVICE_ID_KEY,
      'mobile-ios-test-random-uuid'
    );
  });

  it('trims stored device ids before creating device headers', async () => {
    jest.resetModules();
    resetMocks();
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    mockStorage.set(DEVICE_ID_KEY, '  mobile-existing-device  ');

    const { apiClient } = require('./apiClient') as typeof import('./apiClient');

    await expect(apiClient.getDeviceHeaders()).resolves.toEqual({
      'X-Device-Id': 'mobile-existing-device',
      'X-Device-Name': 'TravelMate ios 1.0.0',
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(DEVICE_ID_KEY, 'mobile-existing-device');
  });

  it('reads the stored refresh token for authenticated logout requests', async () => {
    jest.resetModules();
    resetMocks();
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    mockStorage.set(REFRESH_TOKEN_KEY, 'stored-refresh-token');

    const { apiClient } = require('./apiClient') as typeof import('./apiClient');

    await expect(apiClient.getRefreshToken()).resolves.toBe('stored-refresh-token');
    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
  });

  it('prefers EXPO_PUBLIC_API_URL for mobile API base URL configuration', () => {
    jest.resetModules();
    resetMocks();
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    process.env.API_URL = 'https://legacy-api.example.com/api';
    process.env.EXPO_PUBLIC_API_URL = 'https://public-api.example.com';

    require('./apiClient');

    expect(mockAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://public-api.example.com/api',
      })
    );
  });

  it('ignores blank configured API URLs and falls back to the development URL', () => {
    jest.resetModules();
    resetMocks();
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    process.env.API_URL = '   ';
    process.env.EXPO_PUBLIC_API_URL = '   ';

    require('./apiClient');

    expect(mockAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://localhost:8080/api',
      })
    );
  });
});

afterAll(() => {
  if (originalApiUrl === undefined) {
    delete process.env.API_URL;
  } else {
    process.env.API_URL = originalApiUrl;
  }

  if (originalExpoPublicApiUrl === undefined) {
    delete process.env.EXPO_PUBLIC_API_URL;
  } else {
    process.env.EXPO_PUBLIC_API_URL = originalExpoPublicApiUrl;
  }
});
