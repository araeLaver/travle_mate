import { apiClient } from './apiClient';
import { appendQuery, withServiceError } from './apiRequestUtils';

// ===== Types =====

export interface FollowUserResponse {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  followedAt: string;
  isMutual: boolean;
}

export interface FollowStatsResponse {
  userId: number;
  followerCount: number;
  followingCount: number;
}

export interface FollowResponse {
  success: boolean;
  message: string;
  isFollowing: boolean;
  isMutual: boolean;
  stats: FollowStatsResponse;
}

export interface FollowStatusResponse {
  userId: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
}

export interface UserWithFollowStatus {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  rating: number;
  totalNftsCollected: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
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
 * 팔로우하기
 */
export const follow = async (userId: number): Promise<FollowResponse> => {
  return withServiceError(
    apiClient.post<FollowResponse>(`/users/${userId}/follow`),
    '팔로우에 실패했습니다.'
  );
};

/**
 * 언팔로우하기
 */
export const unfollow = async (userId: number): Promise<FollowResponse> => {
  return withServiceError(
    apiClient.delete<FollowResponse>(`/users/${userId}/follow`),
    '언팔로우에 실패했습니다.'
  );
};

/**
 * 팔로워 목록 조회 (나를 팔로우하는 사람들)
 */
export const getFollowers = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  return withServiceError(
    apiClient.get<PageResponse<FollowUserResponse>>(
      appendQuery(`/users/${userId}/followers`, { page, size })
    ),
    '팔로워 목록을 불러오는데 실패했습니다.'
  );
};

/**
 * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
 */
export const getFollowing = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  return withServiceError(
    apiClient.get<PageResponse<FollowUserResponse>>(
      appendQuery(`/users/${userId}/following`, { page, size })
    ),
    '팔로잉 목록을 불러오는데 실패했습니다.'
  );
};

/**
 * 팔로우 통계 조회
 */
export const getFollowStats = async (userId: number): Promise<FollowStatsResponse> => {
  return withServiceError(
    apiClient.get<FollowStatsResponse>(`/users/${userId}/follow-stats`),
    '팔로우 통계를 불러오는데 실패했습니다.'
  );
};

/**
 * 팔로우 상태 확인
 */
export const getFollowStatus = async (userId: number): Promise<FollowStatusResponse> => {
  return withServiceError(
    apiClient.get<FollowStatusResponse>(`/users/${userId}/follow-status`),
    '팔로우 상태를 확인하는데 실패했습니다.'
  );
};

/**
 * 맞팔로우 목록 조회
 */
export const getMutualFollowers = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  return withServiceError(
    apiClient.get<PageResponse<FollowUserResponse>>(
      appendQuery(`/users/${userId}/mutual-followers`, { page, size })
    ),
    '맞팔로우 목록을 불러오는데 실패했습니다.'
  );
};

/**
 * 내 팔로워 목록 조회
 */
export const getMyFollowers = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  return withServiceError(
    apiClient.get<PageResponse<FollowUserResponse>>(
      appendQuery('/users/me/followers', { page, size })
    ),
    '팔로워 목록을 불러오는데 실패했습니다.'
  );
};

/**
 * 내 팔로잉 목록 조회
 */
export const getMyFollowing = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  return withServiceError(
    apiClient.get<PageResponse<FollowUserResponse>>(
      appendQuery('/users/me/following', { page, size })
    ),
    '팔로잉 목록을 불러오는데 실패했습니다.'
  );
};

/**
 * 내 팔로우 통계 조회
 */
export const getMyFollowStats = async (): Promise<FollowStatsResponse> => {
  return withServiceError(
    apiClient.get<FollowStatsResponse>('/users/me/follow-stats'),
    '팔로우 통계를 불러오는데 실패했습니다.'
  );
};

/**
 * 사용자들의 팔로우 상태 배치 조회
 */
export const getFollowStatusBatch = async (userIds: number[]): Promise<UserWithFollowStatus[]> => {
  return withServiceError(
    apiClient.post<UserWithFollowStatus[], { userIds: number[] }>('/users/follow-status/batch', {
      userIds,
    }),
    '팔로우 상태를 확인하는데 실패했습니다.'
  );
};

export const followService = {
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  getFollowStats,
  getFollowStatus,
  getMutualFollowers,
  getMyFollowers,
  getMyFollowing,
  getMyFollowStats,
  getFollowStatusBatch,
};
