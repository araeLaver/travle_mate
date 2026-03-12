import { apiClient } from './apiClient';

// -----------------------------------------------------------------------
// DTOs
// -----------------------------------------------------------------------

export interface CreateReviewDto {
  targetUserId: number;
  punctualityScore: number;    // 1-5
  mannerScore: number;         // 1-5
  communicationScore: number;  // 1-5
  willTravelAgain: boolean;
  comment?: string;
}

export interface ReviewSummaryDto {
  avgPunctuality: number;
  avgManner: number;
  avgCommunication: number;
  willTravelAgainRatio: number;  // 0.0 ~ 1.0
  totalCount: number;
  overallAvg: number;
}

// -----------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------

export const reviewService = {
  /**
   * 동행 후기 작성
   */
  create: (data: CreateReviewDto): Promise<void> =>
    apiClient.post<void, CreateReviewDto>('/reviews', data),

  /**
   * 특정 유저의 동행 평점 요약 조회
   */
  getUserReviews: (userId: number): Promise<ReviewSummaryDto> =>
    apiClient.get<ReviewSummaryDto>(`/reviews/user/${userId}`),
};
