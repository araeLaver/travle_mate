/**
 * Social Authentication Service for TravelMate Mobile
 * Supports Google OAuth and Apple Sign In
 */

import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { apiClient } from './apiClient';

interface GoogleAuthConfig {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
  expoClientId?: string;
  scopes: string[];
}

const getConfiguredString = (envKey: string, extraKey: string): string | undefined => {
  const envValue = process.env[envKey];
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const extraValue = extra?.[extraKey];
  const value = typeof envValue === 'string' && envValue.trim()
    ? envValue
    : typeof extraValue === 'string'
      ? extraValue
      : undefined;

  if (!value) return undefined;

  const trimmed = value.trim();
  return trimmed.startsWith('YOUR_') ? undefined : trimmed;
};

export interface SocialAuthResponse {
  accessToken: string;
  refreshToken?: string | null;
  user: {
    id: number;
    email: string;
    nickname: string;
    profileImageUrl?: string;
    bio?: string;
    role: string;
    totalPoints: number;
    totalNftsCollected: number;
    createdAt: string;
  };
  isNewUser: boolean;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

class SocialAuthService {
  /**
   * Get Google OAuth discovery document
   */
  getGoogleDiscovery() {
    return AuthSession.useAutoDiscovery('https://accounts.google.com');
  }

  /**
   * Get Google auth request config
   */
  getGoogleAuthConfig(): GoogleAuthConfig {
    return {
      iosClientId: getConfiguredString('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'googleIosClientId'),
      androidClientId: getConfiguredString(
        'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
        'googleAndroidClientId'
      ),
      webClientId: getConfiguredString('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'googleWebClientId'),
      expoClientId: getConfiguredString(
        'EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID',
        'googleExpoClientId'
      ),
      scopes: ['openid', 'profile', 'email'],
    };
  }

  isGoogleSignInConfigured(): boolean {
    const config = this.getGoogleAuthConfig();
    return Boolean(
      config.iosClientId ||
      config.androidClientId ||
      config.webClientId ||
      config.expoClientId
    );
  }

  /**
   * Send Google OAuth token to backend for authentication
   */
  async authenticateWithGoogle(accessToken: string): Promise<SocialAuthResponse> {
    const { deviceId, deviceName } = await apiClient.getDeviceContext();
    const response = await apiClient.post<SocialAuthResponse>('/auth/oauth/login', {
      accessToken,
      provider: 'google',
      deviceId,
      deviceName,
    });
    this.assertRefreshToken(response);
    await apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  /**
   * Fetch Google user info using access token
   */
  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.json();
  }

  /**
   * Handle Google sign-in with access token (fallback if no idToken)
   */
  async handleGoogleAccessToken(accessToken: string): Promise<SocialAuthResponse> {
    return this.authenticateWithGoogle(accessToken);
  }

  /**
   * Apple Sign In
   */
  async signInWithApple(): Promise<SocialAuthResponse> {
    throw new Error('Apple 로그인은 현재 서버에서 지원되지 않습니다.');
  }

  /**
   * Check if Apple Sign In is available
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    return false;
  }

  private assertRefreshToken(response: SocialAuthResponse): void {
    if (!response.refreshToken) {
      throw new Error('모바일 소셜 로그인 응답에 refresh token이 없습니다.');
    }
  }
}

export const socialAuthService = new SocialAuthService();
export default socialAuthService;
