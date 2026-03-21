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
  refreshToken: string;
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
    const response = await apiClient.post<AuthResponse>('/auth/login', request);
    await apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', request);
    await apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await apiClient.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  async updateProfile(request: UpdateProfileRequest): Promise<User> {
    return apiClient.put<User>('/users/profile', request);
  }

  async uploadProfileImage(uri: string): Promise<{ url: string }> {
    return apiClient.uploadFile('/users/profile/image', {
      uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
export default authService;
