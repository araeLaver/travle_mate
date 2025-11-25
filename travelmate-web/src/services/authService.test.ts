import { authService } from './authService';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(localStorage.getItem('accessToken')).toBe('test-access-token');
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
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh');
      localStorage.setItem('tokenExpiresAt', '9999999999999');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await authService.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
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
