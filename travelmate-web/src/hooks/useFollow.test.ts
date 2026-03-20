import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useFollowStats,
  useFollowStatus,
  useFollowers,
  useFollowing,
  useMutualFollowers,
  useMyFollowStats,
  useFollow,
  useUnfollow,
  useFollowToggle,
  followKeys,
} from './useFollow';
import { followService } from '../services/followService';

// Mock followService
jest.mock('../services/followService', () => ({
  followService: {
    getFollowStats: jest.fn(),
    getFollowStatus: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    getMutualFollowers: jest.fn(),
    getMyFollowStats: jest.fn(),
    follow: jest.fn(),
    unfollow: jest.fn(),
  },
}));

const mockFollowService = followService as jest.Mocked<typeof followService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useFollow hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('followKeys', () => {
    it('should generate correct query keys', () => {
      expect(followKeys.all).toEqual(['follow']);
      expect(followKeys.stats(1)).toEqual(['follow', 'stats', 1]);
      expect(followKeys.status(2)).toEqual(['follow', 'status', 2]);
      expect(followKeys.followers(3)).toEqual(['follow', 'followers', 3]);
      expect(followKeys.following(4)).toEqual(['follow', 'following', 4]);
      expect(followKeys.mutual(5)).toEqual(['follow', 'mutual', 5]);
      expect(followKeys.myStats()).toEqual(['follow', 'my-stats']);
      expect(followKeys.myFollowers()).toEqual(['follow', 'my-followers']);
      expect(followKeys.myFollowing()).toEqual(['follow', 'my-following']);
    });
  });

  describe('useFollowStats', () => {
    it('should fetch follow stats for a user', async () => {
      const mockStats = {
        userId: 1,
        followerCount: 100,
        followingCount: 50,
      };
      mockFollowService.getFollowStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useFollowStats(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(mockFollowService.getFollowStats).toHaveBeenCalledWith(1);
    });

    it('should not fetch when userId is 0', () => {
      renderHook(() => useFollowStats(0), {
        wrapper: createWrapper(),
      });

      expect(mockFollowService.getFollowStats).not.toHaveBeenCalled();
    });
  });

  describe('useFollowStatus', () => {
    it('should fetch follow status for a user', async () => {
      const mockStatus = {
        isFollowing: true,
        isFollowedBy: false,
        isMutual: false,
      };
      mockFollowService.getFollowStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useFollowStatus(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStatus);
    });

    it('should not fetch when disabled', () => {
      renderHook(() => useFollowStatus(1, false), {
        wrapper: createWrapper(),
      });

      expect(mockFollowService.getFollowStatus).not.toHaveBeenCalled();
    });
  });

  describe('useFollowers', () => {
    it('should fetch followers with pagination', async () => {
      const mockPage = {
        content: [{ id: 2, nickname: 'user2', profileImageUrl: null, isMutual: false }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };
      mockFollowService.getFollowers.mockResolvedValue(mockPage);

      const { result } = renderHook(() => useFollowers(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0]).toEqual(mockPage);
      expect(mockFollowService.getFollowers).toHaveBeenCalledWith(1, 0);
    });
  });

  describe('useFollowing', () => {
    it('should fetch following with pagination', async () => {
      const mockPage = {
        content: [{ id: 3, nickname: 'user3', profileImageUrl: null, isMutual: true }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };
      mockFollowService.getFollowing.mockResolvedValue(mockPage);

      const { result } = renderHook(() => useFollowing(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0]).toEqual(mockPage);
    });
  });

  describe('useMutualFollowers', () => {
    it('should fetch mutual followers', async () => {
      const mockPage = {
        content: [{ id: 4, nickname: 'mutual', profileImageUrl: null, isMutual: true }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };
      mockFollowService.getMutualFollowers.mockResolvedValue(mockPage);

      const { result } = renderHook(() => useMutualFollowers(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0]).toEqual(mockPage);
    });
  });

  describe('useMyFollowStats', () => {
    it('should fetch my follow stats', async () => {
      const mockStats = {
        userId: 1,
        followerCount: 200,
        followingCount: 100,
      };
      mockFollowService.getMyFollowStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useMyFollowStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe('useFollow mutation', () => {
    it('should follow a user successfully', async () => {
      const mockResponse = {
        success: true,
        isFollowing: true,
        isMutual: false,
        stats: { userId: 2, followerCount: 10, followingCount: 5 },
        message: '팔로우했습니다.',
      };
      mockFollowService.follow.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFollow(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(2);
      });

      expect(mockFollowService.follow).toHaveBeenCalledWith(2);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle follow error', async () => {
      mockFollowService.follow.mockRejectedValue(new Error('Follow failed'));

      const { result } = renderHook(() => useFollow(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(2);
        } catch (error) {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUnfollow mutation', () => {
    it('should unfollow a user successfully', async () => {
      const mockResponse = {
        success: true,
        isFollowing: false,
        isMutual: false,
        stats: { userId: 2, followerCount: 9, followingCount: 5 },
        message: '언팔로우했습니다.',
      };
      mockFollowService.unfollow.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUnfollow(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(2);
      });

      expect(mockFollowService.unfollow).toHaveBeenCalledWith(2);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useFollowToggle', () => {
    it('should follow when not currently following', async () => {
      const mockResponse = {
        success: true,
        isFollowing: true,
        isMutual: false,
        stats: { userId: 2, followerCount: 10, followingCount: 5 },
        message: '팔로우했습니다.',
      };
      mockFollowService.follow.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFollowToggle(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.toggle(2, false);
      });

      expect(mockFollowService.follow).toHaveBeenCalledWith(2);
      expect(mockFollowService.unfollow).not.toHaveBeenCalled();
    });

    it('should unfollow when currently following', async () => {
      const mockResponse = {
        success: true,
        isFollowing: false,
        isMutual: false,
        stats: { userId: 2, followerCount: 9, followingCount: 5 },
        message: '언팔로우했습니다.',
      };
      mockFollowService.unfollow.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFollowToggle(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.toggle(2, true);
      });

      expect(mockFollowService.unfollow).toHaveBeenCalledWith(2);
      expect(mockFollowService.follow).not.toHaveBeenCalled();
    });

    it('should track loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockFollowService.follow.mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useFollowToggle(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.toggle(2, false);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Cleanup: resolve the promise
      await act(async () => {
        resolvePromise!({ success: true, isFollowing: true, isMutual: false });
      });
    });
  });
});
