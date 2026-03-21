import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  Bookmark,
  BookmarkListResponse,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
  ToggleResponse,
  StatusResponse,
  StatsResponse,
  BatchStatusResponse,
  TargetType,
  createBookmark,
  toggleBookmark,
  updateBookmark,
  deleteBookmark,
  getMyBookmarks,
  getBookmarksByType,
  getBookmarksByFolder,
  getBookmarkStatus,
  getBatchBookmarkStatus,
  getBookmarkStats,
  renameFolder,
} from '../services/bookmarkService';

// Query Keys
export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  list: () => [...bookmarkKeys.all, 'list'] as const,
  listByType: (type: TargetType) => [...bookmarkKeys.all, 'list', 'type', type] as const,
  listByFolder: (folder: string) => [...bookmarkKeys.all, 'list', 'folder', folder] as const,
  status: (type: TargetType, targetId: number) =>
    [...bookmarkKeys.all, 'status', type, targetId] as const,
  batchStatus: (type: TargetType, targetIds: number[]) =>
    [...bookmarkKeys.all, 'batchStatus', type, targetIds.join(',')] as const,
  stats: () => [...bookmarkKeys.all, 'stats'] as const,
};

/**
 * 내 북마크 목록 조회 (무한 스크롤)
 */
export function useMyBookmarks() {
  return useInfiniteQuery<BookmarkListResponse>({
    queryKey: bookmarkKeys.list(),
    queryFn: ({ pageParam = 0 }) => getMyBookmarks(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.page + 1;
    },
  });
}

/**
 * 타입별 북마크 목록 조회 (무한 스크롤)
 */
export function useBookmarksByType(targetType: TargetType) {
  return useInfiniteQuery<BookmarkListResponse>({
    queryKey: bookmarkKeys.listByType(targetType),
    queryFn: ({ pageParam = 0 }) => getBookmarksByType(targetType, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.page + 1;
    },
  });
}

/**
 * 폴더별 북마크 목록 조회 (무한 스크롤)
 */
export function useBookmarksByFolder(folderName: string) {
  return useInfiniteQuery<BookmarkListResponse>({
    queryKey: bookmarkKeys.listByFolder(folderName),
    queryFn: ({ pageParam = 0 }) => getBookmarksByFolder(folderName, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.page + 1;
    },
    enabled: !!folderName,
  });
}

/**
 * 북마크 상태 조회 훅
 */
export function useBookmarkStatus(targetType: TargetType, targetId: number, enabled = true) {
  return useQuery<StatusResponse>({
    queryKey: bookmarkKeys.status(targetType, targetId),
    queryFn: () => getBookmarkStatus(targetType, targetId),
    enabled: !!targetId && enabled,
  });
}

/**
 * 북마크 상태 일괄 조회 훅
 */
export function useBatchBookmarkStatus(targetType: TargetType, targetIds: number[]) {
  return useQuery<BatchStatusResponse>({
    queryKey: bookmarkKeys.batchStatus(targetType, targetIds),
    queryFn: () => getBatchBookmarkStatus({ targetType, targetIds }),
    enabled: targetIds.length > 0,
  });
}

/**
 * 북마크 통계 조회 훅
 */
export function useBookmarkStats() {
  return useQuery<StatsResponse>({
    queryKey: bookmarkKeys.stats(),
    queryFn: getBookmarkStats,
  });
}

/**
 * 북마크 생성 mutation 훅
 */
export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation<Bookmark, Error, CreateBookmarkRequest>({
    mutationFn: createBookmark,
    onSuccess: data => {
      // 관련 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.list() });
      queryClient.invalidateQueries({
        queryKey: bookmarkKeys.listByType(data.targetType as TargetType),
      });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.stats() });

      // 북마크 상태 즉시 업데이트
      queryClient.setQueryData<StatusResponse>(
        bookmarkKeys.status(data.targetType as TargetType, data.targetId),
        {
          targetType: data.targetType,
          targetId: data.targetId,
          isBookmarked: true,
          bookmarkId: data.id,
          folderName: data.folderName,
        }
      );
    },
  });
}

/**
 * 북마크 토글 mutation 훅
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation<ToggleResponse, Error, { targetType: TargetType; targetId: number }>({
    mutationFn: ({ targetType, targetId }) => toggleBookmark(targetType, targetId),
    onSuccess: (data, { targetType, targetId }) => {
      // 관련 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.list() });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.listByType(targetType) });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.stats() });

      // 북마크 상태 즉시 업데이트
      queryClient.setQueryData<StatusResponse>(bookmarkKeys.status(targetType, targetId), old =>
        old
          ? {
              ...old,
              isBookmarked: data.isBookmarked,
              folderName: data.folderName,
            }
          : {
              targetType: data.targetType,
              targetId: data.targetId,
              isBookmarked: data.isBookmarked,
              folderName: data.folderName,
            }
      );
    },
  });
}

/**
 * 북마크 수정 mutation 훅
 */
export function useUpdateBookmark() {
  const queryClient = useQueryClient();

  return useMutation<Bookmark, Error, { bookmarkId: number; data: UpdateBookmarkRequest }>({
    mutationFn: ({ bookmarkId, data }) => updateBookmark(bookmarkId, data),
    onSuccess: () => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.list() });
    },
  });
}

/**
 * 북마크 삭제 mutation 훅
 */
export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { bookmarkId: number; targetType: TargetType; targetId: number }>(
    {
      mutationFn: ({ bookmarkId }) => deleteBookmark(bookmarkId),
      onSuccess: (_, { targetType, targetId }) => {
        // 관련 쿼리 캐시 무효화
        queryClient.invalidateQueries({ queryKey: bookmarkKeys.list() });
        queryClient.invalidateQueries({ queryKey: bookmarkKeys.listByType(targetType) });
        queryClient.invalidateQueries({ queryKey: bookmarkKeys.stats() });

        // 북마크 상태 즉시 업데이트
        queryClient.setQueryData<StatusResponse>(bookmarkKeys.status(targetType, targetId), old =>
          old
            ? {
                ...old,
                isBookmarked: false,
                bookmarkId: undefined,
              }
            : undefined
        );
      },
    }
  );
}

/**
 * 폴더명 변경 mutation 훅
 */
export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation<number, Error, { oldFolderName: string; newFolderName: string }>({
    mutationFn: ({ oldFolderName, newFolderName }) =>
      renameFolder({ oldFolderName, newFolderName }),
    onSuccess: (_, { oldFolderName }) => {
      // 관련 쿼리 캐시 무효화
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.list() });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.listByFolder(oldFolderName) });
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.stats() });
    },
  });
}

// ==================== Location-specific hooks ====================

/**
 * 장소 북마크 목록 조회 (무한 스크롤)
 */
export function useLocationBookmarks() {
  return useBookmarksByType('LOCATION');
}

/**
 * 장소 북마크 상태 조회
 */
export function useLocationBookmarkStatus(locationId: number, enabled = true) {
  return useBookmarkStatus('LOCATION', locationId, enabled);
}

/**
 * 장소 북마크 토글
 */
export function useToggleLocationBookmark() {
  const toggleMutation = useToggleBookmark();

  return {
    ...toggleMutation,
    mutate: (locationId: number) =>
      toggleMutation.mutate({ targetType: 'LOCATION', targetId: locationId }),
    mutateAsync: (locationId: number) =>
      toggleMutation.mutateAsync({ targetType: 'LOCATION', targetId: locationId }),
  };
}
