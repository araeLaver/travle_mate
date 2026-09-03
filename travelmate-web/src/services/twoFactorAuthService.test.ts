import { twoFactorAuthService } from './twoFactorAuthService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('TwoFactorAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads 2FA status from the backend status endpoint', async () => {
    mockApiClient.get.mockResolvedValueOnce({ enabled: true });

    const result = await twoFactorAuthService.getStatus();

    expect(mockApiClient.get).toHaveBeenCalledWith('/auth/2fa/status');
    expect(result).toEqual({ enabled: true });
  });

  it('sets up 2FA with the selected method', async () => {
    const response = {
      secretKey: 'secret',
      qrCodeUri: 'otpauth://totp/Fryndo:user@example.com?secret=secret',
      backupCodes: ['12345678'],
    };
    mockApiClient.post.mockResolvedValueOnce(response);

    const result = await twoFactorAuthService.setup({ method: 'TOTP' });

    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/setup', { method: 'TOTP' });
    expect(result).toBe(response);
  });

  it('sends verification code bodies for enable, disable, and verify', async () => {
    mockApiClient.post
      .mockResolvedValueOnce({ success: true, message: 'enabled' })
      .mockResolvedValueOnce({ success: true, message: 'disabled' })
      .mockResolvedValueOnce({ valid: true, message: 'ok' });

    await twoFactorAuthService.enable('123456');
    await twoFactorAuthService.disable('234567');
    await twoFactorAuthService.verify('345678');

    expect(mockApiClient.post).toHaveBeenNthCalledWith(1, '/auth/2fa/enable', { code: '123456' });
    expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/auth/2fa/disable', { code: '234567' });
    expect(mockApiClient.post).toHaveBeenNthCalledWith(3, '/auth/2fa/verify', { code: '345678' });
  });

  it('loads and regenerates backup codes through backend endpoints', async () => {
    mockApiClient.get.mockResolvedValueOnce({ backupCodes: ['12345678'], count: 1 });
    mockApiClient.post.mockResolvedValueOnce({ backupCodes: ['87654321'], count: 1 });

    await twoFactorAuthService.getBackupCodes();
    await twoFactorAuthService.regenerateBackupCodes();

    expect(mockApiClient.get).toHaveBeenCalledWith('/auth/2fa/backup-codes');
    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/2fa/backup-codes/regenerate');
  });

  it('encodes QR code URIs and formats 8-character backup codes', () => {
    const uri = 'otpauth://totp/Fryndo:user@example.com?secret=a+b/c';

    expect(twoFactorAuthService.generateQrCodeUrl(uri)).toBe(
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth%3A%2F%2Ftotp%2FFryndo%3Auser%40example.com%3Fsecret%3Da%2Bb%2Fc'
    );
    expect(twoFactorAuthService.formatBackupCode('12345678')).toBe('1234-5678');
    expect(twoFactorAuthService.formatBackupCode('123456')).toBe('123456');
  });
});
