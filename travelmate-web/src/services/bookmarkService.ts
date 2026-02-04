import { apiClient } from './apiClient';

// ==================== Types ====================

export type TargetType = 'POST' | 'LOCATION' | 'NFT' | 'USER' | 'GROUP';

export interface TargetInfo {
  id: number;
  type: string;
  title: string;
  description?: string;
  imageUrl?: string;
  authorName?: string;
  authorId?: number;
}

export interface Bookmark {
  id: number;
  targetType: string;
  targetTypeDisplayName: string;
  targetId: number;
  target?: TargetInfo;
  folderName?: string;
  note?: string;
  createdAt: string;
}

export interface CreateBookmarkRequest {
  targetType: TargetType;
  targetId: number;
  folderName?: string;
  note?: string;
}

export interface UpdateBookmarkRequest {
  folderName?: string;
  note?: string;
}

export interface BookmarkListResponse {
  bookmarks: Bookmark[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  size: number;
}

export interface ToggleResponse {
  targetType: string;
  targetId: number;
  isBookmarked: boolean;
  folderName?: string;
}

export interface StatusResponse {
  targetType: string;
  targetId: number;
  isBookmarked: boolean;
  bookmarkId?: number;
  folderName?: string;
}

export interface BatchStatusRequest {
  targetType: TargetType;
  targetIds: number[];
}

export interface BatchStatusResponse {
  targetType: string;
  bookmarkStatus: Record<number, boolean>;
}

export interface StatsResponse {
  userId: number;
  totalBookmarks: number;
  countByType: Record<string, number>;
  folders: string[];
}

export interface FolderRenameRequest {
  oldFolderName: string;
  newFolderName: string;
}

// ==================== API Functions ====================

// Bookmark CRUD
export const createBookmark = async (data: CreateBookmarkRequest): Promise<Bookmark> => {
  return apiClient.post<Bookmark, CreateBookmarkRequest>('/bookmarks', data);
};

export const toggleBookmark = async (
  targetType: TargetType,
  targetId: number
): Promise<ToggleResponse> => {
  return apiClient.post<ToggleResponse>(
    `/bookmarks/toggle?targetType=${targetType}&targetId=${targetId}`
  );
};

export const updateBookmark = async (
  bookmarkId: number,
  data: UpdateBookmarkRequest
): Promise<Bookmark> => {
  return apiClient.put<Bookmark, UpdateBookmarkRequest>(`/bookmarks/${bookmarkId}`, data);
};

export const deleteBookmark = async (bookmarkId: number): Promise<void> => {
  await apiClient.delete(`/bookmarks/${bookmarkId}`);
};

// Bookmark Lists
export const getMyBookmarks = async (page = 0, size = 20): Promise<BookmarkListResponse> => {
  return apiClient.get<BookmarkListResponse>(`/bookmarks?page=${page}&size=${size}`);
};

export const getBookmarksByType = async (
  targetType: TargetType,
  page = 0,
  size = 20
): Promise<BookmarkListResponse> => {
  return apiClient.get<BookmarkListResponse>(
    `/bookmarks/type/${targetType}?page=${page}&size=${size}`
  );
};

export const getBookmarksByFolder = async (
  folderName: string,
  page = 0,
  size = 20
): Promise<BookmarkListResponse> => {
  return apiClient.get<BookmarkListResponse>(
    `/bookmarks/folder/${encodeURIComponent(folderName)}?page=${page}&size=${size}`
  );
};

// Bookmark Status
export const getBookmarkStatus = async (
  targetType: TargetType,
  targetId: number
): Promise<StatusResponse> => {
  return apiClient.get<StatusResponse>(
    `/bookmarks/status?targetType=${targetType}&targetId=${targetId}`
  );
};

export const getBatchBookmarkStatus = async (
  data: BatchStatusRequest
): Promise<BatchStatusResponse> => {
  return apiClient.post<BatchStatusResponse, BatchStatusRequest>('/bookmarks/status/batch', data);
};

// Stats & Folders
export const getBookmarkStats = async (): Promise<StatsResponse> => {
  return apiClient.get<StatsResponse>('/bookmarks/stats');
};

export const renameFolder = async (data: FolderRenameRequest): Promise<number> => {
  return apiClient.put<number, FolderRenameRequest>('/bookmarks/folders/rename', data);
};

// ==================== Helper Functions ====================

export const getTargetTypeLabel = (type: TargetType | string): string => {
  const labels: Record<string, string> = {
    POST: '게시글',
    LOCATION: '장소',
    NFT: 'NFT',
    USER: '사용자',
    GROUP: '그룹',
  };
  return labels[type] || type;
};

export const getTargetTypeIcon = (type: TargetType | string): string => {
  const icons: Record<string, string> = {
    POST: '📝',
    LOCATION: '📍',
    NFT: '🎨',
    USER: '👤',
    GROUP: '👥',
  };
  return icons[type] || '📌';
};

// Location Collection specific helpers
export const getLocationBookmarks = async (page = 0, size = 20): Promise<BookmarkListResponse> => {
  return getBookmarksByType('LOCATION', page, size);
};

export const toggleLocationBookmark = async (locationId: number): Promise<ToggleResponse> => {
  return toggleBookmark('LOCATION', locationId);
};

export const getLocationBookmarkStatus = async (locationId: number): Promise<StatusResponse> => {
  return getBookmarkStatus('LOCATION', locationId);
};

export const getBatchLocationBookmarkStatus = async (
  locationIds: number[]
): Promise<BatchStatusResponse> => {
  return getBatchBookmarkStatus({ targetType: 'LOCATION', targetIds: locationIds });
};
