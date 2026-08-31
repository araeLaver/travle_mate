/**
 * Offline Banner Component for TravelMate Mobile
 * Shows network status when offline or syncing
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useOffline } from '../contexts/OfflineContext';
import { ThemePalette, fonts, spacing, radii } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import Icon, { IconName } from './icons/Icon';

interface Props {
  showPendingCount?: boolean;
  onSyncPress?: () => void;
}

const OfflineBanner: React.FC<Props> = ({ showPendingCount = true, onSyncPress }) => {
  const { palette, isDark } = useTheme();
  const styles = useMemo(() => createStyles(palette, isDark), [palette, isDark]);
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
  const getBannerContent = (): {
    icon: IconName;
    message: string;
    subMessage: string;
    showSync: boolean;
  } | null => {
    if (!isOnline) {
      return {
        icon: 'globe',
        message: '오프라인 모드',
        subMessage: '인터넷 연결이 없습니다',
        showSync: false,
      };
    }

    if (pendingActionsCount > 0) {
      return {
        icon: 'spark',
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
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.contentWrapper}>
        <View style={styles.icon}>
          <Icon name={content.icon} size={18} color={palette.rarityLegendary} />
        </View>
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
              <ActivityIndicator size="small" color={palette.primaryDark} />
            ) : (
              <Text style={styles.syncButtonText}>동기화</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (palette: ThemePalette, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: isDark ? palette.surfaceAlt : palette.ink,
    paddingTop: 44, // Safe area top
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: isDark ? palette.ink : palette.white,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  subMessage: {
    color: isDark ? palette.textSecondary : '#A0A0AC',
    fontFamily: fonts.semibold,
    fontSize: 11,
    marginTop: 2,
  },
  syncButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.chip,
  },
  syncButtonText: {
    color: palette.primaryDark,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
});

export default OfflineBanner;
