/**
 * Notifications Screen for TravelMate Mobile
 * Displays user notifications list
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  notificationService,
  PushNotification,
  NotificationType,
} from '../services/notificationService';
import { ThemePalette, fonts, type, spacing, radii } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import Icon, { IconName } from '../components/icons/Icon';

/** Visual mapping: notification type -> icon + tinted tile colors (design system). */
const notificationVisualsFor = (
  palette: ThemePalette,
  isDark: boolean
): Partial<Record<NotificationType, { icon: IconName; bg: string; fg: string }>> => {
  const epicTile = isDark ? 'rgba(166,108,245,0.16)' : '#F1EAFC';
  return {
    FOLLOW: { icon: 'user', bg: palette.primarySoft, fg: palette.primary },
    LIKE: { icon: 'heart', bg: palette.primarySoft, fg: palette.primary },
    COMMENT: { icon: 'chat', bg: palette.primarySoft, fg: palette.primary },
    MENTION: { icon: 'chat', bg: palette.primarySoft, fg: palette.primary },
    GROUP_INVITE: { icon: 'users', bg: palette.primarySoft, fg: palette.primary },
    GROUP_MESSAGE: { icon: 'send', bg: palette.primarySoft, fg: palette.primary },
    NEW_MESSAGE: { icon: 'send', bg: palette.primarySoft, fg: palette.primary },
    NFT_COLLECTED: { icon: 'stamp', bg: palette.warningBg, fg: palette.rarityLegendary },
    ACHIEVEMENT: { icon: 'crown', bg: palette.warningBg, fg: palette.rarityLegendary },
    NFT_MINTED: { icon: 'spark', bg: epicTile, fg: palette.rarityEpic },
    REVIEW: { icon: 'star', bg: epicTile, fg: palette.rarityEpic },
    NEARBY_LOCATION: { icon: 'pin', bg: palette.primarySoft, fg: palette.primary },
  };
};

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Notifications'
>;

interface Props {
  navigation: NotificationsScreenNavigationProp;
}

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const { palette, isDark } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const notificationVisuals = useMemo(
    () => notificationVisualsFor(palette, isDark),
    [palette, isDark]
  );
  const defaultVisual = useMemo(
    () => ({ icon: 'bell' as IconName, bg: palette.primarySoft, fg: palette.primary }),
    [palette]
  );
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      const response = await notificationService.getNotifications(pageNum);

      if (append) {
        setNotifications(prev => [...prev, ...response.content]);
      } else {
        setNotifications(response.content);
      }

      setHasMore(pageNum < response.totalPages - 1);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    notificationService.clearBadge();
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(0, false);
  }, [loadNotifications]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadNotifications(page + 1, true);
    }
  }, [isLoading, hasMore, page, loadNotifications]);

  const handleNotificationPress = async (notification: PushNotification) => {
    // Mark as read
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }

    // Navigate based on type
    const { data } = notification;
    if (data?.groupId) {
      navigation.navigate('ChatRoom', {
        groupId: data.groupId as number,
        groupName: '그룹',
      });
    } else if (data?.locationId) {
      navigation.navigate('LocationDetail', {
        locationId: data.locationId as number,
      });
    }
  };

  const handleDelete = (notificationId: number) => {
    Alert.alert('알림 삭제', '이 알림을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await notificationService.deleteNotification(notificationId);
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
        },
      },
    ]);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNotification = ({ item }: { item: PushNotification }) => {
    const visual = notificationVisuals[item.type] || defaultVisual;

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: visual.bg }]}>
          <Icon name={visual.icon} size={20} color={visual.fg} />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconTile}>
        <Icon name="bell" size={26} color={palette.textMuted} />
      </View>
      <Text style={styles.emptyText}>알림이 없습니다</Text>
      <Text style={styles.emptySubtext}>새로운 활동이 있으면 알려드릴게요</Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={palette.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알림</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>모두 읽음</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const createStyles = (palette: ThemePalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenH,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  headerTitle: {
    ...type.title,
    color: palette.ink,
  },
  markAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  markAllText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: palette.primary,
  },
  listContainer: {
    paddingVertical: spacing.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: palette.background,
    paddingVertical: 13,
    paddingHorizontal: spacing.screenH,
  },
  unreadItem: {
    backgroundColor: palette.tintIndigo,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.iconButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: spacing.xs,
  },
  unreadText: {
    fontFamily: fonts.extrabold,
    color: palette.ink,
  },
  body: {
    ...type.bodySmall,
    color: palette.textTertiary,
    marginBottom: 6,
  },
  time: {
    ...type.caption,
    color: palette.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconTile: {
    width: 56,
    height: 56,
    borderRadius: radii.card,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...type.heading,
    color: palette.ink,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...type.bodySmall,
    color: palette.textMuted,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});

export default NotificationsScreen;
