import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// 검색 요청 타입
export interface SearchRequest {
  keyword?: string;
  travelStyle?: string;
  tags?: string[];
  destination?: string;
  minMembers?: number;
  maxMembers?: number;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// 검색 결과 타입
export interface SearchResult {
  results: GroupResult[];
  totalResults: number;
  page: number;
  size: number;
  took: number;
}

export interface GroupResult {
  id: number;
  name: string;
  description: string;
  destination: string;
  travelStyle: string;
  tags: string[];
  currentMembers: number;
  maxMembers: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  score: number;
}

// Query Keys
const searchKeys = {
  all: ['search'] as const,
  results: (request: SearchRequest) => [...searchKeys.all, 'results', request] as const,
  autocomplete: (prefix: string) => [...searchKeys.all, 'autocomplete', prefix] as const,
  popularTags: () => [...searchKeys.all, 'popularTags'] as const,
};

/**
 * 고급 검색
 */
export function useAdvancedSearch(request: SearchRequest) {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<SearchResult>('/search', request);
      return response;
    },
  });
}

/**
 * 간단한 키워드 검색
 */
export function useQuickSearch(keyword: string, page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: searchKeys.results({ keyword, page, size }),
    queryFn: async () => {
      const response = await apiClient.get<SearchResult>(
        `/search?q=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
      );
      return response;
    },
    enabled: keyword.length >= 2, // 최소 2글자 이상
    staleTime: 30 * 1000, // 30초
  });
}

/**
 * 자동완성
 */
export function useAutocomplete(prefix: string) {
  return useQuery({
    queryKey: searchKeys.autocomplete(prefix),
    queryFn: async () => {
      const response = await apiClient.get<string[]>(
        `/search/autocomplete?prefix=${encodeURIComponent(prefix)}`
      );
      return response;
    },
    enabled: prefix.length >= 2,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 인기 태그
 */
export function usePopularTags() {
  return useQuery({
    queryKey: searchKeys.popularTags(),
    queryFn: async () => {
      const response = await apiClient.get<string[]>('/search/popular-tags');
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10분
  });
}
