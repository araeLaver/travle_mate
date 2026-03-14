import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

interface NetworkInformation extends EventTarget {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

/**
 * 네트워크 상태 감지 훅
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType: string | null;
    downlink: number | null;
    rtt: number | null;
  }>({
    effectiveType: null,
    downlink: null,
    rtt: null,
  });

  const updateConnectionInfo = useCallback(() => {
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      setConnectionInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      });
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 오프라인에서 온라인으로 복구됨을 표시
      if (!navigator.onLine) {
        setWasOffline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API 지원 시
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [updateConnectionInfo]);

  return {
    isOnline,
    wasOffline,
    ...connectionInfo,
  };
}

/**
 * 오프라인 데이터 저장 훅
 */
export function useOfflineStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error saving to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}

/**
 * 오프라인 요청 큐 훅
 */
interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body?: string;
  timestamp: number;
}

export function useOfflineQueue() {
  const [queue, setQueue, clearQueue] = useOfflineStorage<PendingRequest[]>('tm_offline_queue', []);
  const { isOnline } = useNetworkStatus();

  const addToQueue = useCallback(
    (request: Omit<PendingRequest, 'id' | 'timestamp'>) => {
      const newRequest: PendingRequest = {
        ...request,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      setQueue(prev => [...prev, newRequest]);
    },
    [setQueue]
  );

  const removeFromQueue = useCallback(
    (id: string) => {
      setQueue(prev => prev.filter(item => item.id !== id));
    },
    [setQueue]
  );

  const processQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0) return;

    for (const request of queue) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.body,
        });
        removeFromQueue(request.id);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to process queued request:', error);
        break; // 실패하면 나머지는 다음에
      }
    }
  }, [isOnline, queue, removeFromQueue]);

  // 온라인 상태가 되면 큐 처리
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    queueSize: queue.length,
  };
}

export default useNetworkStatus;
