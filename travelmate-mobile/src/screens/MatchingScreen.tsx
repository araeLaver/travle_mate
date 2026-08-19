/**
 * Matching Request Management Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
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

const STATUS_LABELS: Record<MatchStatus, { text: string; color: string }> = {
  PENDING: { text: '대기중', color: '#F59E0B' },
  ACCEPTED: { text: '수락됨', color: '#10B981' },
  REJECTED: { text: '거절됨', color: '#EF4444' },
  COMPLETED: { text: '완료', color: '#6B7280' },
  CANCELLED: { text: '취소됨', color: '#9CA3AF' },
  EXPIRED: { text: '만료됨', color: '#9CA3AF' },
  MATCHED: { text: '매칭됨', color: '#10B981' },
};

const MatchingScreen: React.FC<Props> = ({ navigation }) => {
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
    const statusInfo = STATUS_LABELS[item.status];
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
                <Text style={styles.verifiedBadge}>V</Text>
              )}
            </View>
            {item.otherUser.averageRating > 0 && (
              <Text style={styles.ratingText}>
                {'\u2605'} {item.otherUser.averageRating.toFixed(1)}
              </Text>
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
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  verifiedBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  ratingText: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 2,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  reviewButton: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 40,
  },
});

export default MatchingScreen;
