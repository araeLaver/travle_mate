/**
 * Matching Request Management Screen
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiClient } from '../services/apiClient';
import { ThemePalette, fonts, type, spacing, radii } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import Icon from '../components/icons/Icon';

type MatchingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Matching'
>;

interface Props {
  navigation: MatchingScreenNavigationProp;
}

type MatchStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'MATCHED';
type TabType = 'received' | 'sent' | 'active';

interface MatchUserSummary {
  id: number;
  nickname: string;
  profileImageUrl?: string;
  rating?: number;
  reviewCount?: number;
}

interface BackendMatchRequest {
  id: number;
  requester: MatchUserSummary;
  receiver: MatchUserSummary;
  status: MatchStatus;
  message?: string;
  createdAt: string;
}

interface BackendMatchHistory {
  matchRequestId: number;
  partner: MatchUserSummary;
  status?: MatchStatus;
  matchedAt: string;
}

interface BackendPage<T> {
  content: T[];
}

interface MatchRequest {
  id: number;
  status: MatchStatus;
  otherUser: {
    id: number;
    nickname: string;
    profileImageUrl?: string;
    isVerified: boolean;
    averageRating: number;
  };
  message?: string;
  createdAt: string;
  reviewWritten?: boolean;
}

const statusLabelsFor = (
  palette: ThemePalette
): Record<MatchStatus, { text: string; color: string }> => ({
  PENDING: { text: '대기중', color: palette.rarityLegendary },
  ACCEPTED: { text: '수락됨', color: palette.primary },
  REJECTED: { text: '거절됨', color: palette.error },
  COMPLETED: { text: '완료', color: palette.textTertiary },
  CANCELLED: { text: '취소됨', color: palette.textMuted },
  EXPIRED: { text: '만료됨', color: palette.textMuted },
  MATCHED: { text: '매칭됨', color: palette.primary },
});

const MatchingScreen: React.FC<Props> = ({ navigation }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const statusLabels = useMemo(() => statusLabelsFor(palette), [palette]);
  const [tab, setTab] = useState<TabType>('received');
  const [matches, setMatches] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    try {
      if (tab === 'active') {
        const data = await apiClient.get<BackendMatchHistory[]>('/matching/history');
        setMatches(data.map(toActiveMatchRequest));
        return;
      }

      const page =
        tab === 'received'
          ? await apiClient.get<BackendPage<BackendMatchRequest>>(
              '/matching/requests/received?page=0&size=50'
            )
          : await apiClient.get<BackendPage<BackendMatchRequest>>(
              '/matching/requests/sent?page=0&size=50'
            );
      setMatches(page.content.map(request => toMatchRequest(request, tab)));
    } catch (error) {
      console.log('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    loadMatches();
  }, [loadMatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  }, [loadMatches]);

  const handleAccept = async (matchId: number) => {
    try {
      await apiClient.put(`/matching/requests/${matchId}/accept`);
      Alert.alert('완료', '매칭 요청을 수락했습니다.');
      loadMatches();
    } catch {
      Alert.alert('오류', '요청 처리에 실패했습니다.');
    }
  };

  const handleReject = async (matchId: number) => {
    Alert.alert(
      '거절',
      '이 매칭 요청을 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.put(`/matching/requests/${matchId}/reject`);
              loadMatches();
            } catch {
              Alert.alert('오류', '요청 처리에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleComplete = async (matchId: number) => {
    Alert.alert(
      '동행 완료',
      '이 매칭을 완료 처리하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '완료',
          onPress: async () => {
            try {
              await apiClient.put(`/matching/requests/${matchId}/complete`);
              await loadMatches();
            } catch {
              Alert.alert('오류', '동행 완료 처리에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (matchId: number) => {
    Alert.alert(
      '취소',
      '매칭 요청을 취소하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/matching/requests/${matchId}`);
              loadMatches();
            } catch {
              Alert.alert('오류', '요청 처리에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const toMatchRequest = (request: BackendMatchRequest, requestTab: TabType): MatchRequest => {
    const otherUser = requestTab === 'received' ? request.requester : request.receiver;
    return {
      id: request.id,
      status: request.status,
      otherUser: toOtherUser(otherUser),
      message: request.message,
      createdAt: request.createdAt,
    };
  };

  const toActiveMatchRequest = (history: BackendMatchHistory): MatchRequest => ({
    id: history.matchRequestId,
    status: history.status || 'ACCEPTED',
    otherUser: toOtherUser(history.partner),
    createdAt: history.matchedAt,
  });

  const toOtherUser = (user: MatchUserSummary): MatchRequest['otherUser'] => ({
    id: user.id,
    nickname: user.nickname,
    profileImageUrl: user.profileImageUrl,
    isVerified: false,
    averageRating: user.rating || 0,
  });

  const renderMatchCard = ({ item }: { item: MatchRequest }) => {
    const statusInfo = statusLabels[item.status];
    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() =>
          navigation.navigate('UserProfile', { userId: item.otherUser.id })
        }
      >
        <View style={styles.cardTop}>
          {item.otherUser.profileImageUrl ? (
            <Image
              source={{ uri: item.otherUser.profileImageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.otherUser.nickname?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{item.otherUser.nickname}</Text>
              {item.otherUser.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="check" size={10} color={palette.onPrimary} strokeWidth={3} />
                </View>
              )}
            </View>
            {item.otherUser.averageRating > 0 && (
              <View style={styles.ratingRow}>
                <Icon name="star-f" size={13} color={palette.rarityLegendary} />
                <Text style={styles.ratingText}>
                  {item.otherUser.averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.statusSection}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.color + '20' },
              ]}
            >
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {item.message && (
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {tab === 'received' && item.status === 'PENDING' && (
            <>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAccept(item.id)}
              >
                <Text style={styles.acceptButtonText}>수락</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleReject(item.id)}
              >
                <Text style={styles.rejectButtonText}>거절</Text>
              </TouchableOpacity>
            </>
          )}
          {tab === 'sent' && item.status === 'PENDING' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          )}
          {tab === 'active' && (item.status === 'ACCEPTED' || item.status === 'MATCHED') && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleComplete(item.id)}
            >
              <Text style={styles.completeButtonText}>동행 완료</Text>
            </TouchableOpacity>
          )}
          {tab === 'active' &&
            item.status === 'COMPLETED' &&
            !item.reviewWritten && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() =>
                  navigation.navigate('Review', {
                    matchId: item.id,
                    targetUserId: item.otherUser.id,
                    targetUserNickname: item.otherUser.nickname,
                  })
                }
              >
                <Text style={styles.reviewButtonText}>리뷰 쓰기</Text>
              </TouchableOpacity>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['received', 'sent', 'active'] as TabType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, tab === t && styles.tabItemActive]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[styles.tabText, tab === t && styles.tabTextActive]}
            >
              {t === 'received' ? '받은 요청' : t === 'sent' ? '보낸 요청' : '진행중'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={palette.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMatchCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {tab === 'received'
                ? '받은 매칭 요청이 없습니다'
                : tab === 'sent'
                ? '보낸 매칭 요청이 없습니다'
                : '진행중인 동행이 없습니다'}
            </Text>
          }
        />
      )}
    </View>
  );
};

const createStyles = (palette: ThemePalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: palette.ink,
  },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.textMuted,
  },
  tabTextActive: {
    fontFamily: fonts.extrabold,
    color: palette.ink,
  },
  listContent: {
    padding: spacing.screenH,
    paddingBottom: spacing.xxl,
  },
  matchCard: {
    backgroundColor: palette.background,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.iconButton,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radii.iconButton,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: palette.primary,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickname: {
    ...type.cardTitle,
    color: palette.ink,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  ratingText: {
    ...type.bodySmall,
    color: palette.textTertiary,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.badge,
  },
  statusText: {
    ...type.caption,
    fontFamily: fonts.bold,
  },
  dateText: {
    ...type.meta,
    color: palette.textMuted,
    marginTop: spacing.xs,
  },
  message: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: 10,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: palette.primary,
    paddingVertical: 12,
    borderRadius: radii.iconButton,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: palette.onPrimary,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: palette.errorBg,
    paddingVertical: 12,
    borderRadius: radii.iconButton,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.error,
  },
  cancelButton: {
    backgroundColor: palette.surfaceAlt,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.iconButton,
  },
  cancelButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.textSecondary,
  },
  completeButton: {
    flex: 1,
    backgroundColor: palette.ink,
    paddingVertical: 12,
    borderRadius: radii.iconButton,
    alignItems: 'center',
  },
  completeButtonText: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: palette.background,
  },
  reviewButton: {
    flex: 1,
    backgroundColor: palette.warningBg,
    paddingVertical: 12,
    borderRadius: radii.iconButton,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: palette.rarityLegendary,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    ...type.bodySmall,
    textAlign: 'center',
    color: palette.textMuted,
    marginTop: 40,
  },
});

export default MatchingScreen;
