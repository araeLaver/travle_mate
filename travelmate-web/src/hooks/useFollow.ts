import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  followService,
  FollowStatsResponse,
  FollowStatusResponse,
  FollowUserResponse,
  FollowResponse,
  PageResponse,
} from '../services/followService';

// Query Keys
export const followKeys = {
  all: ['follow'] as const,
  stats: (userId: number) => [...followKeys.all, 'stats', userId] as const,
  status: (userId: number) => [...followKeys.all, 'status', userId] as const,
  followers: (userId: number) => [...followKeys.all, 'followers', userId] as const,
  following: (userId: number) => [...followKeys.all, 'following', userId] as const,
  mutual: (userId: number) => [...followKeys.all, 'mutual', userId] as const,
  myStats: () => [...followKeys.all, 'my-stats'] as const,
  myFollowers: () => [...followKeys.all, 'my-followers'] as const,
  myFollowing: () => [...followKeys.all, 'my-following'] as const,
};

/**
 * 팔로우 통계 조회 훅
 */
export function useFollowStats(userId: number) {
  return useQuery<FollowStatsResponse>({
    queryKey: followKeys.stats(userId),
    queryFn: () => followService.getFollowStats(userId),
    enabled: !!userId,
  });
}

/**
 * 팔로우 상태 조회 훅
 */
export function useFollowStatus(userId: number, enabled: boolean = true) {
  return useQuery<FollowStatusResponse>({
    queryKey: followKeys.status(userId),
    queryFn: () => followService.getFollowStatus(userId),
    enabled: !!userId && enabled,
  });
}

/**
 * 팔로워 목록 조회 훅 (무한 스크롤)
 */
export function useFollowers(userId: number) {
  return useInfiniteQuery<PageResponse<FollowUserResponse>>({
    queryKey: followKeys.followers(userId),
    queryFn: ({ pageParam = 0 }) => followService.getFollowers(userId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.number + 1;
    },
    enabled: !!userId,
  });
}

/**
 * 팔로잉 목록 조회 훅 (무한 스크롤)
 */
export function useFollowing(userId: number) {
  return useInfiniteQuery<PageResponse<FollowUserResponse>>({
    queryKey: followKeys.following(userId),
    queryFn: ({ pageParam = 0 }) => followService.getFollowing(userId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.number + 1;
    },
    enabled: !!userId,
  });
}

/**
 * 맞팔로우 목록 조회 훅
 */
export function useMutualFollowers(userId: number) {
  return useInfiniteQuery<PageResponse<FollowUserResponse>>({
    queryKey: followKeys.mutual(userId),
    queryFn: ({ pageParam = 0 }) => followService.getMutualFollowers(userId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.number + 1;
    },
    enabled: !!userId,
  });
}

/**
 * 내 팔로우 통계 조회 훅
 */
export function useMyFollowStats() {
  return useQuery<FollowStatsResponse>({
    queryKey: followKeys.myStats(),
    queryFn: () => followService.getMyFollowStats(),
  });
}

/**
 * 팔로우 mutation 훅
 */
export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation<FollowResponse, Error, number>({
    mutationFn: (userId: number) => followService.follow(userId),
    onSuccess: (data, userId) => {
      // 관련 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: followKeys.stats(userId) });
      queryClient.invalidateQueries({ queryKey: followKeys.status(userId) });
      queryClient.invalidateQueries({ queryKey: followKeys.myStats() });
      queryClient.invalidateQueries({ queryKey: followKeys.myFollowing() });

      // 팔로우 상태 즉시 업데이트
      queryClient.setQueryData<FollowStatusResponse>(
        followKeys.status(userId),
        (old) => old ? {
          ...old,
          isFollowing: true,
          isMutual: data.isMutual,
        } : undefined
      );
    },
  });
}

/**
 * 언팔로우 mutation 훅
 */
export function useUnfollow() {
  const queryClient = useQueryClient();

  return useMutation<FollowResponse, Error, number>({
    mutationFn: (userId: number) => followService.unfollow(userId),
    onSuccess: (_, userId) => {
      // 관련 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: followKeys.stats(userId) });
      queryClient.invalidateQueries({ queryKey: followKeys.status(userId) });
      queryClient.invalidateQueries({ queryKey: followKeys.myStats() });
      queryClient.invalidateQueries({ queryKey: followKeys.myFollowing() });

      // 팔로우 상태 즉시 업데이트
      queryClient.setQueryData<FollowStatusResponse>(
        followKeys.status(userId),
        (old) => old ? {
          ...old,
          isFollowing: false,
          isMutual: false,
        } : undefined
      );
    },
  });
}

/**
 * 팔로우 토글 훅 (팔로우/언팔로우 통합)
 */
export function useFollowToggle() {
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const toggle = async (userId: number, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      return unfollowMutation.mutateAsync(userId);
    } else {
      return followMutation.mutateAsync(userId);
    }
  };

  return {
    toggle,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
    error: followMutation.error || unfollowMutation.error,
  };
}
