/**
 * Offline Context for TravelMate Mobile
 * Manages offline state and provides network status throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { offlineService, OfflineState, PendingAction } from '../services/offlineService';
import { useAuth } from './AuthContext';

interface OfflineContextType {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  pendingActionsCount: number;
  lastSyncTime: number | null;
  isInitialized: boolean;
  syncPendingActions: () => Promise<{ success: number; failed: number }>;
  addPendingAction: (
    type: PendingAction['type'],
    payload: Record<string, unknown>
  ) => Promise<string>;
  getPendingActions: () => Promise<PendingAction[]>;
  clearCache: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const OfflineProvider: React.FC<Props> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isConnected: true,
    connectionType: null,
    pendingActionsCount: 0,
    lastSyncTime: null,
    isInitialized: false,
    cacheSize: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize offline service
  useEffect(() => {
    const init = async () => {
      try {
        const initialState = await offlineService.initialize();
        setState(initialState);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize offline service:', error);
        setIsInitialized(true);
      }
    };

    init();

    // Subscribe to state changes
    const unsubscribe = offlineService.onStateChange(newState => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      offlineService.cleanup();
    };
  }, []);

  // Auto-sync when authenticated and coming online
  useEffect(() => {
    if (isAuthenticated && state.isOnline && state.pendingActionsCount > 0) {
      syncPendingActions();
    }
  }, [isAuthenticated, state.isOnline]);

  const syncPendingActions = useCallback(async () => {
    return await offlineService.syncPendingActions();
  }, []);

  const addPendingAction = useCallback(
    async (type: PendingAction['type'], payload: Record<string, unknown>) => {
      return await offlineService.addPendingAction(type, payload);
    },
    []
  );

  const getPendingActions = useCallback(async () => {
    return await offlineService.getPendingActions();
  }, []);

  const clearCache = useCallback(async () => {
    await offlineService.clearAllCache();
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline: state.isOnline,
        isConnected: state.isConnected,
        connectionType: state.connectionType,
        pendingActionsCount: state.pendingActionsCount,
        lastSyncTime: state.lastSyncTime,
        isInitialized,
        syncPendingActions,
        addPendingAction,
        getPendingActions,
        clearCache,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;
