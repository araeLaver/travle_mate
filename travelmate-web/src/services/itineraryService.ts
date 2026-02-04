import { apiClient } from './apiClient';

// ==================== Types ====================

export type ItineraryVisibility = 'PRIVATE' | 'LINK_ONLY' | 'FOLLOWERS' | 'PUBLIC';
export type ItemType =
  | 'ATTRACTION'
  | 'RESTAURANT'
  | 'CAFE'
  | 'ACCOMMODATION'
  | 'TRANSPORTATION'
  | 'ACTIVITY'
  | 'SHOPPING'
  | 'FREE_TIME'
  | 'NOTE'
  | 'OTHER';
export type BookingStatus = 'NOT_NEEDED' | 'PENDING' | 'BOOKED' | 'CANCELLED';
export type CollaboratorRole = 'VIEWER' | 'EDITOR' | 'ADMIN';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface OwnerInfo {
  id: number;
  username: string;
  profileImage?: string;
}

export interface ItineraryItem {
  id: number;
  dayNumber: number;
  orderIndex: number;
  type: ItemType;
  title: string;
  description?: string;
  notes?: string;
  placeName?: string;
  placeAddress?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  estimatedCost?: number;
  actualCost?: number;
  currency?: string;
  bookingReference?: string;
  bookingUrl?: string;
  bookingStatus?: BookingStatus;
  imageUrl?: string;
  locationCollectionId?: number;
}

export interface Collaborator {
  id: number;
  userId: number;
  username: string;
  profileImage?: string;
  role: CollaboratorRole;
  status: InviteStatus;
  invitedAt: string;
  acceptedAt?: string;
  itineraryId: number;
  itineraryTitle: string;
}

export interface Itinerary {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number;
  coverImage?: string;
  visibility: ItineraryVisibility;
  shareCode?: string;
  viewCount: number;
  likeCount: number;
  copyCount: number;
  itemCount: number;
  owner: OwnerInfo;
  isOwner: boolean;
  isLiked: boolean;
  createdAt: string;
  items?: ItineraryItem[];
  collaborators?: Collaborator[];
}

export interface LikeResponse {
  liked: boolean;
}

export interface CommentAuthorInfo {
  id: number;
  nickname: string;
  profileImage?: string;
}

export interface Comment {
  id: number;
  content: string;
  author: CommentAuthorInfo;
  parentId?: number;
  replies?: Comment[];
  replyCount: number;
  isDeleted: boolean;
  isAuthor: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CreateItineraryRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  visibility?: ItineraryVisibility;
}

export interface UpdateItineraryRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  visibility?: ItineraryVisibility;
}

export interface CreateItemRequest {
  dayNumber: number;
  orderIndex?: number;
  type: ItemType;
  title: string;
  description?: string;
  notes?: string;
  placeName?: string;
  placeAddress?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  estimatedCost?: number;
  currency?: string;
  bookingReference?: string;
  bookingUrl?: string;
  bookingStatus?: BookingStatus;
  imageUrl?: string;
  locationCollectionId?: number;
}

export interface UpdateItemRequest {
  dayNumber?: number;
  orderIndex?: number;
  type?: ItemType;
  title?: string;
  description?: string;
  notes?: string;
  placeName?: string;
  placeAddress?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  estimatedCost?: number;
  actualCost?: number;
  currency?: string;
  bookingReference?: string;
  bookingUrl?: string;
  bookingStatus?: BookingStatus;
  imageUrl?: string;
}

export interface ReorderItemRequest {
  itemId: number;
  dayNumber: number;
  orderIndex: number;
}

