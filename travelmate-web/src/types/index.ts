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

// ===== NFT 관련 타입 =====

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type LocationCategory =
  | 'LANDMARK'
  | 'MUSEUM'
  | 'PARK'
  | 'TEMPLE'
  | 'BEACH'
  | 'MOUNTAIN'
  | 'HISTORIC'
  | 'CULTURAL'
  | 'ENTERTAINMENT'
  | 'FOOD'
  | 'SHOPPING'
  | 'NATURE'
  | 'HIDDEN_GEM';
export type MintStatus = 'PENDING' | 'MINTING' | 'CONFIRMING' | 'MINTED' | 'FAILED';
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'EXPIRED';
export type PointTransactionType = 'EARN' | 'SPEND' | 'TRANSFER_IN' | 'TRANSFER_OUT';
export type PointSource =
  | 'NFT_COLLECT'
  | 'ACHIEVEMENT'
  | 'MARKETPLACE_SALE'
  | 'MARKETPLACE_PURCHASE'
  | 'TRANSFER'
  | 'DAILY_BONUS'
  | 'EVENT'
  | 'REFERRAL'
  | 'ADMIN';
export type AchievementType = 'COLLECTION' | 'EXPLORATION' | 'SOCIAL' | 'STREAK' | 'SPECIAL';

// 포인트 관련
export interface PointBalanceResponse {
  totalPoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  seasonPoints: number;
  currentRank: number;
}

export interface PointTransactionResponse {
  id: number;
  type: PointTransactionType;
  amount: number;
  balanceAfter: number;
  source: PointSource;
  description: string;
  createdAt: string;
}

export interface PointTransferRequest {
  receiverId: number;
  amount: number;
  message?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  nickname: string;
  profileImageUrl?: string;
  totalPoints: number;
  totalNftsCollected: number;
}

// NFT 수집 장소 관련
export interface CollectibleLocationResponse {
  id: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  collectRadius: number;
  category: LocationCategory;
  rarity: Rarity;
  country?: string;
  city?: string;
  region?: string;
  imageUrl?: string;
  nftImageUrl?: string;
  pointReward: number;
  isCollected: boolean;
  isSeasonalEvent: boolean;
  eventEndAt?: string;
  distance?: number; // 현재 위치로부터의 거리 (m)
}

export interface CollectibleLocationSummary {
  id: number;
  name: string;
  imageUrl?: string;
  nftImageUrl?: string;
  rarity: Rarity;
  category: LocationCategory;
  city?: string;
  country?: string;
}

// NFT 수집 요청/응답
export interface CollectNftRequest {
  locationId: number;
  latitude: number;
  longitude: number;
  gpsAccuracy?: number;
  deviceId?: string;
  isMockLocation?: boolean;
}

export interface CollectNftResponse {
  success: boolean;
  message: string;
  nftCollection?: UserNftCollectionResponse;
  earnedPoints?: number;
  unlockedAchievements?: AchievementUnlocked[];
}

export interface AchievementUnlocked {
  achievementId: number;
  name: string;
  description: string;
  iconUrl?: string;
  rarity: Rarity;
  pointReward: number;
}

export interface UserNftCollectionResponse {
  id: number;
  location: CollectibleLocationSummary;
  tokenId?: string;
  mintStatus: MintStatus;
  collectedAt: string;
  earnedPoints: number;
  isVerified: boolean;
}

// 업적 관련
export interface AchievementResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  badgeImageUrl?: string;
  type: AchievementType;
  rarity: Rarity;
  pointReward: number;
  grantsBadgeNft: boolean;
  currentProgress: number;
  targetProgress: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface AchievementStatsResponse {
  totalAchievements: number;
  completedAchievements: number;
  totalPointsFromAchievements: number;
  badgeNftsEarned: number;
}

// 도감 관련
export interface CollectionBookResponse {
  stats: CollectionStats;
  regions: RegionCollection[];
  categories: CategoryCollection[];
}

export interface CollectionStats {
  totalLocations: number;
  collectedLocations: number;
  completionRate: number;
  commonCollected: number;
  rareCollected: number;
  epicCollected: number;
  legendaryCollected: number;
}

export interface RegionCollection {
  region: string;
  country: string;
  total: number;
  collected: number;
  completionRate: number;
}

export interface CategoryCollection {
  category: LocationCategory;
  total: number;
  collected: number;
  completionRate: number;
}

// 마켓플레이스 관련
export interface CreateListingRequest {
  nftCollectionId: number;
  priceInPoints: number;
  durationDays?: number;
}

export interface MarketplaceListingResponse {
  id: number;
  nftCollection: UserNftCollectionResponse;
  seller: SellerInfo;
  priceInPoints: number;
  status: ListingStatus;
  listedAt: string;
  expiresAt?: string;
}

export interface SellerInfo {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

export interface BuyNftResponse {
  success: boolean;
  message: string;
  nftCollection?: UserNftCollectionResponse;
  pointsSpent?: number;
  remainingBalance?: number;
}

// 지갑 관련
export interface SignMessageResponse {
  message: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

export interface VerifySignatureRequest {
  walletAddress: string;
  message: string;
  signature: string;
}

export interface WalletConnectionResponse {
  success: boolean;
  walletAddress?: string;
  isVerified: boolean;
  message: string;
  walletInfo?: WalletInfo;
}

export interface WalletInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  nftCount: number;
  networkName: string;
  chainId: number;
  connectedAt?: string;
  verifiedAt?: string;
}

export interface WalletStatusResponse {
  isConnected: boolean;
  isVerified: boolean;
  walletAddress?: string;
  walletInfo?: WalletInfo;
}

export interface NetworkInfo {
  name: string;
  chainId: number;
  rpcUrl: string;
  currencySymbol: string;
  blockExplorerUrl: string;
  contractAddress: string;
  isTestnet: boolean;
}

export interface DisconnectWalletResponse {
  success: boolean;
  message: string;
}

// 사용자 NFT 통계
export interface UserNftStatsResponse {
  totalNftsCollected: number;
  uniqueLocationsVisited: number;
  totalPointsEarned: number;
  globalRank: number;
  regionRank: number;
  completedAchievements: number;
  collectionStats: CollectionStats;
}
