import { apiClient } from './apiClient';

// ===== 타입 =====

export interface ReviewerSummary {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

export interface TravelReviewResponse {
  id: number;
  reviewerSummary: ReviewerSummary;
  punctualityScore: number;
  mannersScore: number;
  communicationScore: number;
  wouldTravelAgain: boolean;
  comment?: string;
  createdAt: string;
  averageScore: number;
}

export interface CreateTravelReviewRequest {
  revieweeId: number;
  matchRequestId: number;
  punctualityScore: number;
  mannersScore: number;
  communicationScore: number;
  wouldTravelAgain: boolean;
  comment?: string;
}

// ===== API 함수 =====

/**
 * 동행 후 평가 작성
 * POST /api/reviews
 */
export const createTravelReview = async (
  data: CreateTravelReviewRequest
): Promise<TravelReviewResponse> => {
  return apiClient.post<TravelReviewResponse, CreateTravelReviewRequest>('/reviews', data);
};

/**
 * 특정 유저가 받은 리뷰 목록
 * GET /api/reviews/user/{userId}
 */
export const getReviewsForUser = async (userId: number): Promise<TravelReviewResponse[]> => {
  return apiClient.get<TravelReviewResponse[]>(`/reviews/user/${userId}`);
};

/**
 * 특정 매칭에 대한 리뷰 목록 (양방향)
 * GET /api/reviews/match/{matchId}
 */
export const getReviewsForMatch = async (matchId: number): Promise<TravelReviewResponse[]> => {
  return apiClient.get<TravelReviewResponse[]>(`/reviews/match/${matchId}`);
};
