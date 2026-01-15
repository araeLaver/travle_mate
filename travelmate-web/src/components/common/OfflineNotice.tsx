import React, { useEffect, useState } from 'react';
import { WifiIcon, SignalSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { t } from '../../i18n';

interface OfflineNoticeProps {
  className?: string;
}

/**
 * 오프라인 상태 알림 컴포넌트
 */
export function OfflineNotice({ className = '' }: OfflineNoticeProps) {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      setDismissed(false);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleDismiss = () => {
    setDismissed(true);
  };

  // 오프라인 상태
  if (!isOnline && !dismissed) {
    return (
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg ${className}`}
        role="alert"
      >
        <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
          <SignalSlashIcon className="w-5 h-5" />
          <span className="font-medium">{t('errors.network')}</span>
          <span className="text-sm opacity-90">
            - 일부 기능이 제한될 수 있습니다
          </span>
          <button
            onClick={handleDismiss}
            className="ml-4 p-1 hover:bg-amber-600 rounded"
            aria-label="닫기"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 온라인 복구 알림
  if (showReconnected) {
    return (
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-3 shadow-lg animate-slide-down ${className}`}
        role="alert"
      >
        <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
          <WifiIcon className="w-5 h-5" />
          <span className="font-medium">연결됨</span>
          <span className="text-sm opacity-90">- 온라인 상태로 복구되었습니다</span>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * 오프라인 전용 페이지 컴포넌트
 */
export function OfflinePage() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <SignalSlashIcon className="w-20 h-20 mx-auto text-gray-400 dark:text-gray-500 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          오프라인 상태입니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          인터넷 연결을 확인해주세요. 연결이 복구되면 자동으로 서비스가 재개됩니다.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t('common.retry')}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            캐시된 콘텐츠는 계속 사용할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 서비스 워커 업데이트 알림 컴포넌트
 */
interface UpdateNoticeProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateNotice({ onUpdate, onDismiss }: UpdateNoticeProps) {
  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-indigo-600 text-white rounded-lg shadow-lg p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold">새 버전이 있습니다</h3>
          <p className="text-sm text-indigo-100 mt-1">
            업데이트하여 최신 기능을 사용하세요.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-indigo-500 rounded"
          aria-label="닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onUpdate}
          className="flex-1 px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
        >
          지금 업데이트
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-indigo-100 hover:text-white transition-colors"
        >
          나중에
        </button>
      </div>
    </div>
  );
}

export default OfflineNotice;
