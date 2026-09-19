/**
 * Two-Factor Authentication Settings Component
 * 2FA 설정 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { twoFactorAuthService, TwoFactorSetupResponse } from '../../services/twoFactorAuthService';

interface TwoFactorSettingsProps {
  className?: string;
}

type Step = 'status' | 'setup' | 'verify' | 'backup' | 'disable';

const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ className = '' }) => {
  const [step, setStep] = useState<Step>('status');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await twoFactorAuthService.getStatus();
      setIsEnabled(status.enabled);
      setStep('status');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to check 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await twoFactorAuthService.setup({ method: 'TOTP' });
      setSetupData(data);
      setBackupCodes(data.backupCodes);
      setStep('setup');
    } catch (err) {
      setError('2FA 설정을 시작하는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await twoFactorAuthService.enable(verificationCode);
      if (response.success) {
        setIsEnabled(true);
        setStep('backup');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('인증 코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await twoFactorAuthService.disable(verificationCode);
      setIsEnabled(false);
      setVerificationCode('');
      setStep('status');
    } catch (err) {
      setError('인증 코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setLoading(true);
    try {
      const response = await twoFactorAuthService.regenerateBackupCodes();
      setBackupCodes(response.backupCodes);
    } catch (err) {
      setError('백업 코드 재생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes
      .map(code => twoFactorAuthService.formatBackupCode(code))
      .join('\n');
    navigator.clipboard.writeText(codesText);
  };

  if (loading && step === 'status') {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-[18px] shadow-[0_10px_30px_rgba(16,16,20,0.06)] p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-[18px] shadow-[0_10px_30px_rgba(16,16,20,0.06)] p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-[11px]">
          <svg
            className="w-6 h-6 text-primary-500 dark:text-primary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-ink dark:text-white">
            2단계 인증 (2FA)
          </h2>
          <p className="text-sm text-[#74747F] dark:text-gray-400">계정 보안을 강화하세요</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#FBF0EF] border border-[#F0D6D3] dark:border-transparent dark:bg-red-900/30 text-danger dark:text-red-400 rounded-[13px]">
          {error}
        </div>
      )}

      {/* Status View */}
      {step === 'status' && (
        <div>
          <div className="flex items-center justify-between p-4 bg-sand-100 dark:bg-gray-700/50 rounded-[13px] mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-success' : 'bg-sand-500'}`} />
              <span className="font-bold text-ink dark:text-white">
                {isEnabled ? '활성화됨' : '비활성화됨'}
              </span>
            </div>
            {isEnabled && (
              <span className="text-sm font-bold text-success dark:text-green-400">보호 중</span>
            )}
          </div>

          <p className="text-sm text-[#4A4A55] dark:text-gray-400 mb-6">
            2단계 인증을 사용하면 로그인 시 비밀번호 외에 인증 앱에서 생성된 코드를 입력해야 합니다.
            계정이 해킹되는 것을 방지하는 강력한 보안 기능입니다.
          </p>

          {isEnabled ? (
            <div className="space-y-3">
              <button
                onClick={() => setStep('disable')}
                className="w-full py-2 px-4 border-[1.5px] border-[#F0D6D3] text-danger font-bold rounded-xl hover:bg-[#FBF0EF] dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                2FA 비활성화
              </button>
              <button
                onClick={async () => {
                  const response = await twoFactorAuthService.getBackupCodes();
                  setBackupCodes(response.backupCodes);
                  setStep('backup');
                }}
                className="w-full py-2 px-4 border-[1.5px] border-sand-400 text-ink font-bold rounded-xl hover:bg-sand-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                백업 코드 보기
              </button>
            </div>
          ) : (
            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full py-2 px-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '설정 중...' : '2FA 설정하기'}
            </button>
          )}
        </div>
      )}

      {/* Setup View */}
      {step === 'setup' && setupData && (
        <div>
          <div className="text-center mb-6">
            <p className="text-sm text-[#4A4A55] dark:text-gray-400 mb-4">
              Google Authenticator 또는 다른 인증 앱으로 QR 코드를 스캔하세요.
            </p>
            <div className="inline-block p-4 bg-white rounded-lg shadow">
              <img
                src={twoFactorAuthService.generateQrCodeUrl(setupData.qrCodeUri)}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-[#4A4A55] dark:text-gray-400 mb-2">
              QR 코드를 스캔할 수 없는 경우 수동으로 입력하세요:
            </p>
            <div className="p-3 bg-sand-100 dark:bg-gray-700 rounded-[13px] break-all text-xs font-mono">
              {setupData.secretKey}
            </div>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full py-2 px-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
          >
            다음: 코드 확인
          </button>
        </div>
      )}

      {/* Verify View */}
      {step === 'verify' && (
        <div>
          <p className="text-sm text-[#4A4A55] dark:text-gray-400 mb-4">
            인증 앱에 표시된 6자리 코드를 입력하세요.
          </p>

          <input
            type="text"
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-widest font-mono py-3 bg-sand-100 border-[1.5px] border-transparent rounded-[13px] dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-primary-500 transition-all mb-4"
            maxLength={6}
          />

          <div className="space-y-3">
            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-2 px-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '확인 중...' : '확인 및 활성화'}
            </button>
            <button
              onClick={() => setStep('setup')}
              className="w-full py-2 px-4 border-[1.5px] border-sand-400 text-ink font-bold rounded-xl hover:bg-sand-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              뒤로
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes View */}
      {step === 'backup' && (
        <div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              백업 코드를 안전한 곳에 저장하세요. 인증 앱에 접근할 수 없을 때 사용할 수 있습니다. 각
              코드는 한 번만 사용할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, idx) => (
              <div
                key={idx}
                className="p-2 bg-sand-100 dark:bg-gray-700 rounded-[10px] text-center font-mono text-sm"
              >
                {twoFactorAuthService.formatBackupCode(code)}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={copyBackupCodes}
              className="w-full py-2 px-4 border-[1.5px] border-sand-400 text-ink font-bold rounded-xl hover:bg-sand-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              코드 복사
            </button>
            {isEnabled && (
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={loading}
                className="w-full py-2 px-4 border-[1.5px] border-sand-400 text-ink font-bold rounded-xl hover:bg-sand-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                {loading ? '생성 중...' : '새 백업 코드 생성'}
              </button>
            )}
            <button
              onClick={() => setStep('status')}
              className="w-full py-2 px-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
            >
              완료
            </button>
          </div>
        </div>
      )}

      {/* Disable View */}
      {step === 'disable' && (
        <div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              2FA를 비활성화하면 계정 보안이 약해집니다. 비활성화하려면 현재 인증 코드를 입력하세요.
            </p>
          </div>

          <input
            type="text"
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-widest font-mono py-3 bg-sand-100 border-[1.5px] border-transparent rounded-[13px] dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-primary-500 transition-all mb-4"
            maxLength={6}
          />

          <div className="space-y-3">
            <button
              onClick={handleDisable}
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-2 px-4 bg-danger text-white font-bold rounded-xl hover:bg-[#9C3A31] disabled:opacity-50 transition-colors"
            >
              {loading ? '비활성화 중...' : '2FA 비활성화'}
            </button>
            <button
              onClick={() => {
                setVerificationCode('');
                setStep('status');
              }}
              className="w-full py-2 px-4 border-[1.5px] border-sand-400 text-ink font-bold rounded-xl hover:bg-sand-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSettings;
