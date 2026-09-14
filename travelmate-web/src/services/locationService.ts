import { getBackendBaseUrl } from './apiConfig';
import { apiClient } from './apiClient';
import { logger } from '../lib/utils';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface TravelMate {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  location: Location;
  distance: number;
  mood: string;
  travelStyle: string;
  interests: string[];
  languages: string[];
  bio: string;
  isOnline: boolean;
  lastSeen: Date;
  matchScore: number;
  profileImage?: string;
}

interface NearbyUserResponse {
  id: number | string;
  nickname?: string;
  fullName?: string;
  age?: number;
  gender?: string;
  profileImageUrl?: string;
  bio?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  travelStyle?: string;
  interests?: string[];
  languages?: string[];
  rating?: number;
  lastActivityAt?: string;
}

interface AddressLookupResponse {
  documents?: Array<{
    road_address?: {
      address_name?: string;
    } | null;
    address?: {
      address_name?: string;
    } | null;
  }>;
  error?: unknown;
}

class LocationService {
  private currentLocation: Location | null = null;
  private watchId: number | null = null;

  // 현재 위치 가져오기
  async getCurrentLocation(): Promise<Location> {
    if (!navigator.geolocation) {
      const defaultLocation: Location = {
        latitude: 37.5665,
        longitude: 126.978,
        address: '서울특별시 중구 (브라우저 미지원)',
      };
      this.currentLocation = defaultLocation;
      return defaultLocation;
    }

    try {
      const position = await this.getGeolocationPosition();

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // 주소 변환 시도
      try {
        const address = await this.getAddressFromCoords(location.latitude, location.longitude);
        location.address = address;
      } catch (error) {
        location.address = `위도 ${location.latitude.toFixed(4)}, 경도 ${location.longitude.toFixed(4)}`;
      }

      this.currentLocation = location;
      return location;
    } catch {
      // 위치를 가져올 수 없는 경우 서울 시청 기본값 사용
      const defaultLocation: Location = {
        latitude: 37.5665,
        longitude: 126.978,
        address: '서울특별시 중구 (기본 위치)',
      };
      this.currentLocation = defaultLocation;
      return defaultLocation;
    }
  }

