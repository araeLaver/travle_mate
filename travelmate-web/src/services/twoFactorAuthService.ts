/**
 * Two-Factor Authentication Service
 * 2FA 관리 API 서비스
 */

import { apiClient } from './apiClient';

// Types
export interface TwoFactorStatusResponse {
  enabled: boolean;
}

export interface TwoFactorSetupRequest {
  method?: 'TOTP' | 'SMS' | 'EMAIL';
}

export interface TwoFactorSetupResponse {
  secretKey: string;
  qrCodeUri: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export interface TwoFactorEnableResponse {
  success: boolean;
  message: string;
}

export interface TwoFactorVerifyResponse {
  valid: boolean;
  message: string;
}

export interface BackupCodesResponse {
  backupCodes: string[];
  count: number;
}

class TwoFactorAuthService {
  /**
   * Get 2FA status
   */
  async getStatus(): Promise<TwoFactorStatusResponse> {
    return apiClient.get<TwoFactorStatusResponse>('/auth/2fa/status');
  }

  /**
   * Start 2FA setup
   */
  async setup(request?: TwoFactorSetupRequest): Promise<TwoFactorSetupResponse> {
    return apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup', request || {});
  }

  /**
   * Enable 2FA
   */
  async enable(code: string): Promise<TwoFactorEnableResponse> {
    return apiClient.post<TwoFactorEnableResponse>('/auth/2fa/enable', { code });
  }

  /**
   * Disable 2FA
   */
  async disable(code: string): Promise<TwoFactorEnableResponse> {
    return apiClient.post<TwoFactorEnableResponse>('/auth/2fa/disable', { code });
  }

  /**
   * Verify 2FA code
   */
  async verify(code: string): Promise<TwoFactorVerifyResponse> {
    return apiClient.post<TwoFactorVerifyResponse>('/auth/2fa/verify', { code });
  }

  /**
   * Get backup codes
   */
  async getBackupCodes(): Promise<BackupCodesResponse> {
    return apiClient.get<BackupCodesResponse>('/auth/2fa/backup-codes');
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<BackupCodesResponse> {
    return apiClient.post<BackupCodesResponse>('/auth/2fa/backup-codes/regenerate');
  }

  /**
   * Generate QR code URL from URI
   */
  generateQrCodeUrl(uri: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
  }

  /**
   * Format backup code for display
   */
  formatBackupCode(code: string): string {
    if (code.length === 8) {
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    return code;
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
export default twoFactorAuthService;
