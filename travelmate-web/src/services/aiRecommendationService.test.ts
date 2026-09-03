import {
  BUDGET_RANGES,
  ChatRequestValidationError,
  ItineraryRequestValidationError,
  PersonalizedRequestValidationError,
  PlaceRecommendationRequestValidationError,
  TravelTipsRequestValidationError,
  aiRecommendationService,
  buildChatRequestPayload,
  buildItineraryRequestPayload,
  buildPersonalizedRequestPayload,
  buildPlaceRecommendationRequestPayload,
  buildTravelTipsRequestPayload,
} from './aiRecommendationService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const itineraryResponse = {
  destination: '제주',
  startDate: '2026-08-01',
  endDate: '2026-08-03',
  dayPlans: [],
  tips: [],
  budgetEstimate: {
    totalEstimate: 100000,
    accommodationEstimate: 50000,
    foodEstimate: 20000,
    transportationEstimate: 20000,
    activitiesEstimate: 10000,
    currency: 'KRW',
  },
  summary: '제주 3일 여행',
};

describe('aiRecommendationService itinerary contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes backend budgetRange values in the picker options', () => {
    expect(BUDGET_RANGES.map(range => range.value)).toEqual(['LOW', 'MEDIUM', 'HIGH', 'LUXURY']);
  });

  it('normalizes itinerary requests before sending them to the backend', async () => {
    mockApiClient.post.mockResolvedValueOnce(itineraryResponse);

    const response = await aiRecommendationService.generateItinerary({
      destination: '  제주  ',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      travelStyle: ' CULTURE ',
      budgetRange: 'BUDGET',
      interests: [' 맛집 ', ' ', '카페'],
      preferences: ['  여유로운 일정  '],
      groupSize: 2,
    });

    expect(response).toBe(itineraryResponse);
    expect(mockApiClient.post).toHaveBeenCalledWith('/ai/itinerary', {
      destination: '제주',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      travelStyle: 'CULTURE',
      budgetRange: 'LOW',
      interests: ['맛집', '카페'],
      preferences: ['여유로운 일정'],
      groupSize: 2,
    });
  });

  it('maps legacy frontend budget values to backend-supported values', () => {
    expect(
      buildItineraryRequestPayload({
        destination: '오사카',
        startDate: '2026-09-01',
        endDate: '2026-09-01',
        budgetRange: 'COMFORT',
      }).budgetRange
    ).toBe('HIGH');

    expect(aiRecommendationService.getBudgetRangeLabel('BUDGET')).toBe('저예산');
    expect(aiRecommendationService.getBudgetRangeLabel('COMFORT')).toBe('편안한');
  });

  it('rejects invalid itinerary requests before the API call', async () => {
    await expect(
      aiRecommendationService.generateItinerary({
        destination: '제',
        startDate: '2026-08-01',
        endDate: '2026-08-03',
      })
    ).rejects.toThrow(ItineraryRequestValidationError);

    await expect(
      aiRecommendationService.generateItinerary({
        destination: '제주',
        startDate: '2026-02-30',
        endDate: '2026-08-03',
      })
    ).rejects.toThrow('여행 날짜를 YYYY-MM-DD 형식으로 선택해주세요.');

    await expect(
      aiRecommendationService.generateItinerary({
        destination: '제주',
        startDate: '2026-08-04',
        endDate: '2026-08-03',
      })
    ).rejects.toThrow('도착일은 출발일과 같거나 이후여야 합니다.');

    await expect(
      aiRecommendationService.generateItinerary({
        destination: '제주',
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        budgetRange: 'UNKNOWN',
      })
    ).rejects.toThrow('예산 범위를 다시 선택해주세요.');

    await expect(
      aiRecommendationService.generateItinerary({
        destination: '제주',
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        groupSize: 11,
      })
    ).rejects.toThrow('인원 수는 1~10명 사이로 선택해주세요.');

    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it('calculates trip days from date-only values without reversing invalid ranges', () => {
    expect(aiRecommendationService.calculateTripDays('2026-08-01', '2026-08-01')).toBe(1);
    expect(aiRecommendationService.calculateTripDays('2026-08-01', '2026-08-03')).toBe(3);
    expect(aiRecommendationService.calculateTripDays('2026-08-03', '2026-08-01')).toBe(0);
    expect(aiRecommendationService.calculateTripDays('2026-02-30', '2026-03-01')).toBe(0);
  });
});

