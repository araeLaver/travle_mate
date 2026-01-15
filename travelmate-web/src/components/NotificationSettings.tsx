/**
 * Notification Settings Component
 *
 * Allows users to manage their notification preferences
 */

import React from 'react';
import usePushNotifications from '../hooks/usePushNotifications';
import { NotificationPreferences } from '../services/pushNotificationService';

interface SettingToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`
          ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        `}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
            pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          `}
        />
      </button>
    </div>
  );
};

export const NotificationSettings: React.FC = () => {
  const {
    isSupported,
    permission,
    isEnabled,
    isLoading,
    preferences,
    enableNotifications,
    disableNotifications,
    updatePreferences,
  } = usePushNotifications();

  const handlePreferenceChange = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    updatePreferences({ [key]: value });
  };

  if (!isSupported) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              푸시 알림 미지원
            </h3>
            <p className="mt-2 text-sm text-yellow-700">
              현재 브라우저에서는 푸시 알림을 지원하지 않습니다.
              Chrome, Firefox, Safari 등의 최신 브라우저를 사용해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notification Toggle */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            푸시 알림
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              {permission === 'granted'
                ? '브라우저에서 알림 권한이 허용되었습니다.'
                : permission === 'denied'
                ? '브라우저에서 알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 변경해주세요.'
                : '푸시 알림을 받으려면 알림 권한을 허용해주세요.'}
            </p>
          </div>
          <div className="mt-5">
            {isEnabled ? (
              <button
                type="button"
                onClick={disableNotifications}
                disabled={isLoading}
                className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? '처리 중...' : '알림 끄기'}
              </button>
            ) : (
              <button
                type="button"
                onClick={enableNotifications}
                disabled={isLoading || permission === 'denied'}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? '처리 중...' : '알림 켜기'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      {preferences && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              알림 유형
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              받고 싶은 알림 유형을 선택하세요.
            </p>

            <div className="mt-6 divide-y divide-gray-200">
              <SettingToggle
                label="팔로우"
                description="새로운 팔로워가 생기면 알림을 받습니다."
                enabled={preferences.follow}
                onChange={(v) => handlePreferenceChange('follow', v)}
                disabled={!isEnabled}
              />

              <SettingToggle
                label="메시지"
                description="새 메시지가 도착하면 알림을 받습니다."
                enabled={preferences.message}
                onChange={(v) => handlePreferenceChange('message', v)}
                disabled={!isEnabled}
              />

              <SettingToggle
                label="NFT 수집"
                description="새 NFT를 수집하면 알림을 받습니다."
                enabled={preferences.nftCollected}
                onChange={(v) => handlePreferenceChange('nftCollected', v)}
                disabled={!isEnabled}
              />

              <SettingToggle
                label="민팅 완료"
                description="NFT 민팅이 완료되면 알림을 받습니다."
                enabled={preferences.mintingComplete}
                onChange={(v) => handlePreferenceChange('mintingComplete', v)}
                disabled={!isEnabled}
              />

              <SettingToggle
                label="그룹 초대"
                description="그룹에 초대되면 알림을 받습니다."
                enabled={preferences.groupInvite}
                onChange={(v) => handlePreferenceChange('groupInvite', v)}
                disabled={!isEnabled}
              />

              <SettingToggle
                label="리뷰 반응"
                description="내 리뷰가 도움이 되었다는 반응을 받으면 알림을 받습니다."
                enabled={preferences.reviewHelpful}
                onChange={(v) => handlePreferenceChange('reviewHelpful', v)}
                disabled={!isEnabled}
              />
            </div>
          </div>
        </div>
      )}

      {/* Email Notifications */}
      {preferences && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              이메일 알림
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              중요한 알림을 이메일로도 받습니다.
            </p>

            <div className="mt-6">
              <SettingToggle
                label="이메일 알림"
                description="중요한 알림을 이메일로 받습니다."
                enabled={preferences.email}
                onChange={(v) => handlePreferenceChange('email', v)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
