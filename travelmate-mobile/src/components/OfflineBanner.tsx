/**
 * Offline Banner Component for TravelMate Mobile
 * Shows network status when offline or syncing
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useOffline } from '../contexts/OfflineContext';

interface Props {
  showPendingCount?: boolean;
  onSyncPress?: () => void;
}

const OfflineBanner: React.FC<Props> = ({ showPendingCount = true, onSyncPress }) => {
  const { isOnline, pendingActionsCount, syncPendingActions } = useOffline();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const [isSyncing, setIsSyncing] = React.useState(false);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline && pendingActionsCount === 0 ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, pendingActionsCount]);

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      await syncPendingActions();
      onSyncPress?.();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Determine banner content based on state
  const getBannerContent = () => {
    if (!isOnline) {
      return {
        backgroundColor: '#EF4444',
        icon: '📡',
        message: '오프라인 모드',
        subMessage: '인터넷 연결이 없습니다',
        showSync: false,
      };
    }

    if (pendingActionsCount > 0) {
      return {
        backgroundColor: '#F59E0B',
        icon: '🔄',
        message: `동기화 대기 중 (${pendingActionsCount}개)`,
        subMessage: '탭하여 동기화',
        showSync: true,
      };
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: content.backgroundColor },
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.contentWrapper}>
        <Text style={styles.icon}>{content.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{content.message}</Text>
          <Text style={styles.subMessage}>{content.subMessage}</Text>
        </View>

        {content.showSync && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.syncButtonText}>동기화</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 44, // Safe area top
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineBanner;