export interface InviteCollaboratorRequest {
  userId: number;
  role?: CollaboratorRole;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ==================== API Functions ====================

// Itinerary CRUD
export const createItinerary = async (data: CreateItineraryRequest): Promise<Itinerary> => {
  return apiClient.post<Itinerary, CreateItineraryRequest>('/itineraries', data);
};

export const getItinerary = async (id: number): Promise<Itinerary> => {
  return apiClient.get<Itinerary>(`/itineraries/${id}`);
};

export const getItineraryByShareCode = async (shareCode: string): Promise<Itinerary> => {
  return apiClient.get<Itinerary>(`/itineraries/share/${shareCode}`);
};

export const updateItinerary = async (
  id: number,
  data: UpdateItineraryRequest
): Promise<Itinerary> => {
  return apiClient.put<Itinerary, UpdateItineraryRequest>(`/itineraries/${id}`, data);
};

export const deleteItinerary = async (id: number): Promise<void> => {
  await apiClient.delete(`/itineraries/${id}`);
};

export const copyItinerary = async (id: number): Promise<Itinerary> => {
  return apiClient.post<Itinerary>(`/itineraries/${id}/copy`);
};

// Itinerary Lists
export const getMyItineraries = async (page = 0, size = 10): Promise<PageResponse<Itinerary>> => {
  return apiClient.get<PageResponse<Itinerary>>(`/itineraries/my?page=${page}&size=${size}`);
};

export const getCollaboratingItineraries = async (
  page = 0,
  size = 10
): Promise<PageResponse<Itinerary>> => {
  return apiClient.get<PageResponse<Itinerary>>(
    `/itineraries/collaborating?page=${page}&size=${size}`
  );
};

export const getPublicItineraries = async (
  page = 0,
  size = 10
): Promise<PageResponse<Itinerary>> => {
  return apiClient.get<PageResponse<Itinerary>>(`/itineraries/public?page=${page}&size=${size}`);
};

export const getPopularItineraries = async (
  page = 0,
  size = 10
): Promise<PageResponse<Itinerary>> => {
  return apiClient.get<PageResponse<Itinerary>>(`/itineraries/popular?page=${page}&size=${size}`);
};

export const searchItineraries = async (
  keyword: string,
  page = 0,
  size = 10
): Promise<PageResponse<Itinerary>> => {
  return apiClient.get<PageResponse<Itinerary>>(
    `/itineraries/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
  );
};

// Items
export const addItem = async (
  itineraryId: number,
  data: CreateItemRequest
): Promise<ItineraryItem> => {
  return apiClient.post<ItineraryItem, CreateItemRequest>(
    `/itineraries/${itineraryId}/items`,
    data
  );
};

export const updateItem = async (
  itemId: number,
  data: UpdateItemRequest
): Promise<ItineraryItem> => {
  return apiClient.put<ItineraryItem, UpdateItemRequest>(`/itineraries/items/${itemId}`, data);
};

export const deleteItem = async (itemId: number): Promise<void> => {
  await apiClient.delete(`/itineraries/items/${itemId}`);
};

export const reorderItems = async (
  itineraryId: number,
  items: ReorderItemRequest[]
): Promise<void> => {
  await apiClient.put(`/itineraries/${itineraryId}/items/reorder`, items);
};

// Collaborators
export const inviteCollaborator = async (
  itineraryId: number,
  data: InviteCollaboratorRequest
): Promise<void> => {
  await apiClient.post(`/itineraries/${itineraryId}/collaborators`, data);
};

export const getCollaborators = async (itineraryId: number): Promise<Collaborator[]> => {
  return apiClient.get<Collaborator[]>(`/itineraries/${itineraryId}/collaborators`);
};

export const acceptInvite = async (collaboratorId: number): Promise<void> => {
  await apiClient.post(`/itineraries/invites/${collaboratorId}/accept`);
};

export const declineInvite = async (collaboratorId: number): Promise<void> => {
  await apiClient.post(`/itineraries/invites/${collaboratorId}/decline`);
};

export const getPendingInvites = async (): Promise<Collaborator[]> => {
  return apiClient.get<Collaborator[]>('/itineraries/invites/pending');
};

export const removeCollaborator = async (
  itineraryId: number,
  collaboratorUserId: number
): Promise<void> => {
  await apiClient.delete(`/itineraries/${itineraryId}/collaborators/${collaboratorUserId}`);
};

export const updateCollaboratorRole = async (
  itineraryId: number,
  collaboratorUserId: number,
  role: CollaboratorRole
): Promise<void> => {
  await apiClient.put(
    `/itineraries/${itineraryId}/collaborators/${collaboratorUserId}/role?role=${role}`
  );
};

// Likes
export const toggleLike = async (itineraryId: number): Promise<LikeResponse> => {
  return apiClient.post<LikeResponse>(`/itineraries/${itineraryId}/like`);
};

export const isLiked = async (itineraryId: number): Promise<LikeResponse> => {
  return apiClient.get<LikeResponse>(`/itineraries/${itineraryId}/like`);
};

export const getLikedItineraries = async (
  page = 0,
  size = 10
): Promise<PageResponse<Itinerary>> => {
  return apiClient.get<PageResponse<Itinerary>>(`/itineraries/liked?page=${page}&size=${size}`);
};

// Comments
export const addComment = async (
  itineraryId: number,
  data: CreateCommentRequest
): Promise<Comment> => {
  return apiClient.post<Comment, CreateCommentRequest>(
    `/itineraries/${itineraryId}/comments`,
    data
  );
};

export const getComments = async (
  itineraryId: number,
  page = 0,
  size = 20
): Promise<PageResponse<Comment>> => {
  return apiClient.get<PageResponse<Comment>>(
    `/itineraries/${itineraryId}/comments?page=${page}&size=${size}`
  );
};

export const updateComment = async (
  commentId: number,
  data: UpdateCommentRequest
): Promise<Comment> => {
  return apiClient.put<Comment, UpdateCommentRequest>(`/itineraries/comments/${commentId}`, data);
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await apiClient.delete(`/itineraries/comments/${commentId}`);
};

export const getCommentCount = async (itineraryId: number): Promise<number> => {
  return apiClient.get<number>(`/itineraries/${itineraryId}/comments/count`);
};

// ==================== Helper Functions ====================

export const getItemTypeLabel = (type: ItemType): string => {
  const labels: Record<ItemType, string> = {
    ATTRACTION: '관광지',
    RESTAURANT: '식당',
    CAFE: '카페',
    ACCOMMODATION: '숙소',
    TRANSPORTATION: '교통',
    ACTIVITY: '액티비티',
    SHOPPING: '쇼핑',
    FREE_TIME: '자유 시간',
    NOTE: '메모',
    OTHER: '기타',
  };
  return labels[type] || type;
};

export const getItemTypeIcon = (type: ItemType): string => {
  const icons: Record<ItemType, string> = {
    ATTRACTION: '🏛️',
    RESTAURANT: '🍽️',
    CAFE: '☕',
    ACCOMMODATION: '🏨',
    TRANSPORTATION: '🚗',
    ACTIVITY: '🎯',
    SHOPPING: '🛍️',
    FREE_TIME: '⏰',
    NOTE: '📝',
    OTHER: '📌',
  };
  return icons[type] || '📌';
};

export const getVisibilityLabel = (visibility: ItineraryVisibility): string => {
  const labels: Record<ItineraryVisibility, string> = {
    PRIVATE: '나만 보기',
    LINK_ONLY: '링크로 공유',
    FOLLOWERS: '팔로워에게 공개',
    PUBLIC: '전체 공개',
  };
  return labels[visibility] || visibility;
};

export const getBookingStatusLabel = (status: BookingStatus): string => {
  const labels: Record<BookingStatus, string> = {
    NOT_NEEDED: '예약 불필요',
    PENDING: '예약 예정',
    BOOKED: '예약 완료',
    CANCELLED: '예약 취소',
  };
  return labels[status] || status;
};

export const getCollaboratorRoleLabel = (role: CollaboratorRole): string => {
  const labels: Record<CollaboratorRole, string> = {
    VIEWER: '뷰어',
    EDITOR: '편집자',
    ADMIN: '관리자',
  };
  return labels[role] || role;
};

export const formatDuration = (days: number): string => {
  if (days === 1) return '당일치기';
  return `${days - 1}박 ${days}일`;
};

export const generateShareUrl = (shareCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/itineraries/share/${shareCode}`;
};

export const getItemsByDay = (items: ItineraryItem[]): Map<number, ItineraryItem[]> => {
  const byDay = new Map<number, ItineraryItem[]>();

  items.forEach(item => {
    const dayItems = byDay.get(item.dayNumber) || [];
    dayItems.push(item);
    byDay.set(item.dayNumber, dayItems);
  });

  // Sort items within each day
  byDay.forEach(dayItems => {
    dayItems.sort((a, b) => a.orderIndex - b.orderIndex);
  });

  return byDay;
};

export const calculateTotalCost = (items: ItineraryItem[], useActual = false): number => {
  return items.reduce((total, item) => {
    const cost = useActual
      ? (item.actualCost ?? item.estimatedCost ?? 0)
      : (item.estimatedCost ?? 0);
    return total + cost;
  }, 0);
};
