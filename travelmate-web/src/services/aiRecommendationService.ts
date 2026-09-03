/**
 * AI Recommendation Service
 * AI 기반 추천 시스템 API 서비스
 */

import { apiClient } from './apiClient';

// Types
export interface ItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelStyle?: string;
  budgetRange?: string;
  interests?: string[];
  preferences?: string[];
  groupSize?: number;
}

export class ItineraryRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ItineraryRequestValidationError';
  }
}

export class PlaceRecommendationRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlaceRecommendationRequestValidationError';
  }
}

export class PersonalizedRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersonalizedRequestValidationError';
  }
}

export class TravelTipsRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TravelTipsRequestValidationError';
  }
}

export class ChatRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatRequestValidationError';
  }
}

export const isItineraryRequestValidationError = (
  error: unknown
): error is ItineraryRequestValidationError =>
  error instanceof ItineraryRequestValidationError ||
  (error instanceof Error && error.name === 'ItineraryRequestValidationError');

export const isPlaceRecommendationRequestValidationError = (
  error: unknown
): error is PlaceRecommendationRequestValidationError =>
  error instanceof PlaceRecommendationRequestValidationError ||
  (error instanceof Error && error.name === 'PlaceRecommendationRequestValidationError');

export const isPersonalizedRequestValidationError = (
  error: unknown
): error is PersonalizedRequestValidationError =>
  error instanceof PersonalizedRequestValidationError ||
  (error instanceof Error && error.name === 'PersonalizedRequestValidationError');

export const isTravelTipsRequestValidationError = (
  error: unknown
): error is TravelTipsRequestValidationError =>
  error instanceof TravelTipsRequestValidationError ||
  (error instanceof Error && error.name === 'TravelTipsRequestValidationError');

export const isChatRequestValidationError = (error: unknown): error is ChatRequestValidationError =>
  error instanceof ChatRequestValidationError ||
  (error instanceof Error && error.name === 'ChatRequestValidationError');

export interface Activity {
  name: string;
  description: string;
  location: string;
  time: string;
  durationMinutes: number;
  category: string;
  estimatedCost?: number;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  theme: string;
  activities: Activity[];
  notes?: string;
}

export interface BudgetEstimate {
  totalEstimate: number;
  accommodationEstimate: number;
  foodEstimate: number;
  transportationEstimate: number;
  activitiesEstimate: number;
  currency: string;
  breakdown?: Record<string, number>;
}

export interface ItineraryResponse {
  destination: string;
  startDate: string;
  endDate: string;
  dayPlans: DayPlan[];
  tips: string[];
  budgetEstimate: BudgetEstimate;
  summary: string;
}

export interface PlaceRecommendationRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  categories?: string[];
  timeOfDay?: string;
  weather?: string;
  previouslyVisited?: string[];
}

export interface PlaceRecommendation {
  placeId: number;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  distance: number;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  aiScore: number;
  reasons: string[];
  bestTimeToVisit?: string;
  estimatedDuration?: string;
}

export interface PersonalizedRequest {
  currentLocation?: string;
  latitude?: number;
  longitude?: number;
  mood?: string;
  availableHours?: number;
  companions?: string[];
}

export interface ActivitySuggestion {
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  difficulty?: string;
  estimatedCost?: number;
  requirements?: string[];
  aiScore: number;
  reason: string;
}

export interface PersonalizedResponse {
  places: PlaceRecommendation[];
  activities: ActivitySuggestion[];
  tips: string[];
  aiInsight: string;
  confidenceScore: number;
}

export interface TravelTipsRequest {
  destination: string;
  travelDate?: string;
  travelStyle?: string;
  specificTopics?: string[];
}

export interface TravelTip {
  category: string;
  title: string;
  content: string;
  importance: string;
  relatedPlaces?: string[];
}

export interface UserAnalysis {
  userId: number;
  travelPersona: string;
  topInterests: string[];
  preferredDestinations: string[];
  predictedNextDestination?: string;
  adventureScore: number;
  cultureScore: number;
  relaxationScore: number;
  socialScore: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  relatedPlaces?: PlaceRecommendation[];
  suggestedActions?: string[];
}

// Travel styles
export const TRAVEL_STYLES = [
  { value: 'ADVENTURE', label: '모험', icon: '🏔️' },
  { value: 'RELAXATION', label: '휴양', icon: '🏖️' },
  { value: 'CULTURE', label: '문화탐방', icon: '🏛️' },
  { value: 'FOOD', label: '미식여행', icon: '🍜' },
  { value: 'NATURE', label: '자연', icon: '🌲' },
  { value: 'SHOPPING', label: '쇼핑', icon: '🛍️' },
  { value: 'FAMILY', label: '가족여행', icon: '👨‍👩‍👧‍👦' },
  { value: 'ROMANTIC', label: '로맨틱', icon: '💑' },
] as const;

