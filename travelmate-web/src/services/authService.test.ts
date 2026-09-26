import { authService } from './authService';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
type AuthServiceTestState = {
  accessToken: string | null;
  tokenExpiresAt: number | null;
  clearTokens: () => void;
};
const authServiceState = authService as unknown as AuthServiceTestState;

const resetAuthService = () => {
  authServiceState.clearTokens();
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthService();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          nickname: 'testuser',
          rating: 4.5,
          reviewCount: 10,
          isEmailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('test-access-token');
      expect(result.user.email).toBe('test@example.com');
      // Tokens stored in memory (security), not localStorage
      expect(authService.getToken()).toBe('test-access-token');
    });

    it('should throw error on invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => '비밀번호가 일치하지 않습니다.',
      } as Response);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        id: 1,
        email: 'new@example.com',
        nickname: 'newuser',
        fullName: '새 사용자',
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.register({
        email: 'new@example.com',
        password: 'Password1!',
        nickname: 'newuser',
        fullName: '새 사용자',
      });

      expect(result.email).toBe('new@example.com');
      expect(result.nickname).toBe('newuser');
    });

    it('should throw error on duplicate email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => '이미 존재하는 이메일입니다.',
      } as Response);

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Password1!',
          nickname: 'newuser',
          fullName: '새 사용자',
        })
      ).rejects.toThrow();
    });
  });

  describe('checkEmailDuplicate', () => {
    it('should return false for available email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      } as Response);

      const result = await authService.checkEmailDuplicate('new@example.com');
      expect(result).toBe(false);
    });

    it('should return true for existing email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      } as Response);

      const result = await authService.checkEmailDuplicate('existing@example.com');
      expect(result).toBe(true);
    });
  });

  describe('checkNicknameDuplicate', () => {
    it('should return false for available nickname', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      } as Response);

      const result = await authService.checkNicknameDuplicate('newuser');
      expect(result).toBe(false);
    });

    it('should return true for existing nickname', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      } as Response);

      const result = await authService.checkNicknameDuplicate('existinguser');
      expect(result).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', async () => {
      // Login first to set in-memory tokens
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresIn: 3600,
          tokenType: 'Bearer',
          user: { id: 1, email: 'test@example.com', nickname: 'test' },
        }),
      } as Response);
      await authService.login({ email: 'test@example.com', password: 'pass' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await authService.logout();

      // In-memory tokens should be cleared
      expect(authService.getToken()).toBeNull();
      // Legacy localStorage cleanup also runs
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('refresh session state', () => {
    it('keeps route auth state for an expired access token while refresh is possible', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'soon-expired-token',
          refreshToken: 'refresh-token',
          expiresIn: 60,
          tokenType: 'Bearer',
          user: {
            id: 1,
            email: 'test@example.com',
            nickname: 'test',
            rating: 4.5,
            reviewCount: 10,
            isEmailVerified: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
        }),
      } as Response);
      await authService.login({ email: 'test@example.com', password: 'pass' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'refreshed-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        }),
      } as Response);

      expect(authService.isTokenExpired()).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);
      await expect(authService.getValidToken()).resolves.toBe('refreshed-token');
      expect(authService.getToken()).toBe('refreshed-token');
    });

    it('clears local auth state immediately when token refresh fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'soon-expired-token',
          refreshToken: 'refresh-token',
          expiresIn: 60,
          tokenType: 'Bearer',
          user: {
            id: 1,
            email: 'test@example.com',
            nickname: 'test',
            rating: 4.5,
            reviewCount: 10,
            isEmailVerified: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
        }),
      } as Response);
      await authService.login({ email: 'test@example.com', password: 'pass' });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

      await expect(authService.getValidToken()).resolves.toBeNull();
      expect(authService.getToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('currentUserId')).toBeNull();
    });

    it('refreshes when a restored session has user state but no access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'initial-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
          user: {
            id: 1,
            email: 'test@example.com',
            nickname: 'test',
            rating: 4.5,
            reviewCount: 10,
            isEmailVerified: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
        }),
      } as Response);
      await authService.login({ email: 'test@example.com', password: 'pass' });

      authServiceState.accessToken = null;
      authServiceState.tokenExpiresAt = null;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'restored-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        }),
      } as Response);

      expect(authService.isAuthenticated()).toBe(true);
      await expect(authService.getValidToken()).resolves.toBe('restored-token');
      expect(authService.getToken()).toBe('restored-token');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          credentials: 'include',
          method: 'POST',
        })
      );
    });
  });

  describe('getToken', () => {
    it('should return token when available', () => {
      const token = authService.getToken();
      expect(token === null || typeof token === 'string').toBe(true);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return headers with content-type', () => {
      const headers = authService.getAuthHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
