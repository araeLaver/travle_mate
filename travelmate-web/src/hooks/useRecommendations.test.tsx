import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGroupRecommendations, useTravelMateRecommendations } from './useRecommendations';
import * as apiClient from '../services/apiClient';

jest.mock('../services/apiClient');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGroupRecommendations', () => {
    test('그룹 추천 조회 성공', async () => {
      const mockData = [
        {
          groupId: 1,
          groupName: '제주도 여행',
          destination: '제주도',
          recommendationScore: 85,
          reasons: ['여행 스타일이 일치합니다'],
        },
      ];

      (apiClient.apiClient.get as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useGroupRecommendations(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(apiClient.apiClient.get).toHaveBeenCalledWith('/recommendations/groups?limit=10');
    });

    test('그룹 추천 조회 실패', async () => {
      (apiClient.apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useGroupRecommendations(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useTravelMateRecommendations', () => {
    test('동행자 추천 조회 성공', async () => {
      const mockData = [
        {
          userId: 2,
          nickname: '여행자123',
          recommendationScore: 75,
          commonInterests: ['음식', '문화'],
        },
      ];

      (apiClient.apiClient.get as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useTravelMateRecommendations(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(apiClient.apiClient.get).toHaveBeenCalledWith('/recommendations/travel-mates?limit=10');
    });
  });
});
