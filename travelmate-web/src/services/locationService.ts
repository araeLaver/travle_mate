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

class LocationService {
  private currentLocation: Location | null = null;
  private watchId: number | null = null;

  // 현재 위치 가져오기
  async getCurrentLocation(): Promise<Location> {
    if (!navigator.geolocation) {
      const defaultLocation: Location = {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 (브라우저 미지원)'
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
    } catch (error: any) {
      // 위치를 가져올 수 없는 경우 서울 시청 기본값 사용
      const defaultLocation: Location = {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 (기본 위치)'
      };
      this.currentLocation = defaultLocation;
      return defaultLocation;
    }
  }

  // 지오로케이션 헬퍼 메서드
  private getGeolocationPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );
    });
  }

  // 백엔드 API를 통해 좌표를 주소로 변환
  private async getAddressFromCoords(lat: number, lng: number): Promise<string> {
    try {
      // 먼저 좌표 범위로 대략적인 지역 판단
      const estimatedLocation = this.getEstimatedLocationByCoords(lat, lng);
      if (estimatedLocation) {
        return estimatedLocation;
      }

      // 한국 내 좌표인 경우에만 카카오맵 API 시도
      if (this.isKoreaCoords(lat, lng)) {
        // 먼저 백엔드 API를 시도
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080/api';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(
            `${backendUrl}/location/address?lat=${lat}&lng=${lng}`,
            { signal: controller.signal }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();

            if (!data.error && data && data.documents && data.documents.length > 0) {
              const doc = data.documents[0];

              if (doc.road_address && doc.road_address.address_name) {
                return doc.road_address.address_name;
              }

              if (doc.address && doc.address.address_name) {
                return doc.address.address_name;
              }
            }
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
                  'Authorization': `KakaoAK ${kakaoApiKey}`
                }
              }
            );

            if (directResponse.ok) {
              const directData = await directResponse.json();

              if (directData.documents && directData.documents.length > 0) {
                const doc = directData.documents[0];

                if (doc.road_address && doc.road_address.address_name) {
                  return doc.road_address.address_name;
                }

                if (doc.address && doc.address.address_name) {
                  return doc.address.address_name;
                }
              }
            }
          } catch (kakaoError) {
            // Kakao API 호출 실패
          }
        }
      }

      return `위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)}`;

    } catch (error) {
      return `위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)}`;
    }
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
        { name: '서울특별시 중구', lat: 37.5665, lng: 126.9780, range: 0.02 },
        { name: '인천광역시', lat: 37.4563, lng: 126.7052, range: 0.05 },
        { name: '대전광역시', lat: 36.3504, lng: 127.3845, range: 0.05 },
        { name: '대구광역시', lat: 35.8714, lng: 128.6014, range: 0.05 },
        { name: '부산광역시', lat: 35.1796, lng: 129.0756, range: 0.05 },
        { name: '광주광역시', lat: 35.1595, lng: 126.8526, range: 0.05 }
      ];

      for (const city of koreaCities) {
        const distance = Math.sqrt(
          Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
        );
        if (distance <= city.range) {
          return city.name;
        }
      }

      if (lat >= 37.35 && lat <= 37.50 && lng >= 127.20 && lng <= 127.30) {
        return '경기도 광주시 인근';
      }
      if (lat >= 37.40 && lat <= 37.70 && lng >= 126.80 && lng <= 127.50) {
        return '경기도';
      }
      if (lat >= 37.40 && lat <= 37.70 && lng >= 126.70 && lng <= 127.20) {
        return '서울/경기 지역';
      }

      return '대한민국';
    }

    if (lat >= 24 && lat <= 49 && lng >= -125 && lng <= -66) {
      const usaCities = [
        { name: '워싱턴 D.C.', lat: 38.9072, lng: -77.0369, range: 0.5 },
        { name: '뉴욕', lat: 40.7128, lng: -74.0060, range: 0.8 },
        { name: '로스앤젤레스', lat: 34.0522, lng: -118.2437, range: 1.0 },
        { name: '시카고', lat: 41.8781, lng: -87.6298, range: 0.8 },
        { name: '샌프란시스코', lat: 37.7749, lng: -122.4194, range: 0.5 },
        { name: '마이애미', lat: 25.7617, lng: -80.1918, range: 0.5 },
        { name: '시애틀', lat: 47.6062, lng: -122.3321, range: 0.5 },
        { name: '라스베이거스', lat: 36.1699, lng: -115.1398, range: 0.5 },
        { name: '댈러스', lat: 32.7767, lng: -96.7970, range: 0.8 },
        { name: '애틀랜타', lat: 33.7490, lng: -84.3880, range: 0.8 }
      ];

      for (const city of usaCities) {
        const distance = Math.sqrt(
          Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
        );
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
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 10) / 10;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // 근처 여행 메이트 찾기
  async findNearbyTravelMates(radius: number = 5): Promise<TravelMate[]> {
    try {
      const currentLoc = this.currentLocation || await this.getCurrentLocation();
      const mates = this.generateMockTravelMates(currentLoc, radius);
      return mates;
    } catch (error) {
      const defaultLocation: Location = {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 중구 태평로1가'
      };
      return this.generateMockTravelMates(defaultLocation, radius);
    }
  }

  private generateMockTravelMates(currentLoc: Location, radius: number): TravelMate[] {
    const names = [
      '김도현', '이서연', '박민준', '최지은', '정우진', '한소영', '송태호', '차유나',
      '강민수', '윤채원', '임성훈', '장하늘', '오현지', '신재현', '류소담', '홍준혁',
      '김나라', '이바다', '박하늘', '최별님', '정달님', '한가은', '송유진', '차민아',
      '백여행가', '김탐험가', '이모험가', '박세계인', '최글로벌', '정국제인', '한유목민', '송자유인'
    ];

    const moods = [
      '🌟 여행 중', '🍜 맛집 탐방', '🏔️ 산 좋아', '📸 인생샷 찍기', '☕ 카페 투어',
      '🎨 문화 체험', '🏖️ 휴양지 선호', '🎭 공연 관람', '🛍️ 쇼핑 러버', '🌃 야경 덕후',
      '🚶‍♀️ 도보 탐험', '🎵 음악 투어', '🍷 와이너리 투어', '🏛️ 역사 탐방', '🌸 꽃 구경',
      '⛩️ 사찰 순례', '🎪 축제 참가', '🏄‍♂️ 액티비티', '🧘‍♀️ 명상 여행', '📚 도서관 투어'
    ];

    const travelStyles = [
      '배낭여행', '럭셔리 여행', '문화탐방', '모험가', '미식가',
      '사진가', '역사덕후', '자연러버', '도시탐험', '힐링여행'
    ];

    const interests = [
      '사진촬영', '음식탐방', '역사문화', '자연관광', '쇼핑',
      '공연관람', '스포츠', '야경감상', '카페투어', '박물관'
    ];

    const languages = [
      ['한국어', '영어'], ['한국어', '중국어'], ['한국어', '일본어'],
      ['한국어', '영어', '중국어'], ['한국어', '스페인어'], ['한국어', '프랑스어']
    ];

    const bios = [
      '세계 곳곳을 탐험하며 새로운 문화를 경험하고 싶어요! 🌍',
      '맛있는 음식과 아름다운 풍경을 함께 즐길 여행 친구를 찾아요. 🍽️✨',
      '사진 찍기 좋아하고 인생샷 남기는 걸 좋아해요. 📸',
      '여행을 통해 새로운 사람들과 인연을 만들고 싶어요. 🤝',
      '혼자 여행보다는 함께하는 여행이 더 즐거운 것 같아요! 👫',
      '현지인처럼 여행하며 진짜 문화를 체험해보고 싶어요. 🏛️',
      '자연과 함께하는 힐링 여행을 좋아해요. 🌿',
      '역사와 예술에 관심이 많아서 박물관 투어를 즐겨요. 🎨',
      '맛집 탐방이 여행의 50% 이상을 차지한다고 생각해요! 🍜',
      '새벽 일출부터 밤 야경까지 모든 순간을 담고 싶어요. 🌅🌃',
      '배낭 하나로 떠나는 자유로운 여행을 꿈꿔요. 🎒',
      '각 나라의 전통 축제와 문화를 직접 체험하고 싶어요. 🎪',
      '느린 여행, 깊은 여행을 추구합니다. ☕',
      '모험과 스릴을 즐기는 액티비티 여행러예요! 🏄‍♂️',
      '여행지의 로컬 마켓과 골목길 탐험을 좋아해요. 🛒',
      '다양한 언어와 문화 교류에 관심이 많아요. 🗣️'
    ];

    const mockMates: TravelMate[] = [];
    const count = Math.floor(Math.random() * 8) + 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const deltaLat = (distance * Math.cos(angle)) / 111;
      const deltaLng = (distance * Math.sin(angle)) / (111 * Math.cos(currentLoc.latitude * Math.PI / 180));

      const mateLoc: Location = {
        latitude: currentLoc.latitude + deltaLat,
        longitude: currentLoc.longitude + deltaLng,
      };

      const actualDistance = this.calculateDistance(
        currentLoc.latitude, currentLoc.longitude,
        mateLoc.latitude, mateLoc.longitude
      );

      mockMates.push({
        id: `mate_${i + 1}_${Date.now()}`,
        name: names[Math.floor(Math.random() * names.length)],
        age: Math.floor(Math.random() * 25) + 20,
        gender: Math.random() > 0.5 ? 'female' : 'male',
        location: mateLoc,
        distance: actualDistance,
        mood: moods[Math.floor(Math.random() * moods.length)],
        travelStyle: travelStyles[Math.floor(Math.random() * travelStyles.length)],
        interests: this.getRandomItems(interests, 2, 4),
        languages: languages[Math.floor(Math.random() * languages.length)],
        bio: bios[Math.floor(Math.random() * bios.length)],
        isOnline: Math.random() > 0.3,
        lastSeen: new Date(Date.now() - Math.random() * 3600000),
        matchScore: Math.floor(Math.random() * 30) + 70
      });
    }

    return mockMates.sort((a, b) => a.distance - b.distance);
  }

  private getRandomItems<T>(array: T[], min: number, max: number): T[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // 위치 변화 감지 시작
  startWatching(callback: (location: Location) => void): void {
    if (!navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
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
      (error) => {
        // 위치 감지 에러
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 300000
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
}

export const locationService = new LocationService();
