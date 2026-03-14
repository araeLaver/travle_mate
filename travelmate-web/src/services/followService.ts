import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

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

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * 팔로우하기
 */
export const follow = async (userId: number): Promise<FollowResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '팔로우에 실패했습니다.');
  }

  return response.json();
};

/**
 * 언팔로우하기
 */
export const unfollow = async (userId: number): Promise<FollowResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '언팔로우에 실패했습니다.');
  }

  return response.json();
};

/**
 * 팔로워 목록 조회 (나를 팔로우하는 사람들)
 */
export const getFollowers = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/followers?page=${page}&size=${size}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('팔로워 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
 */
export const getFollowing = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/following?page=${page}&size=${size}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('팔로잉 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 팔로우 통계 조회
 */
export const getFollowStats = async (userId: number): Promise<FollowStatsResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/follow-stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('팔로우 통계를 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 팔로우 상태 확인
 */
export const getFollowStatus = async (userId: number): Promise<FollowStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/follow-status`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('팔로우 상태를 확인하는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 맞팔로우 목록 조회
 */
export const getMutualFollowers = async (
  userId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/mutual-followers?page=${page}&size=${size}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('맞팔로우 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 내 팔로워 목록 조회
 */
export const getMyFollowers = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  const response = await fetch(`${API_BASE_URL}/users/me/followers?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('팔로워 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 내 팔로잉 목록 조회
 */
export const getMyFollowing = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<FollowUserResponse>> => {
  const response = await fetch(`${API_BASE_URL}/users/me/following?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('팔로잉 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 내 팔로우 통계 조회
 */
export const getMyFollowStats = async (): Promise<FollowStatsResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/me/follow-stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('팔로우 통계를 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 사용자들의 팔로우 상태 배치 조회
 */
export const getFollowStatusBatch = async (userIds: number[]): Promise<UserWithFollowStatus[]> => {
  const response = await fetch(`${API_BASE_URL}/users/follow-status/batch`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userIds }),
  });

  if (!response.ok) {
    throw new Error('팔로우 상태를 확인하는데 실패했습니다.');
  }

  return response.json();
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
