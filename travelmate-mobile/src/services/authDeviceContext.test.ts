import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockDeviceHeaders = {
  'X-Client-Type': 'mobile',
  'X-Device-Id': 'mobile-ios-test-device',
  'X-Device-Name': 'TravelMate ios 1.0.0',
};

const mockDeviceContext = {
  deviceId: 'mobile-ios-test-device',
  deviceName: 'TravelMate ios 1.0.0',
};

const mockApiClient = {
  post: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  setTokens: jest.fn<(...args: unknown[]) => Promise<void>>(() => Promise.resolve()),
  clearTokens: jest.fn<(...args: unknown[]) => Promise<void>>(() => Promise.resolve()),
  getToken: jest.fn<() => Promise<string | null>>(() => Promise.resolve('access-token')),
  getRefreshToken: jest.fn<() => Promise<string | null>>(() => Promise.resolve('refresh-token')),
  withDeviceHeaders: jest.fn<() => Promise<{ headers: typeof mockDeviceHeaders }>>(() =>
    Promise.resolve({ headers: mockDeviceHeaders })
  ),
  getDeviceContext: jest.fn<() => Promise<typeof mockDeviceContext>>(() =>
    Promise.resolve(mockDeviceContext)
  ),
};

const loadServices = () => {
  jest.resetModules();
  jest.doMock('./apiClient', () => ({
    __esModule: true,
    apiClient: mockApiClient,
    default: mockApiClient,
  }));
  jest.doMock('expo-auth-session', () => ({
    useAutoDiscovery: jest.fn(),
  }));
  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: {
      expoConfig: {
        extra: {},
      },
    },
  }));

  const { authService } = require('./authService') as typeof import('./authService');
  const { socialAuthService } = require('./socialAuthService') as typeof import('./socialAuthService');
  return { authService, socialAuthService };
};

const authResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 1,
    email: 'traveler@example.com',
    nickname: 'traveler',
    role: 'USER',
    totalPoints: 0,
    totalNftsCollected: 0,
    createdAt: '2026-07-27T00:00:00',
  },
};

describe('mobile auth device context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.getToken.mockImplementation(() => Promise.resolve('access-token'));
    mockApiClient.getRefreshToken.mockImplementation(() => Promise.resolve('refresh-token'));
  });

  it('sends stable device headers when logging in with email', async () => {
    const { authService } = loadServices();
    mockApiClient.post.mockImplementationOnce(() => Promise.resolve(authResponse));

    await authService.login({
      email: 'traveler@example.com',
      password: 'password123',
    });

    expect(mockApiClient.withDeviceHeaders).toHaveBeenCalledTimes(1);
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/auth/login',
      {
        email: 'traveler@example.com',
        password: 'password123',
      },
      { headers: mockDeviceHeaders }
    );
    expect(mockApiClient.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
  });

  it('sends stable device context when logging in with Google', async () => {
    const { socialAuthService } = loadServices();
    mockApiClient.post.mockImplementationOnce(() => Promise.resolve({
      ...authResponse,
      isNewUser: false,
    }));

    await socialAuthService.authenticateWithGoogle('google-access-token');

    expect(mockApiClient.getDeviceContext).toHaveBeenCalledTimes(1);
    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/oauth/login', {
      accessToken: 'google-access-token',
      provider: 'google',
      deviceId: mockDeviceContext.deviceId,
      deviceName: mockDeviceContext.deviceName,
    });
    expect(mockApiClient.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
  });

  it('sends refresh token and device id when logging out', async () => {
    const { authService } = loadServices();
    mockApiClient.post.mockImplementationOnce(() => Promise.resolve({ message: 'logged out' }));

    await authService.logout();

    expect(mockApiClient.getRefreshToken).toHaveBeenCalledTimes(1);
    expect(mockApiClient.getDeviceContext).toHaveBeenCalledTimes(1);
    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout', {
      refreshToken: 'refresh-token',
      deviceId: mockDeviceContext.deviceId,
    });
    expect(mockApiClient.clearTokens).toHaveBeenCalledTimes(1);
  });

  it('treats a refresh-only session as recoverable authentication state', async () => {
    const { authService } = loadServices();
    mockApiClient.getToken.mockImplementationOnce(() => Promise.resolve(null));
    mockApiClient.getRefreshToken.mockImplementationOnce(() => Promise.resolve('refresh-token'));

    await expect(authService.isAuthenticated()).resolves.toBe(true);

    expect(mockApiClient.getToken).toHaveBeenCalledTimes(1);
    expect(mockApiClient.getRefreshToken).toHaveBeenCalledTimes(1);
  });

  it('returns unauthenticated when no mobile tokens are present', async () => {
    const { authService } = loadServices();
    mockApiClient.getToken.mockImplementationOnce(() => Promise.resolve(null));
    mockApiClient.getRefreshToken.mockImplementationOnce(() => Promise.resolve(null));

    await expect(authService.isAuthenticated()).resolves.toBe(false);
  });
});
