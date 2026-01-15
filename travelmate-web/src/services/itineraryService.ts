import api from './api';

// ==================== Types ====================

export type ItineraryVisibility = 'PRIVATE' | 'LINK_ONLY' | 'FOLLOWERS' | 'PUBLIC';
export type ItemType = 'ATTRACTION' | 'RESTAURANT' | 'CAFE' | 'ACCOMMODATION' | 'TRANSPORTATION' | 'ACTIVITY' | 'SHOPPING' | 'FREE_TIME' | 'NOTE' | 'OTHER';
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
  createdAt: string;
  items?: ItineraryItem[];
  collaborators?: Collaborator[];
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
  const response = await api.post<Itinerary>('/itineraries', data);
  return response.data;
};

export const getItinerary = async (id: number): Promise<Itinerary> => {
  const response = await api.get<Itinerary>(`/itineraries/${id}`);
  return response.data;
};

export const getItineraryByShareCode = async (shareCode: string): Promise<Itinerary> => {
  const response = await api.get<Itinerary>(`/itineraries/share/${shareCode}`);
  return response.data;
};

export const updateItinerary = async (id: number, data: UpdateItineraryRequest): Promise<Itinerary> => {
  const response = await api.put<Itinerary>(`/itineraries/${id}`, data);
  return response.data;
};

export const deleteItinerary = async (id: number): Promise<void> => {
  await api.delete(`/itineraries/${id}`);
};

export const copyItinerary = async (id: number): Promise<Itinerary> => {
  const response = await api.post<Itinerary>(`/itineraries/${id}/copy`);
  return response.data;
};

// Itinerary Lists
export const getMyItineraries = async (page = 0, size = 10): Promise<PageResponse<Itinerary>> => {
  const response = await api.get<PageResponse<Itinerary>>('/itineraries/my', {
    params: { page, size },
  });
  return response.data;
};

export const getCollaboratingItineraries = async (page = 0, size = 10): Promise<PageResponse<Itinerary>> => {
  const response = await api.get<PageResponse<Itinerary>>('/itineraries/collaborating', {
    params: { page, size },
  });
  return response.data;
};

export const getPublicItineraries = async (page = 0, size = 10): Promise<PageResponse<Itinerary>> => {
  const response = await api.get<PageResponse<Itinerary>>('/itineraries/public', {
    params: { page, size },
  });
  return response.data;
};

export const getPopularItineraries = async (page = 0, size = 10): Promise<PageResponse<Itinerary>> => {
  const response = await api.get<PageResponse<Itinerary>>('/itineraries/popular', {
    params: { page, size },
  });
  return response.data;
};

export const searchItineraries = async (keyword: string, page = 0, size = 10): Promise<PageResponse<Itinerary>> => {
  const response = await api.get<PageResponse<Itinerary>>('/itineraries/search', {
    params: { keyword, page, size },
  });
  return response.data;
};

// Items
export const addItem = async (itineraryId: number, data: CreateItemRequest): Promise<ItineraryItem> => {
  const response = await api.post<ItineraryItem>(`/itineraries/${itineraryId}/items`, data);
  return response.data;
};

export const updateItem = async (itemId: number, data: UpdateItemRequest): Promise<ItineraryItem> => {
  const response = await api.put<ItineraryItem>(`/itineraries/items/${itemId}`, data);
  return response.data;
};

export const deleteItem = async (itemId: number): Promise<void> => {
  await api.delete(`/itineraries/items/${itemId}`);
};

export const reorderItems = async (itineraryId: number, items: ReorderItemRequest[]): Promise<void> => {
  await api.put(`/itineraries/${itineraryId}/items/reorder`, items);
};

// Collaborators
export const inviteCollaborator = async (itineraryId: number, data: InviteCollaboratorRequest): Promise<void> => {
  await api.post(`/itineraries/${itineraryId}/collaborators`, data);
};

export const getCollaborators = async (itineraryId: number): Promise<Collaborator[]> => {
  const response = await api.get<Collaborator[]>(`/itineraries/${itineraryId}/collaborators`);
  return response.data;
};

export const acceptInvite = async (collaboratorId: number): Promise<void> => {
  await api.post(`/itineraries/invites/${collaboratorId}/accept`);
};

export const declineInvite = async (collaboratorId: number): Promise<void> => {
  await api.post(`/itineraries/invites/${collaboratorId}/decline`);
};

export const getPendingInvites = async (): Promise<Collaborator[]> => {
  const response = await api.get<Collaborator[]>('/itineraries/invites/pending');
  return response.data;
};

export const removeCollaborator = async (itineraryId: number, collaboratorUserId: number): Promise<void> => {
  await api.delete(`/itineraries/${itineraryId}/collaborators/${collaboratorUserId}`);
};

export const updateCollaboratorRole = async (
  itineraryId: number,
  collaboratorUserId: number,
  role: CollaboratorRole
): Promise<void> => {
  await api.put(`/itineraries/${itineraryId}/collaborators/${collaboratorUserId}/role`, null, {
    params: { role },
  });
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

  items.forEach((item) => {
    const dayItems = byDay.get(item.dayNumber) || [];
    dayItems.push(item);
    byDay.set(item.dayNumber, dayItems);
  });

  // Sort items within each day
  byDay.forEach((dayItems) => {
    dayItems.sort((a, b) => a.orderIndex - b.orderIndex);
  });

  return byDay;
};

export const calculateTotalCost = (items: ItineraryItem[], useActual = false): number => {
  return items.reduce((total, item) => {
    const cost = useActual
      ? item.actualCost ?? item.estimatedCost ?? 0
      : item.estimatedCost ?? 0;
    return total + cost;
  }, 0);
};
