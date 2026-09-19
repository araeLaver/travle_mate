import { act, renderHook, waitFor } from '@testing-library/react';
import { useNetworkStatus, useOfflineQueue } from './useNetworkStatus';
import { authService } from '../services/authService';

jest.mock('../services/authService', () => ({
  authService: {
    getValidToken: jest.fn(),
    refreshAccessToken: jest.fn(),
  },
}));

global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockGetValidToken = authService.getValidToken as jest.MockedFunction<
  typeof authService.getValidToken
>;
const mockRefreshAccessToken = authService.refreshAccessToken as jest.MockedFunction<
  typeof authService.refreshAccessToken
>;

const setOnline = (online: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => online,
  });
};

describe('useOfflineQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setOnline(true);
  });

  it('replays API requests with refreshed auth and removes them on success', async () => {
    mockGetValidToken.mockResolvedValue('valid-token');
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    const { result } = renderHook(() => useOfflineQueue());

    act(() => {
      result.current.addToQueue({
        url: 'http://localhost:8080/api/reviews',
        method: 'POST',
        body: JSON.stringify({ rating: 5 }),
      });
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/reviews',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        }),
        method: 'POST',
      })
    );
    await waitFor(() => expect(result.current.queueSize).toBe(0));
  });

  it('refreshes auth once and retries queued API requests after 401', async () => {
    mockGetValidToken.mockResolvedValueOnce('stale-token').mockResolvedValueOnce('fresh-token');
    mockRefreshAccessToken.mockResolvedValueOnce({
      accessToken: 'fresh-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    });
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

    const { result } = renderHook(() => useOfflineQueue());

    act(() => {
      result.current.addToQueue({
        url: 'http://localhost:8080/api/reviews',
        method: 'POST',
        body: JSON.stringify({ rating: 5 }),
      });
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/reviews',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer stale-token' }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/reviews',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }),
      })
    );
    await waitFor(() => expect(result.current.queueSize).toBe(0));
  });

  it('keeps failed API requests queued for retry', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetValidToken.mockResolvedValue('valid-token');
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useOfflineQueue());

    act(() => {
      result.current.addToQueue({
        url: 'http://localhost:8080/api/reviews',
        method: 'POST',
        body: JSON.stringify({ rating: 5 }),
      });
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(result.current.queueSize).toBe(1);
    expect(JSON.parse(localStorage.getItem('tm_offline_queue') ?? '[]')).toHaveLength(1);

    consoleErrorSpy.mockRestore();
  });

  it('does not attach app auth credentials to external queued URLs', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    const { result } = renderHook(() => useOfflineQueue());

    act(() => {
      result.current.addToQueue({
        url: 'https://example.com/webhook',
        method: 'POST',
        body: JSON.stringify({ event: 'queued' }),
      });
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockGetValidToken).not.toHaveBeenCalled();
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        credentials: 'same-origin',
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );
  });
});

describe('useNetworkStatus', () => {
  beforeEach(() => {
    setOnline(true);
  });

  it('marks recovery after the app moves from offline to online', () => {
    setOnline(false);
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(false);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });
});
