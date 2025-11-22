import { apiClient } from './apiClient';

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bio: string;
  profileImage?: string;
  coverImage?: string;
  location?: {
    city: string;
    country: string;
  };
  interests: string[];
  languages: string[];
  travelStyle: string;
  travelHistory: TravelHistory[];
  stats: UserStats;
  preferences: TravelPreferences;
  socialLinks?: SocialLinks;
  createdAt: Date;
  lastActive: Date;
}

export interface TravelHistory {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  description: string;
  images?: string[];
  tags: string[];
}

export interface UserStats {
  totalTrips: number;
  totalCountries: number;
  totalCities: number;
  favoriteDestination: string;
  totalGroupsJoined: number;
  totalGroupsCreated: number;
  averageRating: number;
  reviews: UserReview[];
}

export interface UserReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  tripId?: string;
  createdAt: Date;
}

export interface TravelPreferences {
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  accommodationType: string[];
  transportPreference: string[];
  groupSize: {
    min: number;
    max: number;
  };
  travelPace: 'slow' | 'medium' | 'fast';
  activityLevel: 'low' | 'medium' | 'high';
  foodPreferences: string[];
  dietaryRestrictions: string[];
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  blog?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  location?: {
    city: string;
    country: string;
  };
  interests?: string[];
  languages?: string[];
  travelStyle?: string;
  preferences?: Partial<TravelPreferences>;
  socialLinks?: Partial<SocialLinks>;
}

class ProfileService {
  private useMock: boolean = false; // Mock 데이터 사용 여부
  private profile: UserProfile | null = null;
  private currentUserId: string;

  constructor() {
    this.currentUserId = localStorage.getItem('tempUserId') || this.generateUserId();
    localStorage.setItem('tempUserId', this.currentUserId);

    if (this.useMock) {
      this.loadProfile();
    }
  }

