import { apiClient, ApiError } from './apiClient';
import { TravelGroupApiResponse, GroupMemberApiResponse } from '../types';
import { logger } from '../lib/utils';

export interface TravelGroup {
  id: string;
  name: string;
  description: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  maxMembers: number;
  currentMembers: number;
  members: GroupMember[];
  tags: string[];
  coverImage?: string;
  createdBy: string;
  createdAt: Date;
  status: 'recruiting' | 'full' | 'active' | 'completed';
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  travelStyle: string;
  requirements: string[];
}

export interface GroupMember {
  id: string;
  name: string;
  profileImage?: string;
  joinedAt: Date;
  role: 'leader' | 'member';
  status: 'active' | 'pending' | 'left';
  age?: number;
  travelStyle?: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  maxMembers: number;
  tags: string[];
  coverImage?: string;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  travelStyle: string;
  requirements: string[];
}

class GroupService {
  private useMock: boolean = false; // Mock 데이터 사용 여부 (개발/테스트용)
  private groups: Map<string, TravelGroup> = new Map();
  private currentUserId: string;
  private mockInitialized: boolean = false;

  constructor() {
    this.currentUserId = localStorage.getItem('tempUserId') || this.generateUserId();
    localStorage.setItem('tempUserId', this.currentUserId);

    // Mock 모드일 때만 초기 데이터 로드
    if (this.useMock) {
      this.initializeMockData();
    }
  }

  // Mock 데이터 초기화 확인 (fallback용)
  private ensureMockData(): void {
    if (!this.mockInitialized) {
      this.initializeMockData();
      this.mockInitialized = true;
    }
  }