  // 지오로케이션 헬퍼 메서드
  private getGeolocationPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      });
    });
  }

  // 백엔드 API를 통해 좌표를 주소로 변환
  private async getAddressFromCoords(lat: number, lng: number): Promise<string> {
    try {
      // 한국 내 좌표인 경우에만 카카오맵 API 시도
      if (this.isKoreaCoords(lat, lng)) {
        // 먼저 백엔드 API를 시도
        try {
          const backendAddress = await this.fetchBackendAddress(lat, lng);
          if (backendAddress) {
            return backendAddress;
          }
        } catch (backendError) {
          // 백엔드 연결 실패, 직접 API 호출로 전환
        }

        // 백엔드가 실패하면 직접 Kakao API 호출
        const kakaoApiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;

        if (kakaoApiKey) {
          try {
            const directResponse = await fetch(
              `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
              {
                headers: {
                  Authorization: `KakaoAK ${kakaoApiKey}`,
                },
              }
            );

            if (directResponse.ok) {
              const directData = await directResponse.json();
              const directAddress = this.extractAddress(directData);
              if (directAddress) {
                return directAddress;
              }
            }
          } catch (kakaoError) {
            // Kakao API 호출 실패
          }
        }
      }

      // 외부 주소 조회가 불가능하면 좌표 범위로 대략적인 지역 판단
      const estimatedLocation = this.getEstimatedLocationByCoords(lat, lng);
      if (estimatedLocation) {
        return estimatedLocation;
      }

      return `위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)}`;
    } catch (error) {
      return `위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)}`;
    }
  }

  private async fetchBackendAddress(lat: number, lng: number): Promise<string | null> {
    const backendUrl = getBackendBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${backendUrl}/location/address?lat=${lat}&lng=${lng}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      return this.extractAddress(await response.json());
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private extractAddress(data: AddressLookupResponse): string | null {
    if (data.error || !data.documents || data.documents.length === 0) {
      return null;
    }

    const doc = data.documents[0];
    return doc.road_address?.address_name || doc.address?.address_name || null;
  }

  // 좌표가 한국 내인지 확인
  private isKoreaCoords(lat: number, lng: number): boolean {
    return lat >= 33 && lat <= 43 && lng >= 124 && lng <= 132;
  }

  // 좌표 범위로 대략적인 지역 추정
  private getEstimatedLocationByCoords(lat: number, lng: number): string | null {
    if (this.isKoreaCoords(lat, lng)) {
      const koreaCities = [
        { name: '경기도 광주시', lat: 37.4138, lng: 127.2557, range: 0.05 },
        { name: '경기도 성남시', lat: 37.4449, lng: 127.1388, range: 0.03 },
        { name: '경기도 용인시', lat: 37.2411, lng: 127.1776, range: 0.05 },
        { name: '서울특별시 강남구', lat: 37.5172, lng: 127.0473, range: 0.02 },
        { name: '서울특별시 중구', lat: 37.5665, lng: 126.978, range: 0.02 },
        { name: '인천광역시', lat: 37.4563, lng: 126.7052, range: 0.05 },
        { name: '대전광역시', lat: 36.3504, lng: 127.3845, range: 0.05 },
        { name: '대구광역시', lat: 35.8714, lng: 128.6014, range: 0.05 },
        { name: '부산광역시', lat: 35.1796, lng: 129.0756, range: 0.05 },
        { name: '광주광역시', lat: 35.1595, lng: 126.8526, range: 0.05 },
      ];

      for (const city of koreaCities) {
        const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2));
        if (distance <= city.range) {
          return city.name;
        }
      }

      if (lat >= 37.35 && lat <= 37.5 && lng >= 127.2 && lng <= 127.3) {
        return '경기도 광주시 인근';
      }
      if (lat >= 37.4 && lat <= 37.7 && lng >= 126.8 && lng <= 127.5) {
        return '경기도';
      }
      if (lat >= 37.4 && lat <= 37.7 && lng >= 126.7 && lng <= 127.2) {
        return '서울/경기 지역';
      }

      return '대한민국';
    }

    if (lat >= 24 && lat <= 49 && lng >= -125 && lng <= -66) {
      const usaCities = [
        { name: '워싱턴 D.C.', lat: 38.9072, lng: -77.0369, range: 0.5 },
        { name: '뉴욕', lat: 40.7128, lng: -74.006, range: 0.8 },
        { name: '로스앤젤레스', lat: 34.0522, lng: -118.2437, range: 1.0 },
        { name: '시카고', lat: 41.8781, lng: -87.6298, range: 0.8 },
        { name: '샌프란시스코', lat: 37.7749, lng: -122.4194, range: 0.5 },
        { name: '마이애미', lat: 25.7617, lng: -80.1918, range: 0.5 },
        { name: '시애틀', lat: 47.6062, lng: -122.3321, range: 0.5 },
        { name: '라스베이거스', lat: 36.1699, lng: -115.1398, range: 0.5 },
        { name: '댈러스', lat: 32.7767, lng: -96.797, range: 0.8 },
        { name: '애틀랜타', lat: 33.749, lng: -84.388, range: 0.8 },
      ];

      for (const city of usaCities) {
        const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2));
        if (distance <= city.range) {
          return `${city.name}, 미국`;
        }
      }

      if (lat >= 38.5 && lat <= 39.5 && lng >= -77.5 && lng <= -76.5) {
        return '워싱턴 D.C. 메트로 지역, 미국';
      }
      if (lat >= 25 && lat <= 31 && lng >= -106 && lng <= -93) {
        return '텍사스주, 미국';
      }
      if (lat >= 32 && lat <= 42 && lng >= -124 && lng <= -114) {
        return '캘리포니아주, 미국';
      }
      if (lat >= 40 && lat <= 45 && lng >= -79 && lng <= -71) {
        return '뉴욕주, 미국';
      }

      return '미국';
    }

    if (lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40) {
      if (lat >= 48.5 && lat <= 49.5 && lng >= 2 && lng <= 3) {
        return '파리, 프랑스';
      }
      if (lat >= 51.3 && lat <= 51.7 && lng >= -0.5 && lng <= 0.3) {
        return '런던, 영국';
      }
      if (lat >= 52.3 && lat <= 52.7 && lng >= 13.0 && lng <= 13.8) {
        return '베를린, 독일';
      }
      return '유럽';
    }

    if (lat >= 30 && lat <= 46 && lng >= 129 && lng <= 146) {
      if (lat >= 35.5 && lat <= 35.8 && lng >= 139.5 && lng <= 140) {
        return '도쿄, 일본';
      }
      if (lat >= 34.5 && lat <= 34.8 && lng >= 135.3 && lng <= 135.7) {
        return '오사카, 일본';
      }
      return '일본';
    }

    if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) {
      if (lat >= 39.7 && lat <= 40.1 && lng >= 116.2 && lng <= 116.6) {
        return '베이징, 중국';
      }
      if (lat >= 31.1 && lat <= 31.4 && lng >= 121.3 && lng <= 121.7) {
        return '상하이, 중국';
      }
      return '중국';
    }

    return null;
  }

  // 두 좌표 간 거리 계산 (km)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 10) / 10;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // 근처 여행 메이트 찾기
  async findNearbyTravelMates(radius: number = 5): Promise<TravelMate[]> {
    const currentLoc = this.currentLocation || (await this.getCurrentLocation());

    try {
      const params = new URLSearchParams({
        latitude: String(currentLoc.latitude),
        longitude: String(currentLoc.longitude),
        radiusKm: String(radius),
      });
      const users = await apiClient.get<NearbyUserResponse[]>(`/users/nearby?${params.toString()}`);
      return users
        .map(user => this.mapToTravelMate(user, currentLoc))
        .sort((a, b) => a.distance - b.distance);
    } catch (error) {
      logger.error('Failed to fetch nearby travel mates:', error);
      throw error;
    }
  }

  private mapToTravelMate(user: NearbyUserResponse, currentLoc: Location): TravelMate {
    const latitude = user.currentLatitude ?? currentLoc.latitude;
    const longitude = user.currentLongitude ?? currentLoc.longitude;
    const ratingScore = user.rating ? Math.round(user.rating * 20) : 70;

    return {
      id: user.id?.toString() || '',
      name: user.nickname || user.fullName || '여행자',
      age: user.age || 0,
      gender: this.mapGender(user.gender),
      location: { latitude, longitude },
      distance: this.calculateDistance(
        currentLoc.latitude,
        currentLoc.longitude,
        latitude,
        longitude
      ),
      mood: '여행 메이트 찾는 중',
      travelStyle: user.travelStyle || 'UNKNOWN',
      interests: user.interests || [],
      languages: user.languages || [],
      bio: user.bio || '',
      isOnline: this.isRecentlyActive(user.lastActivityAt),
      lastSeen: user.lastActivityAt ? new Date(user.lastActivityAt) : new Date(),
      matchScore: Math.min(100, Math.max(0, ratingScore)),
      profileImage: user.profileImageUrl,
    };
  }

  private mapGender(gender?: string): 'male' | 'female' | 'other' {
    switch (gender?.toUpperCase()) {
      case 'MALE':
        return 'male';
      case 'FEMALE':
        return 'female';
      default:
        return 'other';
    }
  }

  private isRecentlyActive(lastActivityAt?: string): boolean {
    if (!lastActivityAt) {
      return false;
    }

    const lastActivityTime = new Date(lastActivityAt).getTime();
    if (Number.isNaN(lastActivityTime)) {
      return false;
    }

    return Date.now() - lastActivityTime < 15 * 60 * 1000;
  }

  // 위치 변화 감지 시작
  startWatching(callback: (location: Location) => void): void {
    if (!navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      async position => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          const address = await this.getAddressFromCoords(location.latitude, location.longitude);
          location.address = address;
        } catch (error) {
          // 주소 변환 실패
        }

        this.currentLocation = location;
        callback(location);
      },
      _error => {
        // 위치 감지 에러
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 300000,
      }
    );
  }

  // 위치 감지 중지
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getCurrentLocationSync(): Location | null {
    return this.currentLocation;
  }

  async setManualLocation(location: Location): Promise<Location> {
    const resolvedLocation = { ...location };

    try {
      resolvedLocation.address = await this.getAddressFromCoords(
        resolvedLocation.latitude,
        resolvedLocation.longitude
      );
    } catch {
      resolvedLocation.address =
        resolvedLocation.address ||
        `위도 ${resolvedLocation.latitude.toFixed(4)}, 경도 ${resolvedLocation.longitude.toFixed(4)}`;
    }

    this.currentLocation = resolvedLocation;
    return resolvedLocation;
  }
}

export const locationService = new LocationService();
