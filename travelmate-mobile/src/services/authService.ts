/**
 * Auth Service for TravelMate Mobile
 */

import { apiClient } from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string | null;
  user: User;
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl?: string;
  bio?: string;
  role: string;
  totalPoints: number;
  totalNftsCollected: number;
  createdAt: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
}

class AuthService {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      request,
      await apiClient.withDeviceHeaders()
    );
    this.assertRefreshToken(response);
    await apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    await apiClient.post<User>('/users/register', request);
    return this.login({
      email: request.email,
      password: request.password,
    });
  }

  async logout(): Promise<void> {
    try {
      const [refreshToken, { deviceId }] = await Promise.all([
        apiClient.getRefreshToken(),
        apiClient.getDeviceContext(),
      ]);

      await apiClient.post('/auth/logout', {
        refreshToken,
        deviceId,
      });
    } finally {
      await apiClient.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me');
  }

  async updateProfile(request: UpdateProfileRequest): Promise<User> {
    return apiClient.put<User>('/users/profile', request);
  }

  async uploadProfileImage(uri: string): Promise<{ url: string }> {
    return apiClient.uploadFile('/files/upload/profile', {
      uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const [token, refreshToken] = await Promise.all([
      apiClient.getToken(),
      apiClient.getRefreshToken(),
    ]);
    return !!token || !!refreshToken;
  }

  private assertRefreshToken(response: AuthResponse): void {
    if (!response.refreshToken) {
      throw new Error('모바일 로그인 응답에 refresh token이 없습니다.');
    }
  }
}

export const authService = new AuthService();
export default authService;
