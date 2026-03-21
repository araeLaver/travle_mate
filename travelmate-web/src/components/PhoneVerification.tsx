/**
 * PhoneVerification Component
 * 휴대폰 본인 인증 모달
 */

import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

interface PhoneVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phoneNumber: string) => void;
}

type Step = 'input' | 'verify' | 'done';

const PhoneVerification: React.FC<PhoneVerificationProps> = ({ isOpen, onClose, onVerified }) => {
  const [step, setStep] = useState<Step>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (!isOpen) {
      setStep('input');
      setPhoneNumber('');
      setCode(['', '', '', '', '', '']);
      setError('');
      setCountdown(0);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await apiClient.post<{ message: string; expiresInSeconds: string }>(
        '/auth/phone/send',
        { phoneNumber }
      );
      setCountdown(Number(result.expiresInSeconds) || 300);
      setStep('verify');
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || '인증 코드 발송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }

    // 6자리 모두 입력 시 자동 제출
    if (newCode.every(c => c !== '') && index === 5) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeStr?: string) => {
    const verifyCode = codeStr || code.join('');
    if (verifyCode.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.post<{ verified: boolean; message: string; phoneNumber: string }>(
        '/auth/phone/verify',
        { phoneNumber, code: verifyCode }
      );
      setStep('done');
      onVerified(phoneNumber);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || '인증에 실패했습니다.');
      setCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    await handleSendCode();
  };

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="휴대폰 본인 인증"
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {step === 'done' ? '인증 완료' : '휴대폰 본인 인증'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Phone number input */}
          {step === 'input' && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                인증 코드를 받을 휴대폰 번호를 입력해주세요.
              </p>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(formatPhoneInput(e.target.value))}
                placeholder="010-1234-5678"
                aria-label="휴대폰 번호"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg text-center tracking-wider text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              <button
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? '발송 중...' : '인증 코드 받기'}
              </button>
            </div>
          )}

          {/* Step 2: Code verification */}
          {step === 'verify' && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">{phoneNumber}</span>
                (으)로 발송된 인증 코드를 입력해주세요.
              </p>
              {countdown > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                  남은 시간: {formatCountdown(countdown)}
                </p>
              )}

              {/* 6-digit code input */}
              <div className="flex gap-2 justify-center mb-4">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => {
                      codeRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    aria-label={`인증 코드 ${i + 1}번째 자리`}
                    className="w-12 h-14 text-center text-2xl font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ))}
              </div>

              {error && <p className="mb-3 text-sm text-red-500 text-center">{error}</p>}

              <button
                onClick={() => handleVerifyCode()}
                disabled={isLoading || code.join('').length !== 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? '확인 중...' : '인증하기'}
              </button>

              <button
                onClick={handleResend}
                disabled={isLoading || countdown > 240}
                className="w-full mt-2 px-6 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-30"
              >
                인증 코드 다시 받기
              </button>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-green-600">&#10003;</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                본인 인증이 완료되었습니다
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                신뢰 점수가 향상됩니다.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification;
