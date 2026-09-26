import { apiClient } from './apiClient';
import { authService } from './authService';

jest.mock('./authService', () => ({
  authService: {
    getToken: jest.fn(),
    getValidToken: jest.fn(),
    refreshAccessToken: jest.fn(),
  },
}));

global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('ApiClient uploadFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes the access token and retries authenticated JSON requests once after 401', async () => {
    mockAuthService.getValidToken
      .mockResolvedValueOnce('stale-token')
      .mockResolvedValueOnce('fresh-token');
    mockAuthService.refreshAccessToken.mockResolvedValueOnce({
      accessToken: 'fresh-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    });
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'expired' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, email: 'user@example.com' }),
      } as Response);

    await expect(apiClient.get('/users/me')).resolves.toEqual({
      id: 1,
      email: 'user@example.com',
    });

    expect(mockAuthService.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer stale-token' }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }),
      })
    );
  });

  it('does not refresh or retry unauthenticated JSON requests after 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'unauthorized' }),
    } as Response);

    await expect(apiClient.get('/public', false)).rejects.toMatchObject({
      status: 401,
      message: 'unauthorized',
    });

    expect(mockAuthService.getValidToken).not.toHaveBeenCalled();
    expect(mockAuthService.refreshAccessToken).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('uses refresh-aware tokens for multipart uploads', async () => {
    mockAuthService.getValidToken.mockResolvedValueOnce('fresh-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        url: 'https://cdn.example.com/profile.png',
        fileName: 'profile.png',
        fileSize: 5,
        contentType: 'image/png',
      }),
    } as Response);

    await apiClient.uploadFile(
      '/files/upload/profile',
      new File(['image'], 'profile.png', { type: 'image/png' })
    );

    expect(mockAuthService.getValidToken).toHaveBeenCalledTimes(1);
    expect(mockAuthService.getToken).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/files/upload/profile'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer fresh-token' },
        body: expect.any(FormData),
      })
    );
  });
});
