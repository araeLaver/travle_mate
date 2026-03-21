import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export function useGeolocation(options: GeolocationOptions = defaultOptions) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = '위치 정보를 가져올 수 없습니다.';
        break;
      case error.TIMEOUT:
        errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
        break;
      default:
        errorMessage = '알 수 없는 오류가 발생했습니다.';
    }
    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: '이 브라우저는 위치 서비스를 지원하지 않습니다.',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, options);
  }, [updatePosition, handleError, options]);

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: '이 브라우저는 위치 서비스를 지원하지 않습니다.',
        loading: false,
      }));
      return -1;
    }

    return navigator.geolocation.watchPosition(updatePosition, handleError, options);
  }, [updatePosition, handleError, options]);

  useEffect(() => {
    getCurrentPosition();
    const watchId = watchPosition();

    return () => {
      if (watchId !== -1) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [getCurrentPosition, watchPosition]);

  return {
    ...state,
    refresh: getCurrentPosition,
  };
}
