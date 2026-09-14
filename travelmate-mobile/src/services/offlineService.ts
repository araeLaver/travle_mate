/**
 * Offline Service for TravelMate Mobile
 * Handles offline data caching, sync queue, and offline-first data loading
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { apiClient } from './apiClient';

// Storage Keys
const CACHE_KEYS = {
  USER_PROFILE: '@travelmate:cache:userProfile',
  MY_COLLECTIONS: '@travelmate:cache:myCollections',
  NEARBY_LOCATIONS: '@travelmate:cache:nearbyLocations',
  MY_GROUPS: '@travelmate:cache:myGroups',
  CHAT_MESSAGES: '@travelmate:cache:chatMessages',
  MATCHING_DATA: '@travelmate:cache:matchingData',
  LOCATION_DETAILS: '@travelmate:cache:locationDetail',
  SEARCH_HISTORY: '@travelmate:cache:searchHistory',
  PENDING_ACTIONS: '@travelmate:pending:actions',
  LAST_SYNC: '@travelmate:lastSync',
  OFFLINE_PAGES: '@travelmate:offline:pages',
} as const;

// Types
export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface PendingAction {
  id: string;
  type: PendingActionType;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

export type PendingActionType =
  | 'COLLECT_NFT'
  | 'SEND_MESSAGE'
  | 'CREATE_GROUP'
  | 'JOIN_GROUP'
  | 'MARK_READ'
  | 'UPDATE_PROFILE'
  | 'SUBMIT_REVIEW'
  | 'MATCH_REQUEST';

export interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  pendingActionsCount: number;
  lastSyncTime: number | null;
  isInitialized: boolean;
  cacheSize: number;
}

type OfflinePageEntry = { content: unknown; savedAt: number };
type OfflinePages = Record<string, OfflinePageEntry>;

// Cache duration in milliseconds
const CACHE_DURATION = {
  USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
  MY_COLLECTIONS: 60 * 60 * 1000, // 1 hour
  NEARBY_LOCATIONS: 5 * 60 * 1000, // 5 minutes
  MY_GROUPS: 30 * 60 * 1000, // 30 minutes
  CHAT_MESSAGES: 10 * 60 * 1000, // 10 minutes
  MATCHING_DATA: 15 * 60 * 1000, // 15 minutes
  LOCATION_DETAILS: 2 * 60 * 60 * 1000, // 2 hours
  SEARCH_HISTORY: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const MAX_RETRIES = 3;
const MAX_OFFLINE_PAGES = 20;

const debugLog = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log(...args);
  }
};

const compactPayload = (payload: Record<string, unknown>): Record<string, unknown> => {
  const compacted: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      compacted[key] = value;
    }
  });
  return compacted;
};

const isCachedData = <T>(value: unknown): value is CachedData<T> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const cached = value as Record<string, unknown>;
  return (
    'data' in cached &&
    typeof cached.timestamp === 'number' &&
    Number.isFinite(cached.timestamp) &&
    typeof cached.expiresAt === 'number' &&
    Number.isFinite(cached.expiresAt)
  );
};

const isOfflinePages = (value: unknown): value is OfflinePages => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.values(value as Record<string, unknown>).every(page => {
    if (!page || typeof page !== 'object' || Array.isArray(page)) {
      return false;
    }

    const entry = page as Record<string, unknown>;
    return (
      'content' in entry &&
      typeof entry.savedAt === 'number' &&
      Number.isFinite(entry.savedAt)
    );
  });
};

class OfflineService {
  private isOnline: boolean = true;
  private connectionType: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private onStateChangeCallbacks: ((state: OfflineState) => void)[] = [];
  private isInitialized: boolean = false;

  /**
   * Initialize offline service and start network monitoring
   */
  async initialize(): Promise<OfflineState> {
    const state = await NetInfo.fetch();
    this.updateNetworkState(state);

    this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange);
    this.isInitialized = true;

    // Clear expired cache on init
    await this.clearExpiredCache();

    return this.getState();
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState) => {
    const wasOnline = this.isOnline;
    this.updateNetworkState(state);

    if (!wasOnline && this.isOnline) {
      this.syncPendingActions();
    }

    this.notifyStateChange();
  };

  private updateNetworkState(state: NetInfoState): void {
    this.isOnline = state.isConnected === true && state.isInternetReachable !== false;
    this.connectionType = state.type;
  }

  async getState(): Promise<OfflineState> {
    const pendingActions = await this.getPendingActions();
    const lastSyncTime = await this.getLastSyncTime();
    const cacheSize = await this.getCacheSize();

    return {
      isOnline: this.isOnline,
      isConnected: this.isOnline,
      connectionType: this.connectionType,
      pendingActionsCount: pendingActions.length,
      lastSyncTime,
      isInitialized: this.isInitialized,
      cacheSize,
    };
  }

  checkIsOnline(): boolean {
    return this.isOnline;
  }

  onStateChange(callback: (state: OfflineState) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private async notifyStateChange(): Promise<void> {
    const state = await this.getState();
    this.onStateChangeCallbacks.forEach(callback => callback(state));
  }

  // ================== Offline-First Data Loading ==================

  /**
   * Fetch data with offline-first strategy:
   * 1. Return cached data immediately if available
   * 2. Fetch fresh data from network in background
   * 3. Update cache with fresh data
   * 4. Call onUpdate callback with fresh data
   */
  async fetchWithOfflineFirst<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    duration: number,
    onUpdate?: (data: T) => void,
  ): Promise<T | null> {
    // Try cache first
    const cached = await this.getCachedData<T>(cacheKey);

    if (!this.isOnline) {
      return cached;
    }

    // If cached, return it and refresh in background
    if (cached) {
      this.refreshInBackground(cacheKey, fetcher, duration, onUpdate);
      return cached;
    }

    // No cache, must fetch
    try {
      const data = await fetcher();
      await this.cacheData(cacheKey, data, duration);
      return data;
    } catch (error) {
      console.error('Fetch failed, no cache available:', error);
      throw error;
    }
  }

  private async refreshInBackground<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    duration: number,
    onUpdate?: (data: T) => void,
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.cacheData(cacheKey, data, duration);
      onUpdate?.(data);
    } catch (error) {
      debugLog('Background refresh failed:', error);
    }
  }

  // ================== Cache Operations ==================

  async cacheData<T>(key: string, data: T, duration: number): Promise<void> {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cached));
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      let cached: CachedData<T>;
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (!isCachedData<T>(parsed)) {
          throw new Error('Cached data storage shape is invalid');
        }
        cached = parsed;
      } catch (error) {
        console.error('Failed to get cached data:', error);
        await AsyncStorage.removeItem(key);
        return null;
      }

      if (Date.now() > cached.expiresAt) {
        // If offline, return stale data instead of deleting
        if (!this.isOnline) {
          return cached.data;
        }
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  async cacheUserProfile(profile: unknown): Promise<void> {
    await this.cacheData(CACHE_KEYS.USER_PROFILE, profile, CACHE_DURATION.USER_PROFILE);
  }

  async getCachedUserProfile<T>(): Promise<T | null> {
    return this.getCachedData<T>(CACHE_KEYS.USER_PROFILE);
  }

  async cacheCollections(collections: unknown[]): Promise<void> {
    await this.cacheData(CACHE_KEYS.MY_COLLECTIONS, collections, CACHE_DURATION.MY_COLLECTIONS);
  }

  async getCachedCollections<T>(): Promise<T[] | null> {
    return this.getCachedData<T[]>(CACHE_KEYS.MY_COLLECTIONS);
  }

  async cacheNearbyLocations(locations: unknown[]): Promise<void> {
    await this.cacheData(CACHE_KEYS.NEARBY_LOCATIONS, locations, CACHE_DURATION.NEARBY_LOCATIONS);
  }

  async getCachedNearbyLocations<T>(): Promise<T[] | null> {
    return this.getCachedData<T[]>(CACHE_KEYS.NEARBY_LOCATIONS);
  }

  async cacheGroups(groups: unknown[]): Promise<void> {
    await this.cacheData(CACHE_KEYS.MY_GROUPS, groups, CACHE_DURATION.MY_GROUPS);
  }

  async getCachedGroups<T>(): Promise<T[] | null> {
    return this.getCachedData<T[]>(CACHE_KEYS.MY_GROUPS);
  }

  async cacheChatMessages(groupId: string, messages: unknown[]): Promise<void> {
    const key = `${CACHE_KEYS.CHAT_MESSAGES}:${groupId}`;
    await this.cacheData(key, messages, CACHE_DURATION.CHAT_MESSAGES);
  }

  async getCachedChatMessages<T>(groupId: string): Promise<T[] | null> {
    const key = `${CACHE_KEYS.CHAT_MESSAGES}:${groupId}`;
    return this.getCachedData<T[]>(key);
  }

  async cacheMatchingData(data: unknown): Promise<void> {
    await this.cacheData(CACHE_KEYS.MATCHING_DATA, data, CACHE_DURATION.MATCHING_DATA);
  }

  async getCachedMatchingData<T>(): Promise<T | null> {
    return this.getCachedData<T>(CACHE_KEYS.MATCHING_DATA);
  }

  async cacheLocationDetail(locationId: string, data: unknown): Promise<void> {
    const key = `${CACHE_KEYS.LOCATION_DETAILS}:${locationId}`;
    await this.cacheData(key, data, CACHE_DURATION.LOCATION_DETAILS);
  }

  async getCachedLocationDetail<T>(locationId: string): Promise<T | null> {
    const key = `${CACHE_KEYS.LOCATION_DETAILS}:${locationId}`;
    return this.getCachedData<T>(key);
  }

  // ================== Search History ==================

  async addSearchHistory(query: string): Promise<void> {
    const history = await this.getSearchHistory();
    const filtered = history.filter(h => h !== query);
    filtered.unshift(query);
    const trimmed = filtered.slice(0, 50);
    await this.cacheData(CACHE_KEYS.SEARCH_HISTORY, trimmed, CACHE_DURATION.SEARCH_HISTORY);
  }

  async getSearchHistory(): Promise<string[]> {
    return (await this.getCachedData<string[]>(CACHE_KEYS.SEARCH_HISTORY)) || [];
  }

  async clearSearchHistory(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEYS.SEARCH_HISTORY);
  }

  // ================== Offline Page Saving ==================

  async savePageOffline(pageId: string, content: unknown): Promise<void> {
    const pages = await this.getOfflinePages();
    pages[pageId] = { content, savedAt: Date.now() };

    // Limit saved pages
    const keys = Object.keys(pages);
    if (keys.length > MAX_OFFLINE_PAGES) {
      const oldest = keys
        .sort((a, b) => pages[a].savedAt - pages[b].savedAt)
        .slice(0, keys.length - MAX_OFFLINE_PAGES);
      oldest.forEach(k => delete pages[k]);
    }

    await AsyncStorage.setItem(CACHE_KEYS.OFFLINE_PAGES, JSON.stringify(pages));
  }

  async getOfflinePage<T>(pageId: string): Promise<T | null> {
    const pages = await this.getOfflinePages();
    return pages[pageId]?.content as T || null;
  }

  async getOfflinePages(): Promise<OfflinePages> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEYS.OFFLINE_PAGES);
      if (!stored) return {};

      try {
        const parsed = JSON.parse(stored) as unknown;
        if (!isOfflinePages(parsed)) {
          throw new Error('Offline pages storage shape is invalid');
        }
        return parsed;
      } catch (error) {
        console.error('Failed to get offline pages:', error);
        await AsyncStorage.removeItem(CACHE_KEYS.OFFLINE_PAGES);
        return {};
      }
    } catch (error) {
      console.error('Failed to get offline pages:', error);
      return {};
    }
  }

  async removeOfflinePage(pageId: string): Promise<void> {
    const pages = await this.getOfflinePages();
    delete pages[pageId];
    await AsyncStorage.setItem(CACHE_KEYS.OFFLINE_PAGES, JSON.stringify(pages));
  }

  // ================== Pending Actions Queue ==================

  async addPendingAction(
    type: PendingActionType,
    payload: Record<string, unknown>,
    priority: 'high' | 'normal' | 'low' = 'normal',
  ): Promise<string> {
    const actions = await this.getPendingActions();

    const newAction: PendingAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      priority,
    };

    actions.push(newAction);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(actions));

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingActions();
    }

    this.notifyStateChange();
    return newAction.id;
  }

  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      if (!stored) return [];

      const actions = JSON.parse(stored);
      if (!Array.isArray(actions)) {
        throw new Error('Pending actions storage is not an array');
      }

      return actions as PendingAction[];
    } catch (error) {
      console.error('Failed to get pending actions:', error);
      throw error;
    }
  }

  async removePendingAction(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const filtered = actions.filter(a => a.id !== actionId);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
    this.notifyStateChange();
  }

  async updateActionRetryCount(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const updated = actions.map(a =>
      a.id === actionId ? { ...a, retryCount: a.retryCount + 1 } : a
    );
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
  }

  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline) {
      return { success: 0, failed: 0 };
    }

    const actions = await this.getPendingActions();
    // Sort by priority: high first, then normal, then low
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const sorted = [...actions].sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    let success = 0;
    let failed = 0;

    for (const action of sorted) {
      try {
        await this.executeAction(action);
        await this.removePendingAction(action.id);
        success++;
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);

        if (action.retryCount >= MAX_RETRIES) {
          await this.removePendingAction(action.id);
        } else {
          await this.updateActionRetryCount(action.id);
        }
        failed++;
      }
    }

    await this.updateLastSyncTime();
    return { success, failed };
  }

  private async executeAction(action: PendingAction): Promise<void> {
    switch (action.type) {
      case 'COLLECT_NFT':
        await apiClient.post('/nft/collect', this.toCollectNftPayload(action));
        break;
      case 'SEND_MESSAGE':
        await apiClient.post(
          `/chat/rooms/${this.requirePositiveIntegerPayload(action, 'roomId')}/messages`,
          this.toSendMessagePayload(action)
        );
        break;
      case 'CREATE_GROUP':
        await apiClient.post('/groups', this.toCreateGroupPayload(action));
        break;
      case 'JOIN_GROUP':
        await apiClient.post(`/groups/${this.requirePositiveIntegerPayload(action, 'groupId')}/join`);
        break;
      case 'MARK_READ':
        await apiClient.post('/notifications/read', [
          this.requirePositiveIntegerPayload(action, 'notificationId'),
        ]);
        break;
      case 'UPDATE_PROFILE':
        await apiClient.put('/users/profile', compactPayload(action.payload));
        break;
      case 'SUBMIT_REVIEW':
        await apiClient.post('/users/reviews', this.toUserReviewPayload(action));
        break;
      case 'MATCH_REQUEST':
        await apiClient.post('/matching/requests', this.toMatchRequestPayload(action));
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private toCollectNftPayload(action: PendingAction): Record<string, unknown> {
    return compactPayload({
      locationId: this.requirePositiveIntegerPayload(action, 'locationId'),
      latitude: this.requireNumberPayload(action, 'latitude'),
      longitude: this.requireNumberPayload(action, 'longitude'),
      gpsAccuracy: this.optionalNumberPayload(action, 'gpsAccuracy'),
      deviceId: this.optionalStringPayload(action, 'deviceId'),
      isMockLocation: this.optionalBooleanPayload(action, 'isMockLocation'),
    });
  }

  private toSendMessagePayload(action: PendingAction): Record<string, unknown> {
    return compactPayload({
      content: this.requireStringPayload(action, 'content'),
      messageType: this.optionalStringPayload(action, 'messageType') || 'TEXT',
      imageUrl: this.optionalStringPayload(action, 'imageUrl'),
      locationLatitude:
        this.optionalNumberPayload(action, 'locationLatitude') ??
        this.optionalNumberPayload(action, 'latitude'),
      locationLongitude:
        this.optionalNumberPayload(action, 'locationLongitude') ??
        this.optionalNumberPayload(action, 'longitude'),
      locationName: this.optionalStringPayload(action, 'locationName'),
    });
  }

  private toCreateGroupPayload(action: PendingAction): Record<string, unknown> {
    return compactPayload({
      title: this.requireStringPayload(action, ['title', 'name']),
      description: this.optionalStringPayload(action, 'description'),
      destination: this.requireStringPayload(action, 'destination'),
      startDate: this.requireStringPayload(action, 'startDate'),
      endDate: this.requireStringPayload(action, 'endDate'),
      purpose: this.optionalStringPayload(action, 'purpose'),
      maxMembers: this.optionalNumberPayload(action, 'maxMembers'),
      meetingLatitude:
        this.optionalNumberPayload(action, 'meetingLatitude') ??
        this.optionalNumberPayload(action, 'latitude'),
      meetingLongitude:
        this.optionalNumberPayload(action, 'meetingLongitude') ??
        this.optionalNumberPayload(action, 'longitude'),
      meetingAddress: this.optionalStringPayload(action, 'meetingAddress'),
      scheduledTime: this.optionalStringPayload(action, 'scheduledTime'),
      travelStyle: this.optionalStringPayload(action, 'travelStyle'),
      budgetRange: this.optionalStringPayload(action, 'budgetRange'),
      requirements: this.optionalStringPayload(action, 'requirements'),
      groupImageUrl: this.optionalStringPayload(action, 'groupImageUrl'),
    });
  }

  private toUserReviewPayload(action: PendingAction): Record<string, unknown> {
    return compactPayload({
      reviewedUserId: this.requirePositiveIntegerPayload(action, [
        'reviewedUserId',
        'revieweeId',
        'targetUserId',
      ]),
      rating: this.requireNumberPayload(action, 'rating'),
      comment: this.optionalStringPayload(action, 'comment'),
    });
  }

  private toMatchRequestPayload(action: PendingAction): Record<string, unknown> {
    return compactPayload({
      receiverId: this.requirePositiveIntegerPayload(action, ['receiverId', 'targetUserId']),
      message: this.optionalStringPayload(action, 'message'),
    });
  }

  private requirePositiveIntegerPayload(action: PendingAction, keys: string | string[]): number {
    const value = this.requireNumberPayload(action, keys);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(
        `Pending action ${action.id} has invalid positive integer payload: ${this.formatKeys(keys)}`
      );
    }
    return value;
  }

  private requireNumberPayload(action: PendingAction, keys: string | string[]): number {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      const value = this.parseNumber(action.payload[key]);
      if (value !== undefined) return value;
    }
    throw new Error(`Pending action ${action.id} is missing numeric payload: ${this.formatKeys(keys)}`);
  }

  private optionalNumberPayload(action: PendingAction, key: string): number | undefined {
    return this.parseNumber(action.payload[key]);
  }

  private parseNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  }

  private requireStringPayload(action: PendingAction, keys: string | string[]): string {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      const value = this.optionalStringPayload(action, key);
      if (value) return value;
    }
    throw new Error(`Pending action ${action.id} is missing string payload: ${this.formatKeys(keys)}`);
  }

  private optionalStringPayload(action: PendingAction, key: string): string | undefined {
    const value = action.payload[key];
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  private optionalBooleanPayload(action: PendingAction, key: string): boolean | undefined {
    const value = action.payload[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return undefined;
  }

  private formatKeys(keys: string | string[]): string {
    return Array.isArray(keys) ? keys.join('|') : keys;
  }

  // ================== Sync Time ==================

  private async updateLastSyncTime(): Promise<void> {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      if (!stored) return null;

      const parsed = Number(stored);
      if (!Number.isFinite(parsed) || parsed < 0) {
        await AsyncStorage.removeItem(CACHE_KEYS.LAST_SYNC);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  // ================== Cache Management ==================

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tmKeys = keys.filter(k => k.startsWith('@travelmate:cache:'));
      return tmKeys.length;
    } catch {
      return 0;
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('@travelmate:cache:'));
      if (cacheKeys.length > 0) {
        await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
      }
      // Also clear pending actions and offline pages
      await Promise.all([
        CACHE_KEYS.PENDING_ACTIONS,
        CACHE_KEYS.LAST_SYNC,
        CACHE_KEYS.OFFLINE_PAGES,
      ].map(key => AsyncStorage.removeItem(key)));
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('@travelmate:cache:'));

      for (const key of cacheKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (!stored) continue;

        try {
          const cached = JSON.parse(stored) as unknown;
          if (!isCachedData<unknown>(cached)) {
            await AsyncStorage.removeItem(key);
            continue;
          }

          if (Date.now() > cached.expiresAt && this.isOnline) {
            await AsyncStorage.removeItem(key);
          }
        } catch {
          // Invalid JSON, remove it
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.onStateChangeCallbacks = [];
  }
}

export const offlineService = new OfflineService();
export default offlineService;
