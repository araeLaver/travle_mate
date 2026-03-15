/**
 * Social Authentication Service for TravelMate Mobile
 * Supports Google OAuth and Apple Sign In
 */

import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

// Google OAuth Config
const GOOGLE_CLIENT_ID_IOS = 'YOUR_GOOGLE_IOS_CLIENT_ID';
const GOOGLE_CLIENT_ID_ANDROID = 'YOUR_GOOGLE_ANDROID_CLIENT_ID';
const GOOGLE_CLIENT_ID_WEB = 'YOUR_GOOGLE_WEB_CLIENT_ID';

export interface SocialAuthResponse {
  accessToken: string;
  refreshToken: string;
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
  getGoogleAuthConfig() {
    return {
      iosClientId: GOOGLE_CLIENT_ID_IOS,
      androidClientId: GOOGLE_CLIENT_ID_ANDROID,
      webClientId: GOOGLE_CLIENT_ID_WEB,
      scopes: ['openid', 'profile', 'email'],
    };
  }

  /**
   * Send Google OAuth token to backend for authentication
   */
  async authenticateWithGoogle(idToken: string): Promise<SocialAuthResponse> {
    const response = await apiClient.post<SocialAuthResponse>('/auth/oauth/google', {
      idToken,
      provider: 'google',
    });
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
    const userInfo = await this.getGoogleUserInfo(accessToken);
    const response = await apiClient.post<SocialAuthResponse>('/auth/oauth/google', {
      accessToken,
      email: userInfo.email,
      name: userInfo.name,
      profileImageUrl: userInfo.picture,
      provider: 'google',
    });
    await apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  /**
   * Apple Sign In
   */
  async signInWithApple(): Promise<SocialAuthResponse> {
    const nonce = await this.generateNonce();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
      nonce: hashedNonce,
    });

    const response = await apiClient.post<SocialAuthResponse>('/auth/oauth/apple', {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      fullName: credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : undefined,
      email: credential.email,
      nonce,
      provider: 'apple',
    });

    await apiClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  /**
   * Check if Apple Sign In is available
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    return AppleAuthentication.isAvailableAsync();
  }

  /**
   * Generate random nonce for Apple Sign In
   */
  private async generateNonce(length: number = 32): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    return Array.from(randomBytes)
      .map(byte => chars[byte % chars.length])
      .join('');
  }
}

export const socialAuthService = new SocialAuthService();
export default socialAuthService;
