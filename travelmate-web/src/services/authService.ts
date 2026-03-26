import { logger } from '../lib/utils';

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

export interface OAuthCodeLoginRequest {
  provider: 'naver' | 'kakao';
  code: string;
  redirectUri: string;
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

export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  fullName?: string;
  profileImageUrl?: string;
}

class AuthService {
  // SECURITY: 토큰은 메모리에만 저장 (XSS 공격 방지)
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private refreshPromise: Promise<TokenResponse> | null = null; // Race condition 방지
  private currentUser: CurrentUser | null = null;

  constructor() {
    // SECURITY: localStorage에서 토큰 제거 (마이그레이션)
    // 토큰은 메모리에만 저장하고, 페이지 새로고침 시 httpOnly 쿠키로 갱신
    this.migrateFromLocalStorage();

    // 저장된 사용자 ID로 사용자 정보 복원 시도
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
      // 사용자 ID만 저장하고, 상세 정보는 토큰 갱신 시 서버에서 가져옴
      this.currentUser = { id: parseInt(savedUserId) } as CurrentUser;
    }
  }

  /**
   * localStorage에 저장된 민감한 토큰 정보 제거 (마이그레이션)
   */
  private migrateFromLocalStorage(): void {
    // 기존에 저장된 토큰 정보 모두 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser'); // 민감한 사용자 정보도 제거
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
        credentials: 'include', // httpOnly 쿠키 수신을 위해 필수
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
      logger.error('Login error:', error);
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
        credentials: 'include', // httpOnly 쿠키 수신을 위해 필수
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
      logger.error('OAuth login error:', error);
      throw error;
    }
  }

  async oauthCodeLogin(request: OAuthCodeLoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/oauth/code-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...request,
          deviceId: this.getDeviceId(),
          deviceName: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OAuth 코드 로그인 실패: ${response.status} - ${errorData}`);
      }

      const data: LoginResponse = await response.json();
      this.saveTokens(data);

      return data;
    } catch (error) {
      logger.error('OAuth code login error:', error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<TokenResponse> {
    // 이미 갱신 중인 경우 기존 Promise 반환 (Race Condition 방지)
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshToken();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefreshToken(): Promise<TokenResponse> {
    try {
      // Refresh token은 httpOnly 쿠키로 자동 전송됨
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // httpOnly 쿠키 전송을 위해 필수
        body: JSON.stringify({
          deviceId: this.getDeviceId(),
        }),
      });

      if (!response.ok) {
        // Refresh token도 만료된 경우 로그아웃
        this.logout();
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
      }

      const data: TokenResponse = await response.json();

      // SECURITY: 토큰은 메모리에만 저장
      this.accessToken = data.accessToken;
      this.tokenExpiresAt = Date.now() + data.expiresIn * 1000;

      return data;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  private saveTokens(data: LoginResponse): void {
    // SECURITY: 토큰은 메모리에만 저장 (XSS 공격 방지)
    this.accessToken = data.accessToken;
    this.tokenExpiresAt = Date.now() + data.expiresIn * 1000;

    // 사용자 정보 저장 (메모리)
    if (data.user) {
      this.currentUser = {
        id: data.user.id,
        email: data.user.email,
        nickname: data.user.nickname,
        fullName: data.user.fullName,
        profileImageUrl: data.user.profileImageUrl,
      };
      // SECURITY: 사용자 ID만 localStorage에 저장 (세션 복원용)
      localStorage.setItem('currentUserId', data.user.id.toString());
    }
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

    if (this.isTokenExpired()) {
      try {
        // Refresh token은 httpOnly 쿠키로 관리되므로 별도 체크 불필요
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
      logger.error('Register error:', error);
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
            Authorization: `Bearer ${this.accessToken}`,
          },
          credentials: 'include', // httpOnly 쿠키 전송 및 삭제를 위해 필수
          body: JSON.stringify({
            logoutAll,
          }),
        });
      }
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  private clearTokens(): void {
    // 메모리에서 토큰 제거
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.currentUser = null;
    // localStorage에서 사용자 ID 제거
    localStorage.removeItem('currentUserId');
    // 기존 데이터 정리 (마이그레이션)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    // refreshToken은 서버에서 httpOnly 쿠키 삭제 처리
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getUser(): CurrentUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    // Access Token이 있고 만료되지 않았거나, httpOnly 쿠키로 갱신 가능한 경우
    return this.accessToken !== null && !this.isTokenExpired();
  }

  hasRefreshCapability(): boolean {
    // Refresh token은 httpOnly 쿠키로 관리되므로 클라이언트에서 확인 불가
    // 토큰 갱신 시도 후 결과로 판단
    return true;
  }

  /**
   * 앱 초기화 시 세션 복원 시도
   * httpOnly 쿠키에 저장된 refresh token을 사용하여 access token 갱신
   */
  async tryRestoreSession(): Promise<boolean> {
    const savedUserId = localStorage.getItem('currentUserId');
    if (!savedUserId) {
      return false;
    }

    try {
      await this.refreshAccessToken();
      return true;
    } catch {
      // 세션 복원 실패 시 저장된 사용자 ID 제거
      localStorage.removeItem('currentUserId');
      this.currentUser = null;
      return false;
    }
  }

  async checkEmailDuplicate(email: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/check-email?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`이메일 중복 체크 실패: ${response.status}`);
      }

      const data: { exists: boolean } = await response.json();
      return data.exists;
    } catch (error) {
      logger.error('Email duplicate check error:', error);
      throw error;
    }
  }

  async checkNicknameDuplicate(nickname: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/check-nickname?nickname=${encodeURIComponent(nickname)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`닉네임 중복 체크 실패: ${response.status}`);
      }

      const data: { exists: boolean } = await response.json();
      return data.exists;
    } catch (error) {
      logger.error('Nickname duplicate check error:', error);
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
