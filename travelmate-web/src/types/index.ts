// ===== API 관련 타입 =====

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface FileUploadResponse {
  url: string;
  imageUrl?: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

// ===== 알림 관련 타입 =====

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: number;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationResponse extends PaginatedResponse<Notification> {}

// ===== 그룹 필터 타입 =====

export interface GroupFilters {
  destination?: string;
  startDate?: string;
  endDate?: string;
  minBudget?: number;
  maxBudget?: number;
  travelStyle?: string;
  status?: string;
  sort?: string;
}

// ===== 채팅 관련 API 응답 타입 =====

export interface ChatRoomApiResponse {
  id: number | string;
  roomName?: string;
  roomType: 'PRIVATE' | 'GROUP' | 'TRAVEL_GROUP';
  participants?: ChatParticipantApiResponse[];
  lastMessage?: ChatMessageApiResponse;
  unreadCount?: number;
  createdAt: string;
  isActive?: boolean;
}

export interface ChatParticipantApiResponse {
  id: number | string;
  userId?: number | string;
  user?: {
    id: number | string;
    nickname?: string;
    profileImageUrl?: string;
  };
  userName?: string;
  profileImage?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface ChatMessageApiResponse {
  id: number | string;
  chatRoomId?: number | string;
  senderId?: number | string;
  sender?: {
    id: number | string;
    nickname?: string;
  };
  senderName?: string;
  content?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM';
  imageUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationName?: string;
  isDeleted?: boolean;
  sentAt?: string;
  createdAt?: string;
  isRead?: boolean;
}

// ===== 위치 서비스 관련 타입 =====

export interface LocationApiResponse {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface NearbyUserApiResponse {
  id: number | string;
  nickname: string;
  profileImageUrl?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

// ===== 프로필 관련 타입 =====

export interface UserProfileApiResponse {
  id: number | string;
  email: string;
  nickname: string;
  name?: string;
  profileImageUrl?: string;
  profileImage?: string;
  coverImageUrl?: string;
  coverImage?: string;
  bio?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  age?: number;
  travelStyle?: string;
  interests?: string[];
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  tripCount?: number;
  location?: {
    city?: string;
    country?: string;
  };
  stats?: {
    totalTrips?: number;
    totalCountries?: number;
    totalCities?: number;
    favoriteDestination?: string;
    totalGroupsJoined?: number;
    totalGroupsCreated?: number;
  };
  createdAt?: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
}

export interface TripApiResponse {
  id: number | string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  photos?: string[];
}

export interface ReviewApiResponse {
  id: number | string;
  reviewerId: number | string;
  reviewerName: string;
  reviewerProfileImage?: string;
  rating: number;
  content: string;
  createdAt: string;
}

// ===== 소셜 로그인 관련 타입 =====

export interface GoogleUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export interface KakaoUser {
  id: number;
  connected_at: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
    age_range_needs_agreement?: boolean;
    age_range?: string;
    gender_needs_agreement?: boolean;
    gender?: string;
  };
}

export interface NaverUser {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email?: string;
    nickname?: string;
    profile_image?: string;
    age?: string;
    gender?: string;
    name?: string;
    birthday?: string;
    birthyear?: string;
    mobile?: string;
  };
}

export interface SocialLoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
    provider: string;
  };
  error?: string;
}

// ===== WebSocket 관련 타입 =====

export interface WebSocketError {
  message: string;
  code?: string | number;
  timestamp?: Date;
}

export type WebSocketErrorCallback = (error: WebSocketError) => void;

// ===== 그룹 관련 API 응답 타입 =====

export interface GroupMemberApiResponse {
  id?: number | string;
  userId?: number | string;
  nickname?: string;
  name?: string;
  profileImageUrl?: string;
  profileImage?: string;
  joinedAt?: string;
  createdAt?: string;
  role?: string;
  status?: string;
  age?: number;
  travelStyle?: string;
}

export interface TravelGroupApiResponse {
  id: number | string;
  title?: string;
  name?: string;
  description?: string;
  destination?: string;
  startDate: string;
  endDate: string;
  maxMembers?: number;
  currentMembers?: number;
  members?: GroupMemberApiResponse[];
  tags?: string[];
  groupImageUrl?: string;
  coverImage?: string;
  creatorId?: number | string;
  createdBy?: string;
  createdAt: string;
  status?: string;
  budgetRange?: string;
  travelStyle?: string;
  requirements?: string | string[];
}

// ===== 프로필 관련 API 응답 타입 =====

export interface TravelHistoryApiResponse {
  id?: number | string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  images?: string[];
  tags?: string[];
}

export interface UserReviewApiResponse {
  id?: number | string;
  reviewerId?: number | string;
  reviewerName?: string;
  rating: number;
  comment?: string;
  tripId?: string;
  createdAt: string;
}

export interface UserProfileUpdateRequest {
  nickname?: string;
  fullName?: string;
  age?: number;
  gender?: string;
  bio?: string;
  profileImageUrl?: string;
  interests?: string[];
  languages?: string[];
  travelStyle?: string;
}
