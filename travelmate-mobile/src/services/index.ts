/**
 * Service exports for TravelMate Mobile
 */

export { apiClient } from './apiClient';
export { authService } from './authService';
export { nftService } from './nftService';
export { chatService } from './chatService';
export { notificationService } from './notificationService';
export { offlineService } from './offlineService';
export { paymentService, PRODUCT_IDS } from './paymentService';

// Re-export types
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UpdateProfileRequest,
} from './authService';

export type {
  CollectibleLocation,
  NftCollection,
  CollectNftRequest,
  CollectNftResponse,
  NearbyLocation,
} from './nftService';

export type {
  TravelGroup,
  GroupMember,
  ChatMessage,
  CreateGroupRequest,
  SendMessageRequest,
} from './chatService';

export type {
  PushNotification,
  NotificationType,
  NotificationData,
  NotificationPreferences,
} from './notificationService';

export type {
  CachedData,
  PendingAction,
  OfflineState,
} from './offlineService';

export type {
  Product,
  Purchase,
  SubscriptionStatus,
  PointsBalance,
  ProductId,
} from './paymentService';
