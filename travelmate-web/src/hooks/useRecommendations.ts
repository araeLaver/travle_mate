import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// 그룹 추천 타입
export interface GroupRecommendation {
  groupId: number;
  groupName: string;
  destination: string;
  description: string;
  currentMembers: number;
  maxMembers: number;
  travelStyle: string;
  tags: string[];
  recommendationScore: number;
  reasons: string[];
  scoreBreakdown: ScoreBreakdown;
}

// 사용자 추천 타입
export interface UserRecommendation {
  userId: number;
  nickname: string;
  profileImage: string;
  travelStyles: string[];
  interests: string[];
  ageGroup: string;
  recommendationScore: number;
  reasons: string[];
  commonInterests: string[];
  similarityScore: number;
}

// 점수 상세 정보
export interface ScoreBreakdown {
  travelStyleScore: number;
  interestScore: number;
  regionScore: number;
  groupSizeScore: number;
  budgetScore: number;
  popularityScore: number;
  recentActivityScore: number;
  collaborativeScore: number;
}

// Query Keys
const recommendationKeys = {
  all: ['recommendations'] as const,
  groups: (limit: number) => [...recommendationKeys.all, 'groups', limit] as const,
  users: (limit: number) => [...recommendationKeys.all, 'users', limit] as const,
};

/**
 * 그룹 추천 조회
 */
export function useGroupRecommendations(limit: number = 10) {
  return useQuery({
    queryKey: recommendationKeys.groups(limit),
    queryFn: async () => {
      const response = await apiClient.get<GroupRecommendation[]>(
        `/recommendations/groups?limit=${limit}`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}

/**
 * 동행자 추천 조회
 */
export function useTravelMateRecommendations(limit: number = 10) {
  return useQuery({
    queryKey: recommendationKeys.users(limit),
    queryFn: async () => {
      const response = await apiClient.get<UserRecommendation[]>(
        `/recommendations/travel-mates?limit=${limit}`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}

/**
 * 추천 점수를 색상으로 변환
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#28a745'; // 초록색 (매우 높음)
  if (score >= 60) return '#17a2b8'; // 청록색 (높음)
  if (score >= 40) return '#ffc107'; // 노란색 (중간)
  return '#dc3545'; // 빨간색 (낮음)
}

/**
 * 추천 점수를 레이블로 변환
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return '매우 추천';
  if (score >= 60) return '추천';
  if (score >= 40) return '관심있을만함';
  return '기타';
}
