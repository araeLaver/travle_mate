import { useState, useEffect, useCallback } from 'react';

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || '';

interface UseKakaoSDKReturn {
  isLoaded: boolean;
  isInitialized: boolean;
  error: string | null;
  login: () => Promise<string>;
}

export const useKakaoSDK = (): UseKakaoSDKReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 이미 로드된 경우 처리
    if (window.Kakao) {
      setIsLoaded(true);
      if (!window.Kakao.isInitialized()) {
        try {
          window.Kakao.init(KAKAO_APP_KEY);
          setIsInitialized(true);
        } catch (err) {
          setError('카카오 SDK 초기화에 실패했습니다.');
        }
      } else {
        setIsInitialized(true);
      }
      return;
    }

    // 카카오 SDK 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js';
    script.integrity = 'sha384-6MFdIr0zOira1CHQkedUqJVql0YtcZA1P0nbPrQYJXVJZUkTk/oX4U9GhIIs3q9s';
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
      if (window.Kakao && !window.Kakao.isInitialized()) {
        try {
          window.Kakao.init(KAKAO_APP_KEY);
          setIsInitialized(true);
        } catch (err) {
          setError('카카오 SDK 초기화에 실패했습니다.');
        }
      }
    };

    script.onerror = () => {
      setError('카카오 SDK 로드에 실패했습니다.');
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (다른 컴포넌트에서 사용할 수 있음)
    };
  }, []);

  const login = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isInitialized || !window.Kakao) {
        reject(new Error('카카오 SDK가 초기화되지 않았습니다.'));
        return;
      }

      window.Kakao.Auth.login({
        success: (authObj: { access_token: string }) => {
          resolve(authObj.access_token);
        },
        fail: (err: { error: string; error_description: string }) => {
          reject(new Error(err.error_description || err.error));
        },
      });
    });
  }, [isInitialized]);

  return {
    isLoaded,
    isInitialized,
    error,
    login,
  };
};

export default useKakaoSDK;
