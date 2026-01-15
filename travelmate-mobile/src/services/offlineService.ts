/**
 * Offline Service for TravelMate Mobile
 * Handles offline data caching and sync queue management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Storage Keys
const CACHE_KEYS = {
  USER_PROFILE: '@travelmate:cache:userProfile',
  MY_COLLECTIONS: '@travelmate:cache:myCollections',
  NEARBY_LOCATIONS: '@travelmate:cache:nearbyLocations',
  MY_GROUPS: '@travelmate:cache:myGroups',
  PENDING_ACTIONS: '@travelmate:pending:actions',
  LAST_SYNC: '@travelmate:lastSync',
} as const;

// Types
export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface PendingAction {
  id: string;
  type: 'COLLECT_NFT' | 'SEND_MESSAGE' | 'CREATE_GROUP' | 'JOIN_GROUP' | 'MARK_READ';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

export interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  pendingActionsCount: number;
  lastSyncTime: number | null;
}

// Cache duration in milliseconds
const CACHE_DURATION = {
  USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
  MY_COLLECTIONS: 60 * 60 * 1000, // 1 hour
  NEARBY_LOCATIONS: 5 * 60 * 1000, // 5 minutes
  MY_GROUPS: 30 * 60 * 1000, // 30 minutes
};

class OfflineService {
  private isOnline: boolean = true;
  private connectionType: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private onStateChangeCallbacks: ((state: OfflineState) => void)[] = [];

  /**
   * Initialize offline service and start network monitoring
   */
  async initialize(): Promise<OfflineState> {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.updateNetworkState(state);

    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange);

    return this.getState();
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState) => {
    const wasOnline = this.isOnline;
    this.updateNetworkState(state);

    // Trigger sync when coming back online
    if (!wasOnline && this.isOnline) {
      this.syncPendingActions();
    }

    // Notify listeners
    this.notifyStateChange();
  };

  /**
   * Update network state
   */
  private updateNetworkState(state: NetInfoState): void {
    this.isOnline = state.isConnected === true && state.isInternetReachable !== false;
    this.connectionType = state.type;
  }

  /**
   * Get current offline state
   */
  async getState(): Promise<OfflineState> {
    const pendingActions = await this.getPendingActions();
    const lastSyncTime = await this.getLastSyncTime();

    return {
      isOnline: this.isOnline,
      isConnected: this.isOnline,
      connectionType: this.connectionType,
      pendingActionsCount: pendingActions.length,
      lastSyncTime,
    };
  }

  /**
   * Check if app is currently online
   */
  checkIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: OfflineState) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all state change listeners
   */
  private async notifyStateChange(): Promise<void> {
    const state = await this.getState();
    this.onStateChangeCallbacks.forEach(callback => callback(state));
  }

  // ================== Cache Operations ==================

  /**
   * Cache data with expiration
   */
  async cacheData<T>(key: string, data: T, duration: number): Promise<void> {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    };

    await AsyncStorage.setItem(key, JSON.stringify(cached));
  }

  /**
   * Get cached data if not expired
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const cached: CachedData<T> = JSON.parse(stored);

      // Check if expired
      if (Date.now() > cached.expiresAt) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(profile: unknown): Promise<void> {
    await this.cacheData(CACHE_KEYS.USER_PROFILE, profile, CACHE_DURATION.USER_PROFILE);
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile<T>(): Promise<T | null> {
    return this.getCachedData<T>(CACHE_KEYS.USER_PROFILE);
  }

  /**
   * Cache collections
   */
  async cacheCollections(collections: unknown[]): Promise<void> {
    await this.cacheData(CACHE_KEYS.MY_COLLECTIONS, collections, CACHE_DURATION.MY_COLLECTIONS);
  }

  /**
   * Get cached collections
   */
  async getCachedCollections<T>(): Promise<T[] | null> {
    return this.getCachedData<T[]>(CACHE_KEYS.MY_COLLECTIONS);
  }

  /**
   * Cache nearby locations
   */
  async cacheNearbyLocations(locations: unknown[]): Promise<void> {
    await this.cacheData(CACHE_KEYS.NEARBY_LOCATIONS, locations, CACHE_DURATION.NEARBY_LOCATIONS);
  }

  /**
   * Get cached nearby locations
   */
  async getCachedNearbyLocations<T>(): Promise<T[] | null> {
    return this.getCachedData<T[]>(CACHE_KEYS.NEARBY_LOCATIONS);
  }

  /**
   * Cache groups
   */
  async cacheGroups(groups: unknown[]): Promise<void> {
    await this.cacheData(CACHE_KEYS.MY_GROUPS, groups, CACHE_DURATION.MY_GROUPS);
  }

  /**
   * Get cached groups
   */
  async getCachedGroups<T>(): Promise<T[] | null> {
    return this.getCachedData<T[]>(CACHE_KEYS.MY_GROUPS);
  }

  // ================== Pending Actions Queue ==================

  /**
   * Add action to pending queue (for offline execution)
   */
  async addPendingAction(
    type: PendingAction['type'],
    payload: Record<string, unknown>
  ): Promise<string> {
    const actions = await this.getPendingActions();

    const newAction: PendingAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    };

    actions.push(newAction);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(actions));

    this.notifyStateChange();
    return newAction.id;
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get pending actions:', error);
      return [];
    }
  }

  /**
   * Remove a pending action
   */
  async removePendingAction(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const filtered = actions.filter(a => a.id !== actionId);
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
    this.notifyStateChange();
  }

  /**
   * Update retry count for action
   */
  async updateActionRetryCount(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const updated = actions.map(a =>
      a.id === actionId ? { ...a, retryCount: a.retryCount + 1 } : a
    );
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
  }

  /**
   * Sync pending actions when back online
   */
  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline) {
      return { success: 0, failed: 0 };
    }

    const actions = await this.getPendingActions();
    let success = 0;
    let failed = 0;

    for (const action of actions) {
      try {
        await this.executeAction(action);
        await this.removePendingAction(action.id);
        success++;
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);

        if (action.retryCount >= 3) {
          // Remove action after 3 failed attempts
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

  /**
   * Execute a pending action
   */
  private async executeAction(action: PendingAction): Promise<void> {
    // This should be implemented with actual API calls
    // For now, just log the action
    console.log(`Executing action: ${action.type}`, action.payload);

    // Dynamic import to avoid circular dependency
    const { apiClient } = await import('./apiClient');

    switch (action.type) {
      case 'COLLECT_NFT':
        await apiClient.post('/nft/collect', action.payload);
        break;
      case 'SEND_MESSAGE':
        await apiClient.post('/chat/messages', action.payload);
        break;
      case 'CREATE_GROUP':
        await apiClient.post('/chat/groups', action.payload);
        break;
      case 'JOIN_GROUP':
        await apiClient.post(`/chat/groups/${action.payload.groupId}/join`);
        break;
      case 'MARK_READ':
        await apiClient.patch(`/notifications/${action.payload.notificationId}/read`);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  // ================== Sync Time ==================

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(): Promise<void> {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<number | null> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      return null;
    }
  }

  // ================== Cleanup ==================

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    const cacheKeys = [
      CACHE_KEYS.USER_PROFILE,
      CACHE_KEYS.MY_COLLECTIONS,
      CACHE_KEYS.NEARBY_LOCATIONS,
      CACHE_KEYS.MY_GROUPS,
    ];

    for (const key of cacheKeys) {
      await this.getCachedData(key); // This will auto-remove if expired
    }
  }

  /**
   * Cleanup service
   */
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
