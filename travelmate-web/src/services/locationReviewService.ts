import { apiClient } from './apiClient';
import { appendQuery, withServiceError } from './apiRequestUtils';

// ===== Types =====

export type VisitedSeason = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';

export interface ReviewerInfo {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

export interface LocationReviewResponse {
  id: number;
  reviewer: ReviewerInfo;
  locationId: number;
  locationName: string;
  rating: number;
  comment?: string;
  visitedSeason?: VisitedSeason;
  visitedSeasonDisplay?: string;
  photoUrls: string[];
  helpfulCount: number;
  isHelpful: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
  visitedSeason?: VisitedSeason;
  photoUrls?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  visitedSeason?: VisitedSeason;
  photoUrls?: string[];
}

export interface LocationReviewStats {
  locationId: number;
  averageRating: number;
  reviewCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ===== API Methods =====

/**
 * 장소에 리뷰 작성
 */
export const createReview = async (
  locationId: number,
  request: CreateReviewRequest
): Promise<LocationReviewResponse> => {
  return withServiceError(
    apiClient.post<LocationReviewResponse, CreateReviewRequest>(
      `/locations/${locationId}/reviews`,
      request
    ),
    '리뷰 작성에 실패했습니다.'
  );
};

/**
 * 리뷰 수정
 */
export const updateReview = async (
  reviewId: number,
  request: UpdateReviewRequest
): Promise<LocationReviewResponse> => {
  return withServiceError(
    apiClient.put<LocationReviewResponse, UpdateReviewRequest>(`/reviews/${reviewId}`, request),
    '리뷰 수정에 실패했습니다.'
  );
};

/**
 * 리뷰 삭제
 */
export const deleteReview = async (reviewId: number): Promise<void> => {
  await withServiceError(
    apiClient.delete<void>(`/reviews/${reviewId}`),
    '리뷰 삭제에 실패했습니다.'
  );
};

/**
 * 장소별 리뷰 목록 조회
 */
export const getLocationReviews = async (
  locationId: number,
  sort: 'recent' | 'helpful' = 'recent',
  page: number = 0,
  size: number = 10
): Promise<PageResponse<LocationReviewResponse>> => {
  return withServiceError(
    apiClient.get<PageResponse<LocationReviewResponse>>(
      appendQuery(`/locations/${locationId}/reviews`, { sort, page, size })
    ),
    '리뷰 목록을 불러오는데 실패했습니다.'
  );
};

/**
 * 사용자 리뷰 목록 조회
 */
export const getUserReviews = async (
  userId: number,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<LocationReviewResponse>> => {
  return withServiceError(
    apiClient.get<PageResponse<LocationReviewResponse>>(
      appendQuery(`/users/${userId}/reviews`, { page, size })
    ),
    '리뷰 목록을 불러오는데 실패했습니다.'
  );
};

/**
 * 리뷰 상세 조회
 */
export const getReview = async (reviewId: number): Promise<LocationReviewResponse> => {
  return withServiceError(
    apiClient.get<LocationReviewResponse>(`/reviews/${reviewId}`),
    '리뷰를 불러오는데 실패했습니다.'
  );
};

/**
 * 도움됨 토글
 */
export const toggleHelpful = async (reviewId: number): Promise<{ isHelpful: boolean }> => {
  return withServiceError(
    apiClient.post<{ isHelpful: boolean }>(`/reviews/${reviewId}/helpful`),
    '도움됨 표시에 실패했습니다.'
  );
};

/**
 * 장소 리뷰 통계 조회
 */
export const getLocationReviewStats = async (locationId: number): Promise<LocationReviewStats> => {
  return withServiceError(
    apiClient.get<LocationReviewStats>(`/locations/${locationId}/reviews/stats`),
    '리뷰 통계를 불러오는데 실패했습니다.'
  );
};

/**
 * 방문 계절 라벨
 */
export const getSeasonLabel = (season: VisitedSeason): string => {
  switch (season) {
    case 'SPRING':
      return '봄';
    case 'SUMMER':
      return '여름';
    case 'FALL':
      return '가을';
    case 'WINTER':
      return '겨울';
    default:
      return season;
  }
};

export const locationReviewService = {
  createReview,
  updateReview,
  deleteReview,
  getLocationReviews,
  getUserReviews,
  getReview,
  toggleHelpful,
  getLocationReviewStats,
  getSeasonLabel,
};