describe('aiRecommendationService place recommendation contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes place recommendation requests before sending them to the backend', async () => {
    mockApiClient.post.mockResolvedValueOnce([]);

    await aiRecommendationService.getPlaceRecommendations({
      latitude: 37.5665,
      longitude: 126.978,
      radiusKm: 5,
      categories: [' RESTAURANT ', ' ', 'CAFE'],
      timeOfDay: ' EVENING ',
      weather: ' 맑음 ',
      previouslyVisited: [' 남산 ', ' '],
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/ai/places', {
      latitude: 37.5665,
      longitude: 126.978,
      radiusKm: 5,
      categories: ['RESTAURANT', 'CAFE'],
      timeOfDay: 'EVENING',
      weather: '맑음',
      previouslyVisited: ['남산'],
    });
  });

  it('uses validated query params for quick recommendations', async () => {
    mockApiClient.get.mockResolvedValueOnce([]);

    await aiRecommendationService.getQuickRecommendations(37.5665, 126.978, 10);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/ai/quick?latitude=37.5665&longitude=126.978&radiusKm=10'
    );
  });

  it('rejects invalid place recommendation coordinates and radius', async () => {
    expect(() =>
      buildPlaceRecommendationRequestPayload({
        latitude: 91,
        longitude: 126.978,
      })
    ).toThrow(PlaceRecommendationRequestValidationError);

    expect(() =>
      buildPlaceRecommendationRequestPayload({
        latitude: 37.5665,
        longitude: -181,
      })
    ).toThrow('경도 값을 다시 확인해주세요.');

    await expect(
      aiRecommendationService.getPlaceRecommendations({
        latitude: 37.5665,
        longitude: 126.978,
        radiusKm: 0,
      })
    ).rejects.toThrow('추천 반경은 1~20km 사이로 선택해주세요.');

    expect(mockApiClient.post).not.toHaveBeenCalled();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('aiRecommendationService personalized, tips, and chat contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes personalized recommendation requests before sending them', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      places: [],
      activities: [],
      tips: [],
      aiInsight: '추천 준비 완료',
      confidenceScore: 0.8,
    });

    await aiRecommendationService.getPersonalizedRecommendations({
      currentLocation: '  서울  ',
      latitude: 37.5665,
      longitude: 126.978,
      mood: ' RELAXED ',
      availableHours: 3,
      companions: [' 친구 ', ' '],
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/ai/personalized', {
      currentLocation: '서울',
      latitude: 37.5665,
      longitude: 126.978,
      mood: 'RELAXED',
      availableHours: 3,
      companions: ['친구'],
    });
  });

  it('rejects personalized requests that would fail backend place recommendations', () => {
    expect(() =>
      buildPersonalizedRequestPayload({
        latitude: Number.NaN,
        longitude: 126.978,
      })
    ).toThrow(PersonalizedRequestValidationError);

    expect(() =>
      buildPersonalizedRequestPayload({
        latitude: 37.5665,
        longitude: 126.978,
        availableHours: 25,
      })
    ).toThrow('이용 가능 시간은 1~24시간 사이로 입력해주세요.');
  });

  it('normalizes travel tips requests and rejects invalid dates', async () => {
    mockApiClient.post.mockResolvedValueOnce([]);

    await aiRecommendationService.getTravelTips({
      destination: '  부산  ',
      travelDate: ' 2026-08-01 ',
      travelStyle: ' FOOD ',
      specificTopics: [' 맛집 ', ' ', '교통'],
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/ai/tips', {
      destination: '부산',
      travelDate: '2026-08-01',
      travelStyle: 'FOOD',
      specificTopics: ['맛집', '교통'],
    });

    expect(() =>
      buildTravelTipsRequestPayload({
        destination: '부',
      })
    ).toThrow(TravelTipsRequestValidationError);

    expect(() =>
      buildTravelTipsRequestPayload({
        destination: '부산',
        travelDate: '2026-02-30',
      })
    ).toThrow('여행 날짜를 YYYY-MM-DD 형식으로 선택해주세요.');
  });

  it('normalizes chat requests and rejects empty or oversized messages before the API call', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      message: '좋아요',
      conversationId: 'conv-1',
    });

    await aiRecommendationService.chat({
      message: '  제주 일정 추천해줘  ',
      conversationId: '  conv-1  ',
      context: '  itinerary  ',
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/ai/chat', {
      message: '제주 일정 추천해줘',
      conversationId: 'conv-1',
      context: 'itinerary',
    });

    expect(() => buildChatRequestPayload({ message: '   ' })).toThrow(ChatRequestValidationError);
    expect(() => buildChatRequestPayload({ message: '가'.repeat(1001) })).toThrow(
      '메시지는 1000자 이하로 입력해주세요.'
    );
  });
});
