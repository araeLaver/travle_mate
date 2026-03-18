import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * 장소에 리뷰 작성
 */
export const createReview = async (
  locationId: number,
  request: CreateReviewRequest
): Promise<LocationReviewResponse> => {
  const response = await fetch(`${API_BASE_URL}/locations/${locationId}/reviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '리뷰 작성에 실패했습니다.');
  }

  return response.json();
};

/**
 * 리뷰 수정
 */
export const updateReview = async (
  reviewId: number,
  request: UpdateReviewRequest
): Promise<LocationReviewResponse> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '리뷰 수정에 실패했습니다.');
  }

  return response.json();
};

/**
 * 리뷰 삭제
 */
export const deleteReview = async (reviewId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '리뷰 삭제에 실패했습니다.');
  }
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
  const response = await fetch(
    `${API_BASE_URL}/locations/${locationId}/reviews?sort=${sort}&page=${page}&size=${size}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('리뷰 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 사용자 리뷰 목록 조회
 */
export const getUserReviews = async (
  userId: number,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<LocationReviewResponse>> => {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/reviews?page=${page}&size=${size}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('리뷰 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 리뷰 상세 조회
 */
export const getReview = async (reviewId: number): Promise<LocationReviewResponse> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('리뷰를 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 도움됨 토글
 */
export const toggleHelpful = async (reviewId: number): Promise<{ isHelpful: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '도움됨 표시에 실패했습니다.');
  }

  return response.json();
};

/**
 * 장소 리뷰 통계 조회
 */
export const getLocationReviewStats = async (locationId: number): Promise<LocationReviewStats> => {
  const response = await fetch(`${API_BASE_URL}/locations/${locationId}/reviews/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('리뷰 통계를 불러오는데 실패했습니다.');
  }

  return response.json();
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