// Budget ranges
export const BUDGET_RANGES = [
  { value: 'LOW', label: '저예산', description: '최대한 절약' },
  { value: 'MEDIUM', label: '적당한', description: '합리적인 소비' },
  { value: 'HIGH', label: '편안한', description: '편의성 우선' },
  { value: 'LUXURY', label: '럭셔리', description: '최고급 경험' },
] as const;

// Mood options
export const MOOD_OPTIONS = [
  { value: 'ENERGETIC', label: '활기찬', emoji: '⚡' },
  { value: 'RELAXED', label: '여유로운', emoji: '😌' },
  { value: 'ADVENTUROUS', label: '모험적인', emoji: '🎯' },
  { value: 'ROMANTIC', label: '로맨틱', emoji: '💕' },
  { value: 'CULTURAL', label: '문화적인', emoji: '🎭' },
  { value: 'SOCIAL', label: '사교적인', emoji: '👥' },
] as const;

// Travel persona descriptions
export const TRAVEL_PERSONAS: Record<
  string,
  { title: string; description: string; emoji: string }
> = {
  EXPLORER: {
    title: '탐험가',
    description: '새로운 장소를 발견하는 것을 좋아하는 모험가',
    emoji: '🧭',
  },
  CULTURE_LOVER: {
    title: '문화 애호가',
    description: '역사와 예술을 사랑하는 문화 탐험가',
    emoji: '🏛️',
  },
  FOODIE: {
    title: '미식가',
    description: '현지 음식을 탐험하는 음식 애호가',
    emoji: '🍽️',
  },
  RELAXER: {
    title: '휴양가',
    description: '편안한 휴식을 즐기는 여행자',
    emoji: '🧘',
  },
  ADVENTURER: {
    title: '모험가',
    description: '스릴 넘치는 활동을 즐기는 액티비스트',
    emoji: '🏄',
  },
  PHOTOGRAPHER: {
    title: '포토그래퍼',
    description: '아름다운 순간을 담는 시각적 여행자',
    emoji: '📸',
  },
  SOCIAL_BUTTERFLY: {
    title: '소셜 나비',
    description: '새로운 사람들을 만나는 것을 좋아하는 사교적인 여행자',
    emoji: '🦋',
  },
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateOnlyUtc = (value: string): number | null => {
  if (!DATE_ONLY_PATTERN.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.getTime();
};

const normalizeStringList = (values?: string[]): string[] | undefined => {
  const normalized = values?.map(value => value.trim()).filter(value => value.length > 0);
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const normalizeBudgetRange = (range?: string): string | undefined => {
  const normalized = range?.trim().toUpperCase();
  if (!normalized) return undefined;

  switch (normalized) {
    case 'BUDGET':
    case 'LOW':
      return 'LOW';
    case 'MODERATE':
    case 'MEDIUM':
      return 'MEDIUM';
    case 'COMFORT':
    case 'HIGH':
      return 'HIGH';
    case 'LUXURY':
      return 'LUXURY';
    default:
      throw new ItineraryRequestValidationError('예산 범위를 다시 선택해주세요.');
  }
};

const normalizeGroupSize = (groupSize?: number): number | undefined => {
  if (groupSize === undefined || groupSize === null) return undefined;
  const numericGroupSize = Number(groupSize);
  if (!Number.isInteger(numericGroupSize) || numericGroupSize < 1 || numericGroupSize > 10) {
    throw new ItineraryRequestValidationError('인원 수는 1~10명 사이로 선택해주세요.');
  }
  return numericGroupSize;
};

const normalizeCoordinate = (value: number, min: number, max: number, label: string): number => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
    throw new PlaceRecommendationRequestValidationError(`${label} 값을 다시 확인해주세요.`);
  }
  return numericValue;
};

const normalizeRadiusKm = (radiusKm: number = 5): number => {
  const numericRadius = Number(radiusKm);
  if (!Number.isFinite(numericRadius) || numericRadius < 1 || numericRadius > 20) {
    throw new PlaceRecommendationRequestValidationError('추천 반경은 1~20km 사이로 선택해주세요.');
  }
  return numericRadius;
};

const normalizeAvailableHours = (availableHours?: number): number | undefined => {
  if (availableHours === undefined || availableHours === null) return undefined;
  const numericHours = Number(availableHours);
  if (!Number.isInteger(numericHours) || numericHours < 1 || numericHours > 24) {
    throw new PersonalizedRequestValidationError('이용 가능 시간은 1~24시간 사이로 입력해주세요.');
  }
  return numericHours;
};

export const buildItineraryRequestPayload = (request: ItineraryRequest): ItineraryRequest => {
  const destination = request.destination.trim();
  const startDate = request.startDate.trim();
  const endDate = request.endDate.trim();
  const startTime = parseDateOnlyUtc(startDate);
  const endTime = parseDateOnlyUtc(endDate);

  if (destination.length < 2) {
    throw new ItineraryRequestValidationError('목적지는 2자 이상 입력해주세요.');
  }
  if (startTime === null || endTime === null) {
    throw new ItineraryRequestValidationError('여행 날짜를 YYYY-MM-DD 형식으로 선택해주세요.');
  }
  if (endTime < startTime) {
    throw new ItineraryRequestValidationError('도착일은 출발일과 같거나 이후여야 합니다.');
  }

  const payload: ItineraryRequest = {
    destination,
    startDate,
    endDate,
  };
  const travelStyle = request.travelStyle?.trim();
  const budgetRange = normalizeBudgetRange(request.budgetRange);
  const interests = normalizeStringList(request.interests);
  const preferences = normalizeStringList(request.preferences);
  const groupSize = normalizeGroupSize(request.groupSize);

  if (travelStyle) payload.travelStyle = travelStyle;
  if (budgetRange) payload.budgetRange = budgetRange;
  if (interests) payload.interests = interests;
  if (preferences) payload.preferences = preferences;
  if (groupSize !== undefined) payload.groupSize = groupSize;

  return payload;
};

export const buildPlaceRecommendationRequestPayload = (
  request: PlaceRecommendationRequest
): PlaceRecommendationRequest => {
  const payload: PlaceRecommendationRequest = {
    latitude: normalizeCoordinate(request.latitude, -90, 90, '위도'),
    longitude: normalizeCoordinate(request.longitude, -180, 180, '경도'),
    radiusKm: normalizeRadiusKm(request.radiusKm),
  };
  const categories = normalizeStringList(request.categories);
  const previouslyVisited = normalizeStringList(request.previouslyVisited);
  const timeOfDay = request.timeOfDay?.trim();
  const weather = request.weather?.trim();

  if (categories) payload.categories = categories;
  if (previouslyVisited) payload.previouslyVisited = previouslyVisited;
  if (timeOfDay) payload.timeOfDay = timeOfDay;
  if (weather) payload.weather = weather;

  return payload;
};

export const buildPersonalizedRequestPayload = (
  request: PersonalizedRequest
): PersonalizedRequest => {
  let latitude: number;
  let longitude: number;
  try {
    latitude = normalizeCoordinate(request.latitude as number, -90, 90, '위도');
    longitude = normalizeCoordinate(request.longitude as number, -180, 180, '경도');
  } catch (error) {
    if (isPlaceRecommendationRequestValidationError(error)) {
      throw new PersonalizedRequestValidationError(error.message);
    }
    throw error;
  }

  const payload: PersonalizedRequest = {
    latitude,
    longitude,
  };
  const currentLocation = request.currentLocation?.trim();
  const mood = request.mood?.trim();
  const companions = normalizeStringList(request.companions);
  const availableHours = normalizeAvailableHours(request.availableHours);

  if (currentLocation) payload.currentLocation = currentLocation;
  if (mood) payload.mood = mood;
  if (companions) payload.companions = companions;
  if (availableHours !== undefined) payload.availableHours = availableHours;

  return payload;
};

export const buildTravelTipsRequestPayload = (request: TravelTipsRequest): TravelTipsRequest => {
  const destination = request.destination.trim();
  if (destination.length < 2) {
    throw new TravelTipsRequestValidationError('목적지는 2자 이상 입력해주세요.');
  }

  const payload: TravelTipsRequest = { destination };
  const travelDate = request.travelDate?.trim();
  const travelStyle = request.travelStyle?.trim();
  const specificTopics = normalizeStringList(request.specificTopics);

  if (travelDate) {
    if (parseDateOnlyUtc(travelDate) === null) {
      throw new TravelTipsRequestValidationError('여행 날짜를 YYYY-MM-DD 형식으로 선택해주세요.');
    }
    payload.travelDate = travelDate;
  }
  if (travelStyle) payload.travelStyle = travelStyle;
  if (specificTopics) payload.specificTopics = specificTopics;

  return payload;
};

export const buildChatRequestPayload = (request: ChatRequest): ChatRequest => {
  const message = request.message.trim();
  if (!message) {
    throw new ChatRequestValidationError('메시지를 입력해주세요.');
  }
  if (message.length > 1000) {
    throw new ChatRequestValidationError('메시지는 1000자 이하로 입력해주세요.');
  }

  const payload: ChatRequest = { message };
  const conversationId = request.conversationId?.trim();
  const context = request.context?.trim();

  if (conversationId) payload.conversationId = conversationId;
  if (context) payload.context = context;

  return payload;
};

class AIRecommendationService {
  /**
   * Generate AI travel itinerary
   */
  async generateItinerary(request: ItineraryRequest): Promise<ItineraryResponse> {
    return apiClient.post<ItineraryResponse>(
      '/ai/itinerary',
      buildItineraryRequestPayload(request)
    );
  }

  /**
   * Get AI place recommendations based on location
   */
  async getPlaceRecommendations(
    request: PlaceRecommendationRequest
  ): Promise<PlaceRecommendation[]> {
    return apiClient.post<PlaceRecommendation[]>(
      '/ai/places',
      buildPlaceRecommendationRequestPayload(request)
    );
  }

  /**
   * Get personalized recommendations based on user history
   */
  async getPersonalizedRecommendations(
    request: PersonalizedRequest
  ): Promise<PersonalizedResponse> {
    return apiClient.post<PersonalizedResponse>(
      '/ai/personalized',
      buildPersonalizedRequestPayload(request)
    );
  }

  /**
   * Get user travel analysis
   */
  async getUserAnalysis(): Promise<UserAnalysis> {
    return apiClient.get<UserAnalysis>('/ai/analysis');
  }

  /**
   * Get travel tips for destination
   */
  async getTravelTips(request: TravelTipsRequest): Promise<TravelTip[]> {
    return apiClient.post<TravelTip[]>('/ai/tips', buildTravelTipsRequestPayload(request));
  }

  /**
   * Chat with AI travel assistant
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('/ai/chat', buildChatRequestPayload(request));
  }

  /**
   * Get quick recommendations based on current location
   */
  async getQuickRecommendations(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<PlaceRecommendation[]> {
    const request = buildPlaceRecommendationRequestPayload({ latitude, longitude, radiusKm });
    const params = new URLSearchParams({
      latitude: String(request.latitude),
      longitude: String(request.longitude),
      radiusKm: String(request.radiusKm),
    });

    return apiClient.get<PlaceRecommendation[]>(`/ai/quick?${params.toString()}`);
  }

  // Helper methods

  /**
   * Get travel style label
   */
  getTravelStyleLabel(style: string): string {
    const found = TRAVEL_STYLES.find(s => s.value === style);
    return found ? `${found.icon} ${found.label}` : style;
  }

  /**
   * Get budget range label
   */
  getBudgetRangeLabel(range: string): string {
    let normalizedRange = range;
    try {
      normalizedRange = normalizeBudgetRange(range) || range;
    } catch {
      normalizedRange = range;
    }
    const found = BUDGET_RANGES.find(b => b.value === normalizedRange);
    return found ? found.label : range;
  }

  /**
   * Get mood label with emoji
   */
  getMoodLabel(mood: string): string {
    const found = MOOD_OPTIONS.find(m => m.value === mood);
    return found ? `${found.emoji} ${found.label}` : mood;
  }

  /**
   * Get persona info
   */
  getPersonaInfo(persona: string): { title: string; description: string; emoji: string } {
    return (
      TRAVEL_PERSONAS[persona] || {
        title: persona,
        description: '',
        emoji: '🌍',
      }
    );
  }

  /**
   * Format duration in minutes to readable string
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}분`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}시간`;
    }
    return `${hours}시간 ${remainingMinutes}분`;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'KRW'): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Calculate total trip days
   */
  calculateTripDays(startDate: string, endDate: string): number {
    const start = parseDateOnlyUtc(startDate);
    const end = parseDateOnlyUtc(endDate);
    if (start === null || end === null || end < start) return 0;
    return Math.floor((end - start) / DAY_MS) + 1;
  }

  /**
   * Get importance badge color
   */
  getImportanceColor(importance: string): string {
    switch (importance.toUpperCase()) {
      case 'HIGH':
        return 'red';
      case 'MEDIUM':
        return 'yellow';
      case 'LOW':
        return 'green';
      default:
        return 'gray';
    }
  }

  /**
   * Get AI score badge
   */
  getAIScoreBadge(score: number): { label: string; color: string } {
    if (score >= 0.9) return { label: '강력 추천', color: 'green' };
    if (score >= 0.7) return { label: '추천', color: 'blue' };
    if (score >= 0.5) return { label: '괜찮음', color: 'yellow' };
    return { label: '보통', color: 'gray' };
  }
}

export const aiRecommendationService = new AIRecommendationService();
export default aiRecommendationService;
