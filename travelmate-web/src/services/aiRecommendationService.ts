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
  { value: 'BUDGET', label: '저예산', description: '최대한 절약' },
  { value: 'MODERATE', label: '적당한', description: '합리적인 소비' },
  { value: 'COMFORT', label: '편안한', description: '편의성 우선' },
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

class AIRecommendationService {
  /**
   * Generate AI travel itinerary
   */
  async generateItinerary(request: ItineraryRequest): Promise<ItineraryResponse> {
    return apiClient.post<ItineraryResponse>('/ai/itinerary', request);
  }

  /**
   * Get AI place recommendations based on location
   */
  async getPlaceRecommendations(
    request: PlaceRecommendationRequest
  ): Promise<PlaceRecommendation[]> {
    return apiClient.post<PlaceRecommendation[]>('/ai/places', request);
  }

  /**
   * Get personalized recommendations based on user history
   */
  async getPersonalizedRecommendations(
    request: PersonalizedRequest
  ): Promise<PersonalizedResponse> {
    return apiClient.post<PersonalizedResponse>('/ai/personalized', request);
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
    return apiClient.post<TravelTip[]>('/ai/tips', request);
  }

  /**
   * Chat with AI travel assistant
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('/ai/chat', request);
  }

  /**
   * Get quick recommendations based on current location
   */
  async getQuickRecommendations(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<PlaceRecommendation[]> {
    return apiClient.get<PlaceRecommendation[]>(
      `/ai/quick?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
    );
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
    const found = BUDGET_RANGES.find(b => b.value === range);
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
