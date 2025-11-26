const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: number;
    email: string;
    nickname: string;
    fullName?: string;
    profileImageUrl?: string;
    rating: number;
    reviewCount: number;
    isEmailVerified: boolean;
    createdAt: string;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface OAuthLoginRequest {
  provider: 'google' | 'kakao' | 'naver';
  accessToken: string;
  deviceId?: string;
  deviceName?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  fullName?: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  nickname: string;
  fullName?: string;
  createdAt: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    this.tokenExpiresAt = expiresAt ? parseInt(expiresAt) : null;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': this.getDeviceId(),
          'X-Device-Name': navigator.userAgent,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`로그인 실패: ${response.status} - ${errorData}`);
      }

      const data: LoginResponse = await response.json();
      this.saveTokens(data);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async oauthLogin(request: OAuthLoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/oauth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          deviceId: this.getDeviceId(),
          deviceName: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OAuth 로그인 실패: ${response.status} - ${errorData}`);
      }

      const data: LoginResponse = await response.json();
      this.saveTokens(data);

      return data;
    } catch (error) {
      console.error('OAuth login error:', error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<TokenResponse> {
    if (!this.refreshToken) {
      throw new Error('Refresh token이 없습니다.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
          deviceId: this.getDeviceId(),
        }),
      });

      if (!response.ok) {
        // Refresh token도 만료된 경우 로그아웃
        this.logout();
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
      }

      const data: TokenResponse = await response.json();

      this.accessToken = data.accessToken;
      this.tokenExpiresAt = Date.now() + data.expiresIn * 1000;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('tokenExpiresAt', this.tokenExpiresAt.toString());

      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  private saveTokens(data: LoginResponse): void {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.tokenExpiresAt = Date.now() + data.expiresIn * 1000;

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('tokenExpiresAt', this.tokenExpiresAt.toString());

    // 기존 호환성을 위해 authToken도 저장
    localStorage.setItem('authToken', data.accessToken);
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'web-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    // 5분 전에 만료로 간주 (갱신 여유 시간)
    return Date.now() > this.tokenExpiresAt - 5 * 60 * 1000;
  }

  async getValidToken(): Promise<string | null> {
    if (!this.accessToken) return null;

    if (this.isTokenExpired() && this.refreshToken) {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        return null;
      }
    }

    return this.accessToken;
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`회원가입 실패: ${response.status} - ${errorData}`);
      }

      const data: RegisterResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(logoutAll: boolean = false): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            refreshToken: this.refreshToken,
            logoutAll,
          }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null && !this.isTokenExpired();
  }

  async checkEmailDuplicate(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`이메일 중복 체크 실패: ${response.status}`);
      }

      const data: { exists: boolean } = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Email duplicate check error:', error);
      throw error;
    }
  }

  async checkNicknameDuplicate(nickname: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`닉네임 중복 체크 실패: ${response.status}`);
      }

      const data: { exists: boolean } = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Nickname duplicate check error:', error);
      throw error;
    }
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }
}

export const authService = new AuthService();