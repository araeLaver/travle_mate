/**
 * Notifications Screen for TravelMate Mobile
 * Displays user notifications list
 */

import React, { useState, useEffect, useCallback } from 'react';
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

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Notifications'
>;

interface Props {
  navigation: NotificationsScreenNavigationProp;
}

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
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
    const icon = notificationService.getNotificationIcon(item.type);
    const color = notificationService.getNotificationColor(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Text style={styles.icon}>{icon}</Text>
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
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyText}>알림이 없습니다</Text>
      <Text style={styles.emptySubtext}>새로운 활동이 있으면 알려드릴게요</Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: '#EFF6FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
    color: '#111827',
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default NotificationsScreen;
