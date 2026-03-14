import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation, GeolocationOptions } from './useGeolocation';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

const mockPosition: GeolocationPosition = {
  coords: {
    latitude: 37.5665,
    longitude: 126.978,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
};

describe('useGeolocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return initial loading state', () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {});
    mockGeolocation.watchPosition.mockReturnValue(1);

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(true);
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
  });

  it('should update position on successful geolocation', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });
    mockGeolocation.watchPosition.mockImplementation((success) => {
      success(mockPosition);
      return 1;
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.latitude).toBe(37.5665);
    expect(result.current.longitude).toBe(126.978);
    expect(result.current.accuracy).toBe(10);
    expect(result.current.error).toBeNull();
  });

  it('should handle permission denied error', async () => {
    const permissionError: GeolocationPositionError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied Geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(permissionError);
    });
    mockGeolocation.watchPosition.mockReturnValue(1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.'
    );
    expect(result.current.latitude).toBeNull();
  });

  it('should handle position unavailable error', async () => {
    const unavailableError: GeolocationPositionError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(unavailableError);
    });
    mockGeolocation.watchPosition.mockReturnValue(1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('위치 정보를 가져올 수 없습니다.');
  });

  it('should handle timeout error', async () => {
    const timeoutError: GeolocationPositionError = {
      code: 3, // TIMEOUT
      message: 'Timeout',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(timeoutError);
    });
    mockGeolocation.watchPosition.mockReturnValue(1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('위치 정보 요청 시간이 초과되었습니다.');
  });

  it('should handle unknown error', async () => {
    const unknownError: GeolocationPositionError = {
      code: 999, // Unknown code
      message: 'Unknown error',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(unknownError);
    });
    mockGeolocation.watchPosition.mockReturnValue(1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('알 수 없는 오류가 발생했습니다.');
  });

  it('should handle missing geolocation API', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.error).toBe('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    expect(result.current.loading).toBe(false);
  });

  it('should use custom options', () => {
    const customOptions: GeolocationOptions = {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 60000,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });
    mockGeolocation.watchPosition.mockReturnValue(1);

    renderHook(() => useGeolocation(customOptions));

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      customOptions
    );
  });

  it('should clear watch on unmount', () => {
    const watchId = 123;
    mockGeolocation.getCurrentPosition.mockImplementation(() => {});
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    const { unmount } = renderHook(() => useGeolocation());

    unmount();

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
  });

  it('should provide refresh function', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });
    mockGeolocation.watchPosition.mockReturnValue(1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Reset mock and call refresh
    mockGeolocation.getCurrentPosition.mockClear();

    act(() => {
      result.current.refresh();
    });

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it('should update position when watch detects movement', async () => {
    const initialPosition = { ...mockPosition };
    const newPosition: GeolocationPosition = {
      coords: {
        latitude: 37.57,
        longitude: 126.98,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(initialPosition);
    });

    let watchCallback: (pos: GeolocationPosition) => void;
    mockGeolocation.watchPosition.mockImplementation((success) => {
      watchCallback = success;
      return 1;
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.latitude).toBe(37.5665);
    });

    // Simulate position update via watch
    act(() => {
      watchCallback(newPosition);
    });

    expect(result.current.latitude).toBe(37.57);
    expect(result.current.longitude).toBe(126.98);
    expect(result.current.accuracy).toBe(5);
  });
});