  // Mock 모드 설정
  setMockMode(useMock: boolean): void {
    this.useMock = useMock;
    if (useMock) {
      this.loadProfile();
    }
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private loadProfile(): void {
    // 로컬 스토리지에서 프로필 로드 시도
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        // Date 객체 복원
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.lastActive = new Date(parsed.lastActive);
        parsed.travelHistory = parsed.travelHistory.map((trip: any) => ({
          ...trip,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate)
        }));
        parsed.stats.reviews = parsed.stats.reviews.map((review: any) => ({
          ...review,
          createdAt: new Date(review.createdAt)
        }));
        this.profile = parsed;
        return;
      } catch (error) {
        console.warn('Failed to load saved profile:', error);
      }
    }

    // 기본 프로필 생성
    this.profile = this.createDefaultProfile();
    this.saveProfile();
  }

  private createDefaultProfile(): UserProfile {
    const interests = [
      '사진촬영', '음식탐방', '역사문화', '자연관광', '쇼핑',
      '공연관람', '스포츠', '야경감상', '카페투어', '박물관'
    ];
    
    const languages = ['한국어', '영어', '중국어', '일본어', '스페인어', '프랑스어'];
    
    return {
      id: this.currentUserId,
      name: '여행러',
      bio: '새로운 곳을 탐험하고 사람들과 만나는 것을 좋아합니다!',
      interests: this.getRandomItems(interests, 3, 5),
      languages: this.getRandomItems(languages, 1, 3),
      travelStyle: '문화탐방',
      travelHistory: [],
      stats: {
        totalTrips: 0,
        totalCountries: 0,
        totalCities: 0,
        favoriteDestination: '아직 없음',
        totalGroupsJoined: 0,
        totalGroupsCreated: 0,
        averageRating: 0,
        reviews: []
      },
      preferences: {
        budget: {
          min: 100000,
          max: 500000,
          currency: 'KRW'
        },
        accommodationType: ['호텔', '게스트하우스'],
        transportPreference: ['대중교통', '도보'],
        groupSize: {
          min: 2,
          max: 6
        },
        travelPace: 'medium',
        activityLevel: 'medium',
        foodPreferences: ['현지음식'],
        dietaryRestrictions: []
      },
      createdAt: new Date(),
      lastActive: new Date()
    };
  }

  private getRandomItems<T>(array: T[], min: number, max: number): T[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private saveProfile(): void {
    if (this.profile) {
      localStorage.setItem('userProfile', JSON.stringify(this.profile));
    }
  }

  // 프로필 조회
  async getProfile(userId?: string): Promise<UserProfile | null> {
    if (this.useMock) {
      return this.profile;
    }

    try {
      const endpoint = userId ? `/users/profile/${userId}` : '/users/me';
      const response = await apiClient.get<any>(endpoint);
      return this.mapToUserProfile(response);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  }

  // 프로필 업데이트
  async updateProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
    if (this.useMock) {
      if (!this.profile) {
        this.profile = this.createDefaultProfile();
      }

      // 업데이트 적용
      Object.keys(updates).forEach(key => {
        const updateKey = key as keyof UpdateProfileRequest;
        if (updates[updateKey] !== undefined) {
          if (updateKey === 'preferences' && updates.preferences) {
            this.profile!.preferences = {
              ...this.profile!.preferences,
              ...updates.preferences
            };
          } else if (updateKey === 'socialLinks' && updates.socialLinks) {
            this.profile!.socialLinks = {
              ...this.profile!.socialLinks,
              ...updates.socialLinks
            };
          } else {
            (this.profile as any)[updateKey] = updates[updateKey];
          }
        }
      });

      this.profile.lastActive = new Date();
      this.saveProfile();

      return this.profile;
    }

    try {
      const response = await apiClient.put<any>('/users/profile', {
        nickname: updates.name,
        fullName: updates.name,
        age: updates.age,
        gender: updates.gender?.toUpperCase(),
        bio: updates.bio,
        profileImageUrl: updates.profileImage,
        interests: updates.interests,
        languages: updates.languages,
        travelStyle: updates.travelStyle,
      });
      return this.mapToUserProfile(response);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // 여행 기록 추가
  addTravelHistory(travel: Omit<TravelHistory, 'id'>): void {
    if (!this.profile) return;

    const newTravel: TravelHistory = {
      id: 'trip_' + Date.now(),
      ...travel
    };

    this.profile.travelHistory.unshift(newTravel);
    
    // 통계 업데이트
    this.updateStats();
    this.saveProfile();
  }

  // 여행 기록 삭제
  removeTravelHistory(travelId: string): void {
    if (!this.profile) return;

    this.profile.travelHistory = this.profile.travelHistory.filter(
      trip => trip.id !== travelId
    );
    
    this.updateStats();
    this.saveProfile();
  }

  // 리뷰 추가 (다른 사용자가 남긴 리뷰)
  addReview(review: Omit<UserReview, 'id' | 'createdAt'>): void {
    if (!this.profile) return;

    const newReview: UserReview = {
      id: 'review_' + Date.now(),
      ...review,
      createdAt: new Date()
    };

    this.profile.stats.reviews.push(newReview);
    
    // 평균 평점 업데이트
    const totalRating = this.profile.stats.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.profile.stats.averageRating = totalRating / this.profile.stats.reviews.length;
    
    this.saveProfile();
  }

  private updateStats(): void {
    if (!this.profile) return;

    const travels = this.profile.travelHistory;
    this.profile.stats.totalTrips = travels.length;
    
    // 국가 및 도시 수 계산 (간단한 로직)
    const destinations = travels.map(t => t.destination);
    this.profile.stats.totalCities = new Set(destinations).size;
    this.profile.stats.totalCountries = Math.floor(this.profile.stats.totalCities / 3) + 1;
    
    // 가장 많이 간 목적지
    if (destinations.length > 0) {
      const destinationCount: { [key: string]: number } = {};
      destinations.forEach(dest => {
        destinationCount[dest] = (destinationCount[dest] || 0) + 1;
      });
      
      this.profile.stats.favoriteDestination = Object.entries(destinationCount)
        .sort(([,a], [,b]) => b - a)[0][0];
    }
  }

  // 프로필 이미지 업데이트
  async updateProfileImage(file: File): Promise<string> {
    if (this.useMock) {
      const imageUrl = URL.createObjectURL(file);
      if (this.profile) {
        this.profile.profileImage = imageUrl;
        this.saveProfile();
      }
      return imageUrl;
    }

    try {
      const response = await apiClient.uploadFile('/upload/profile-image', file);
      return response.url || response.imageUrl;
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      throw error;
    }
  }

  // 커버 이미지 업데이트
  async updateCoverImage(file: File): Promise<string> {
    if (this.useMock) {
      const imageUrl = URL.createObjectURL(file);
      if (this.profile) {
        this.profile.coverImage = imageUrl;
        this.saveProfile();
      }
      return imageUrl;
    }

    try {
      const response = await apiClient.uploadFile('/upload/cover-image', file);
      return response.url || response.imageUrl;
    } catch (error) {
      console.error('Failed to upload cover image:', error);
      throw error;
    }
  }

  // 임시 프로필 생성 (비회원용)
  createTempProfile(name: string): UserProfile {
    const tempProfile = this.createDefaultProfile();
    tempProfile.name = name;
    tempProfile.bio = `안녕하세요, ${name}입니다. 여행을 좋아합니다!`;
    
    this.profile = tempProfile;
    this.saveProfile();
    
    return tempProfile;
  }

  // 프로필 초기화
  resetProfile(): void {
    this.profile = this.createDefaultProfile();
    this.saveProfile();
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  // 사용 가능한 관심사 목록
  getAvailableInterests(): string[] {
    return [
      '사진촬영', '음식탐방', '역사문화', '자연관광', '쇼핑',
      '공연관람', '스포츠', '야경감상', '카페투어', '박물관',
      '해변', '산악', '도시탐험', '축제', '요리체험', '와인',
      '건축', '예술', '음악', '독서', '영화', '게임'
    ];
  }

  // 사용 가능한 언어 목록
  getAvailableLanguages(): string[] {
    return [
      '한국어', '영어', '중국어', '일본어', '스페인어', 
      '프랑스어', '독일어', '이탈리아어', '러시아어', '포르투갈어'
    ];
  }

  // 여행 스타일 목록
  getAvailableTravelStyles(): string[] {
    return [
      '배낭여행', '럭셔리 여행', '문화탐방', '모험가', '미식가',
      '사진가', '역사덕후', '자연러버', '도시탐험', '힐링여행'
    ];
  }

  // 백엔드 응답을 UserProfile로 변환
  private mapToUserProfile(data: any): UserProfile {
    return {
      id: data.id?.toString() || '',
      name: data.nickname || data.name || '',
      age: data.age,
      gender: data.gender?.toLowerCase() as 'male' | 'female' | 'other',
      bio: data.bio || '',
      profileImage: data.profileImageUrl || data.profileImage,
      coverImage: data.coverImageUrl || data.coverImage,
      location: data.location,
      interests: data.interests || [],
      languages: data.languages || [],
      travelStyle: data.travelStyle || '',
      travelHistory: [],
      stats: {
        totalTrips: data.stats?.totalTrips || 0,
        totalCountries: data.stats?.totalCountries || 0,
        totalCities: data.stats?.totalCities || 0,
        favoriteDestination: data.stats?.favoriteDestination || '아직 없음',
        totalGroupsJoined: data.stats?.totalGroupsJoined || 0,
        totalGroupsCreated: data.stats?.totalGroupsCreated || 0,
        averageRating: data.rating || 0,
        reviews: [],
      },
      preferences: {
        budget: {
          min: 100000,
          max: 500000,
          currency: 'KRW',
        },
        accommodationType: ['호텔', '게스트하우스'],
        transportPreference: ['대중교통', '도보'],
        groupSize: {
          min: 2,
          max: 6,
        },
        travelPace: 'medium',
        activityLevel: 'medium',
        foodPreferences: ['현지음식'],
        dietaryRestrictions: [],
      },
      createdAt: new Date(data.createdAt),
      lastActive: new Date(data.lastActivityAt || Date.now()),
    };
  }
}

export const profileService = new ProfileService();