  // Mock 데이터 가져오기 (fallback용)
  private getMockGroups(): TravelGroup[] {
    this.ensureMockData();
    return Array.from(this.groups.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  // Mock 모드 설정 (테스트용)
  setMockMode(useMock: boolean): void {
    this.useMock = useMock;
    if (useMock) {
      this.initializeMockData();
    }
  }

  private initializeMockData(): void {
    // 기존 데이터 초기화 (테스트 간 상태 유지 방지)
    this.groups.clear();

    const mockGroups: TravelGroup[] = [
      {
        id: 'group_1',
        name: '🌸 봄 벚꽃 여행',
        description:
          '전국의 아름다운 벚꽃 명소를 함께 여행할 메이트를 찾습니다. 진해군항제, 여의도, 경주 등을 돌아보며 봄의 정취를 만끽해요!',
        destination: '진해, 경주, 여의도',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 일주일 후
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10일 후
        maxMembers: 6,
        currentMembers: 4,
        members: [
          {
            id: 'leader_1',
            name: '벚꽃러버',
            joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            role: 'leader',
            status: 'active',
            age: 28,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_1',
            name: '봄나들이',
            joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 25,
            travelStyle: 'NATURE',
          },
          {
            id: 'member_2',
            name: '꽃구경왔어요',
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 32,
            travelStyle: 'RELAXATION',
          },
          {
            id: 'member_3',
            name: '카메라맨',
            joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 29,
            travelStyle: 'CULTURE',
          },
        ],
        tags: ['벚꽃', '봄여행', '사진촬영', '자연관광'],
        createdBy: 'leader_1',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'recruiting',
        budget: {
          min: 150000,
          max: 250000,
          currency: 'KRW',
        },
        travelStyle: 'NATURE',
        requirements: ['사진 찍기 좋아하는 분', '새벽 일찍 출발 가능한 분', '걷기 좋아하는 분'],
      },
      {
        id: 'group_2',
        name: '🍜 부산 맛집 투어',
        description:
          '부산의 숨은 맛집들을 탐방하며 진짜 부산 음식을 맛보는 여행입니다. 현지인 추천 맛집부터 유명 맛집까지!',
        destination: '부산',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        maxMembers: 4,
        currentMembers: 2,
        members: [
          {
            id: 'leader_2',
            name: '부산맛집러',
            joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            role: 'leader',
            status: 'active',
            age: 31,
            travelStyle: 'FOOD',
          },
          {
            id: 'member_4',
            name: '음식탐험가',
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 27,
            travelStyle: 'FOOD',
          },
        ],
        tags: ['맛집', '부산', '미식투어', '현지맛집'],
        createdBy: 'leader_2',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'recruiting',
        budget: {
          min: 200000,
          max: 350000,
          currency: 'KRW',
        },
        travelStyle: 'FOOD',
        requirements: ['매운 음식 괜찮은 분', '해산물 알레르기 없는 분', '새로운 음식 도전하는 분'],
      },
      {
        id: 'group_3',
        name: '🏔️ 지리산 등반',
        description:
          '지리산 천왕봉 등반을 함께할 등산 메이트를 모집합니다. 초보자도 환영하며, 안전한 등반을 위해 경험자가 리드합니다.',
        destination: '지리산 국립공원',
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        maxMembers: 8,
        currentMembers: 6,
        members: [
          {
            id: 'leader_3',
            name: '산악대장',
            joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            role: 'leader',
            status: 'active',
            age: 35,
            travelStyle: 'ADVENTURE',
          },
          {
            id: 'member_5',
            name: '등산초보',
            joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 28,
            travelStyle: 'NATURE',
          },
          {
            id: 'member_6',
            name: '산림욕러버',
            joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 33,
            travelStyle: 'RELAXATION',
          },
          {
            id: 'member_7',
            name: '트레킹맨',
            joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 30,
            travelStyle: 'ADVENTURE',
          },
          {
            id: 'member_8',
            name: '자연인',
            joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 27,
            travelStyle: 'NATURE',
          },
          {
            id: 'member_9',
            name: '등산마니아',
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 31,
            travelStyle: 'NATURE',
          },
        ],
        tags: ['등산', '지리산', '천왕봉', '자연관광'],
        createdBy: 'leader_3',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'recruiting',
        budget: {
          min: 100000,
          max: 180000,
          currency: 'KRW',
        },
        travelStyle: 'NATURE',
        requirements: ['기본 체력 필요', '등산화 필수', '안전수칙 준수'],
      },
      {
        id: 'group_4',
        name: '🎭 서울 문화 탐방',
        description:
          '서울의 다양한 문화시설을 탐방하며 예술과 역사를 체험하는 여행입니다. 박물관, 미술관, 전통문화 체험까지!',
        destination: '서울',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        maxMembers: 5,
        currentMembers: 5,
        members: [
          {
            id: 'leader_4',
            name: '문화애호가',
            joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            role: 'leader',
            status: 'active',
            age: 29,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_10',
            name: '박물관매니아',
            joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 27,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_11',
            name: '역사덕후',
            joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 32,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_12',
            name: '미술감상러',
            joinedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 25,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_13',
            name: '전통체험러',
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 28,
            travelStyle: 'CULTURE',
          },
        ],
        tags: ['문화', '박물관', '미술관', '전통체험'],
        createdBy: 'leader_4',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        status: 'full',
        budget: {
          min: 80000,
          max: 120000,
          currency: 'KRW',
        },
        travelStyle: 'CULTURE',
        requirements: ['문화에 관심 있는 분', '박물관 관람 좋아하는 분'],
      },
      {
        id: 'group_5',
        name: '🏖️ 제주도 힐링 여행',
        description:
          '제주도의 아름다운 자연에서 일상의 스트레스를 날리고 진정한 힐링을 경험해보세요. 한라산 둘레길, 카페 투어, 해변 산책까지!',
        destination: '제주도',
        startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        maxMembers: 6,
        currentMembers: 3,
        members: [
          {
            id: 'leader_5',
            name: '제주러버',
            joinedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            role: 'leader',
            status: 'active',
            age: 26,
            travelStyle: 'RELAXATION',
          },
          {
            id: 'member_5',
            name: '휴식이필요해',
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 30,
            travelStyle: 'RELAXATION',
          },
          {
            id: 'member_6',
            name: '카페순례자',
            joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 24,
            travelStyle: 'FOOD',
          },
        ],
        tags: ['제주도', '힐링', '카페투어', '해변산책', '자연관광'],
        createdBy: 'leader_5',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        status: 'recruiting',
        budget: {
          min: 300000,
          max: 500000,
          currency: 'KRW',
        },
        travelStyle: 'RELAXATION',
        requirements: ['여유로운 일정 선호', '새벽 출발 가능', '운전 가능자 우대'],
      },
      {
        id: 'group_6',
        name: '🎵 K-POP 성지순례',
        description:
          '한류 팬들을 위한 특별한 서울 투어! 연예인 소속사, 뮤직비디오 촬영지, 아이돌이 다녔던 카페들을 찾아다니는 여행입니다.',
        destination: '서울 (강남, 홍대, 이태원)',
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        maxMembers: 5,
        currentMembers: 4,
        members: [
          {
            id: 'leader_6',
            name: 'K팝덕후',
            joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            role: 'leader',
            status: 'active',
            age: 22,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_6_1',
            name: '아미',
            joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 24,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_6_2',
            name: '블링크',
            joinedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 21,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_6_3',
            name: '원스',
            joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 23,
            travelStyle: 'CULTURE',
          },
        ],
        tags: ['K-POP', '한류', '성지순례', '아이돌', '뮤직비디오'],
        createdBy: 'leader_6',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        status: 'recruiting',
        budget: {
          min: 120000,
          max: 200000,
          currency: 'KRW',
        },
        travelStyle: 'CULTURE',
        requirements: ['K-POP에 관심 있는 분', '사진 많이 찍을 예정', '한류 문화 좋아하는 분'],
      },
      {
        id: 'group_7',
        name: '🌃 강릉 야경 투어',
        description:
          '강릉의 아름다운 밤바다와 야경을 감상하는 낭만적인 여행입니다. 정동진 일출도 함께 보러 가요!',
        destination: '강릉, 정동진',
        startDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        maxMembers: 4,
        currentMembers: 2,
        members: [
          {
            id: 'leader_7',
            name: '야경사진가',
            joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            role: 'leader',
            status: 'active',
            age: 28,
            travelStyle: 'CULTURE',
          },
          {
            id: 'member_7_1',
            name: '일출러버',
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 26,
            travelStyle: 'CULTURE',
          },
        ],
        tags: ['강릉', '야경', '일출', '바다', '사진촬영'],
        createdBy: 'leader_7',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'recruiting',
        budget: {
          min: 180000,
          max: 280000,
          currency: 'KRW',
        },
        travelStyle: 'CULTURE',
        requirements: ['카메라 지참', '새벽 일찍 일어날 수 있는 분', '차량 이동 가능'],
      },
      {
        id: 'group_8',
        name: '🛍️ 홍대 쇼핑 투어',
        description:
          '홍대 거리의 독특한 샵들과 빈티지 매장을 탐방하며 나만의 스타일을 찾아보는 쇼핑 투어입니다.',
        destination: '홍대, 합정, 상수',
        startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        maxMembers: 6,
        currentMembers: 5,
        members: [
          {
            id: 'leader_8',
            name: '패션피플',
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            role: 'leader',
            status: 'active',
            age: 25,
            travelStyle: 'SHOPPING',
          },
          {
            id: 'member_8_1',
            name: '빈티지헌터',
            joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 23,
            travelStyle: 'SHOPPING',
          },
          {
            id: 'member_8_2',
            name: '트렌드세터',
            joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 27,
            travelStyle: 'SHOPPING',
          },
          {
            id: 'member_8_3',
            name: '샵투어러',
            joinedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 24,
            travelStyle: 'SHOPPING',
          },
          {
            id: 'member_8_4',
            name: '스타일리스트',
            joinedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            role: 'member',
            status: 'active',
            age: 26,
            travelStyle: 'SHOPPING',
          },
        ],
        tags: ['홍대', '쇼핑', '빈티지', '패션', '스타일링'],
        createdBy: 'leader_8',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'recruiting',
        budget: {
          min: 100000,
          max: 300000,
          currency: 'KRW',
        },
        travelStyle: 'CULTURE',
        requirements: ['패션에 관심 있는 분', '쇼핑 좋아하는 분', '트렌드에 민감한 분'],
      },
    ];

    mockGroups.forEach(group => {
      this.groups.set(group.id, group);
    });
  }

  // 모든 그룹 조회
  async getAllGroups(): Promise<TravelGroup[]> {
    if (this.useMock) {
      return Array.from(this.groups.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

    try {
      const response = await apiClient.get<TravelGroupApiResponse[]>('/groups');
      return response.map(group => this.mapToTravelGroup(group));
    } catch (error) {
      logger.error('Failed to fetch groups, using mock data:', error);
      // API 실패 시 (비회원 등) mock 데이터 반환
      return this.getMockGroups();
    }
  }

  // 특정 그룹 조회
  async getGroup(groupId: string): Promise<TravelGroup | null> {
    if (this.useMock) {
      return this.groups.get(groupId) || null;
    }

    try {
      const response = await apiClient.get<TravelGroupApiResponse>(`/groups/${groupId}`);
      return this.mapToTravelGroup(response);
    } catch (error) {
      logger.error('Failed to fetch group:', error);
      return null;
    }
  }

  // 그룹 검색
  async searchGroups(
    query: string,
    filters?: {
      destination?: string;
      travelStyle?: string;
      status?: string;
      tags?: string[];
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<TravelGroup[]> {
    if (this.useMock) {
      let groups = Array.from(this.groups.values());

      // 텍스트 검색
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        groups = groups.filter(
          group =>
            group.name.toLowerCase().includes(searchTerm) ||
            group.description.toLowerCase().includes(searchTerm) ||
            group.destination.toLowerCase().includes(searchTerm) ||
            group.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // 필터 적용
      if (filters) {
        if (filters.destination) {
          groups = groups.filter(group =>
            group.destination.toLowerCase().includes(filters.destination!.toLowerCase())
          );
        }

        if (filters.travelStyle) {
          groups = groups.filter(group => group.travelStyle === filters.travelStyle);
        }

        if (filters.status) {
          groups = groups.filter(group => group.status === filters.status);
        }

        if (filters.tags && filters.tags.length > 0) {
          groups = groups.filter(group => filters.tags!.some(tag => group.tags.includes(tag)));
        }

        if (filters.dateRange) {
          groups = groups.filter(
            group =>
              group.startDate >= filters.dateRange!.start && group.endDate <= filters.dateRange!.end
          );
        }
      }

      return groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    try {
      // 쿼리 파라미터 구성
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (filters?.destination) params.append('destination', filters.destination);
      if (filters?.travelStyle) params.append('travelStyle', filters.travelStyle);
      if (filters?.status) params.append('status', filters.status);

      const response = await apiClient.get<TravelGroupApiResponse[]>(
        `/groups?${params.toString()}`
      );
      return response.map(group => this.mapToTravelGroup(group));
    } catch (error) {
      logger.error('Failed to search groups:', error);
      throw error;
    }
  }

  // 새 그룹 생성
  async createGroup(request: CreateGroupRequest): Promise<TravelGroup> {
    if (this.useMock) {
      const newGroup: TravelGroup = {
        id: 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...request,
        currentMembers: 1,
        members: [
          {
            id: this.currentUserId,
            name: '나',
            joinedAt: new Date(),
            role: 'leader',
            status: 'active',
          },
        ],
        createdBy: this.currentUserId,
        createdAt: new Date(),
        status: 'recruiting',
      };

      this.groups.set(newGroup.id, newGroup);
      return newGroup;
    }

    try {
      const response = await apiClient.post<TravelGroupApiResponse>('/groups', {
        title: request.name,
        description: request.description,
        destination: request.destination,
        startDate: request.startDate.toISOString(),
        endDate: request.endDate.toISOString(),
        maxMembers: request.maxMembers,
        travelStyle: request.travelStyle,
        requirements: request.requirements.join(','),
        budgetRange: request.budget ? `${request.budget.min}-${request.budget.max}` : undefined,
        groupImageUrl: request.coverImage,
      });
      return this.mapToTravelGroup(response);
    } catch (error) {
      logger.error('Failed to create group:', error);
      throw error;
    }
  }

  // 그룹 가입
  async joinGroup(groupId: string): Promise<boolean> {
    if (this.useMock) {
      const group = this.groups.get(groupId);
      if (!group) return false;

      if (group.currentMembers >= group.maxMembers) {
        throw new Error('그룹이 가득 찼습니다.');
      }

      // 이미 가입된 멤버인지 확인
      const alreadyJoined = group.members.some(member => member.id === this.currentUserId);
      if (alreadyJoined) {
        throw new Error('이미 가입된 그룹입니다.');
      }

      // 새 멤버 추가
      group.members.push({
        id: this.currentUserId,
        name: '나',
        joinedAt: new Date(),
        role: 'member',
        status: 'active',
      });

      group.currentMembers++;

      if (group.currentMembers >= group.maxMembers) {
        group.status = 'full';
      }

      this.groups.set(groupId, group);
      return true;
    }

    try {
      await apiClient.post(`/groups/${groupId}/join`, {});
      return true;
    } catch (error) {
      logger.error('Failed to join group:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as ApiError)?.message || '그룹 가입에 실패했습니다.';
      throw new Error(errorMessage);
    }
  }

  // 그룹 탈퇴
  async leaveGroup(groupId: string): Promise<boolean> {
    if (this.useMock) {
      const group = this.groups.get(groupId);
      if (!group) return false;

      const memberIndex = group.members.findIndex(member => member.id === this.currentUserId);
      if (memberIndex === -1) {
        throw new Error('가입되지 않은 그룹입니다.');
      }

      const member = group.members[memberIndex];
      if (member.role === 'leader' && group.members.length > 1) {
        throw new Error('리더는 탈퇴할 수 없습니다. 먼저 리더를 양도하세요.');
      }

      // 멤버 제거
      group.members.splice(memberIndex, 1);
      group.currentMembers--;

      if (group.status === 'full') {
        group.status = 'recruiting';
      }

      this.groups.set(groupId, group);
      return true;
    }

    try {
      await apiClient.post(`/groups/${groupId}/leave`, {});
      return true;
    } catch (error) {
      logger.error('Failed to leave group:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as ApiError)?.message || '그룹 탈퇴에 실패했습니다.';
      throw new Error(errorMessage);
    }
  }

  // 내가 가입한 그룹들
  async getMyGroups(): Promise<TravelGroup[]> {
    if (this.useMock) {
      return Array.from(this.groups.values())
        .filter(group => group.members.some(member => member.id === this.currentUserId))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    try {
      const response = await apiClient.get<TravelGroupApiResponse[]>('/groups/my-groups');
      return response.map(group => this.mapToTravelGroup(group));
    } catch (error) {
      logger.error('Failed to fetch my groups:', error);
      // 비회원이면 빈 배열 반환
      return [];
    }
  }

  // 추천 그룹 (간단한 알고리즘)
  async getRecommendedGroups(): Promise<TravelGroup[]> {
    if (this.useMock) {
      return Array.from(this.groups.values())
        .filter(
          group =>
            group.status === 'recruiting' &&
            !group.members.some(member => member.id === this.currentUserId)
        )
        .sort(() => Math.random() - 0.5) // 랜덤 정렬
        .slice(0, 6);
    }

    try {
      // 추천 API 엔드포인트가 구현되어 있다면 사용
      // 없다면 전체 그룹 중에서 랜덤 선택
      const response = await apiClient.get<TravelGroupApiResponse[]>('/groups?status=recruiting');
      return response
        .map(group => this.mapToTravelGroup(group))
        .filter(group => !group.members.some(member => member.id === this.currentUserId))
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
    } catch (error) {
      logger.error('Failed to fetch recommended groups, using mock data:', error);
      // API 실패 시 mock 데이터에서 추천
      this.ensureMockData();
      return Array.from(this.groups.values())
        .filter(group => group.status === 'recruiting')
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
    }
  }

  // 백엔드 응답을 TravelGroup으로 변환
  private mapToTravelGroup(data: TravelGroupApiResponse): TravelGroup {
    return {
      id: data.id?.toString() || '',
      name: data.title || data.name || '',
      description: data.description || '',
      destination: data.destination || '',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      maxMembers: data.maxMembers || 10,
      currentMembers: data.currentMembers || 0,
      members: (data.members || []).map((m: GroupMemberApiResponse) => ({
        id: m.userId?.toString() || m.id?.toString() || '',
        name: m.nickname || m.name || '',
        profileImage: m.profileImageUrl || m.profileImage,
        joinedAt: new Date(m.joinedAt || m.createdAt || Date.now()),
        role: m.role === 'CREATOR' ? 'leader' : 'member',
        status: m.status?.toLowerCase() === 'accepted' ? 'active' : 'pending',
        age: m.age,
        travelStyle: m.travelStyle,
      })),
      tags: data.tags || [],
      coverImage: data.groupImageUrl || data.coverImage,
      createdBy: data.creatorId?.toString() || data.createdBy || '',
      createdAt: new Date(data.createdAt),
      status: this.mapStatus(data.status || ''),
      budget: data.budgetRange ? this.parseBudget(data.budgetRange) : undefined,
      travelStyle: data.travelStyle || '',
      requirements: data.requirements
        ? typeof data.requirements === 'string'
          ? data.requirements.split(',').map((r: string) => r.trim())
          : data.requirements
        : [],
    };
  }

  private mapStatus(status: string): 'recruiting' | 'full' | 'active' | 'completed' {
    const statusMap: { [key: string]: 'recruiting' | 'full' | 'active' | 'completed' } = {
      RECRUITING: 'recruiting',
      ACTIVE: 'active',
      COMPLETED: 'completed',
      CANCELLED: 'completed',
    };
    return statusMap[status?.toUpperCase()] || 'recruiting';
  }

  private parseBudget(
    budgetRange: string
  ): { min: number; max: number; currency: string } | undefined {
    try {
      const parts = budgetRange.split('-');
      if (parts.length === 2) {
        return {
          min: parseInt(parts[0]),
          max: parseInt(parts[1]),
          currency: 'KRW',
        };
      }
    } catch (e) {
      logger.warn('Failed to parse budget range:', budgetRange);
    }
    return undefined;
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }
}

export const groupService = new GroupService();
