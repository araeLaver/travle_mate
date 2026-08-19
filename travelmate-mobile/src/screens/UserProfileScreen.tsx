/**
 * User Detail Profile Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiClient } from '../services/apiClient';

type UserProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'UserProfile'
>;

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

interface Props {
  navigation: UserProfileScreenNavigationProp;
  route: UserProfileScreenRouteProp;
}

interface UserDetail {
  id: number;
  nickname: string;
  email?: string;
  profileImageUrl?: string;
  bio?: string;
  travelStyle?: string;
  languages?: string[];
  isVerified: boolean;
  trustLevel: string;
  trustScore: number;
  totalTrips: number;
  averageRating: number;
  totalReviews: number;
  compatibilityScore?: number;
  createdAt: string;
  recentReviews: Review[];
}

interface BackendUserProfile {
  id: number;
  nickname: string;
  email?: string;
  profileImageUrl?: string;
  bio?: string;
  travelStyle?: string;
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  isEmailVerified?: boolean;
  phoneVerified?: boolean;
  trustBadge?: string;
  trustScore?: number;
  createdAt: string;
}

interface BackendReview {
  id: number;
  reviewerNickname: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Review {
  id: number;
  reviewerNickname: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const TRUST_BADGES: Record<string, { label: string; color: string }> = {
  NEW: { label: '새싹', color: '#9CA3AF' },
  NEWCOMER: { label: '새싹', color: '#9CA3AF' },
  BRONZE: { label: '브론즈', color: '#CD7F32' },
  SILVER: { label: '실버', color: '#A0AEC0' },
  GOLD: { label: '골드', color: '#F59E0B' },
  PLATINUM: { label: '플래티넘', color: '#8B5CF6' },
};

const UserProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { userId } = route.params;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const [profile, reviews] = await Promise.all([
        apiClient.get<BackendUserProfile>(`/users/profile/${userId}`),
        apiClient.get<BackendReview[]>(`/users/reviews/${userId}`),
      ]);
      setUser(toUserDetail(profile, reviews));
    } catch (error) {
      console.log('Failed to load user profile:', error);
      Alert.alert('오류', '프로필을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
  }, [loadUser]);

  const handleSendMatchRequest = async () => {
    try {
      await apiClient.post('/matching/requests', { receiverId: userId });
      Alert.alert('완료', '매칭 요청을 보냈습니다.');
    } catch (error) {
      Alert.alert('오류', '매칭 요청에 실패했습니다.');
    }
  };

  const handleReport = () => {
    Alert.alert(
      '신고하기',
      '이 사용자를 신고하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post('/users/report', {
                reportedUserId: userId,
                reportType: 'OTHER',
                reason: '사용자 신고',
                description: '모바일 앱에서 접수된 사용자 신고입니다.',
              });
              Alert.alert('완료', '신고가 접수되었습니다.');
            } catch {
              Alert.alert('오류', '신고 접수에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    const filled = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) =>
      i < filled ? '\u2605' : '\u2606'
    ).join('');
  };

  const toUserDetail = (
    profile: BackendUserProfile,
    reviews: BackendReview[] = []
  ): UserDetail => ({
    id: profile.id,
    nickname: profile.nickname,
    email: profile.email,
    profileImageUrl: profile.profileImageUrl,
    bio: profile.bio,
    travelStyle: profile.travelStyle,
    languages: profile.languages || [],
    isVerified: Boolean(profile.isEmailVerified || profile.phoneVerified),
    trustLevel: profile.trustBadge || 'NEW',
    trustScore: profile.trustScore || 50,
    totalTrips: 0,
    averageRating: profile.rating || 0,
    totalReviews: profile.reviewCount || reviews.length,
    createdAt: profile.createdAt,
    recentReviews: reviews.slice(0, 5),
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>프로필을 찾을 수 없습니다</Text>
      </View>
    );
  }

  const badge = TRUST_BADGES[user.trustLevel] || TRUST_BADGES.NEWCOMER;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        {user.profileImageUrl ? (
          <Image
            source={{ uri: user.profileImageUrl }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileInitial}>
              {user.nickname?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{user.nickname}</Text>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>V</Text>
              </View>
            )}
          </View>
          <View style={[styles.trustBadge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.trustText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      {user.bio && (
        <View style={styles.section}>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.totalTrips}</Text>
          <Text style={styles.statLabel}>동행</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {user.averageRating > 0 ? user.averageRating.toFixed(1) : '-'}
          </Text>
          <Text style={styles.statLabel}>평점</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.totalReviews}</Text>
          <Text style={styles.statLabel}>리뷰</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.trustScore}</Text>
          <Text style={styles.statLabel}>신뢰도</Text>
        </View>
      </View>

      {/* Compatibility */}
      {user.compatibilityScore != null && (
        <View style={styles.compatSection}>
          <Text style={styles.compatTitle}>호환도</Text>
          <View style={styles.compatBar}>
            <View
              style={[
                styles.compatFill,
                { width: `${user.compatibilityScore}%` },
              ]}
            />
          </View>
          <Text style={styles.compatScore}>{user.compatibilityScore}%</Text>
        </View>
      )}

      {/* Info Tags */}
      <View style={styles.section}>
        {user.travelStyle && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>여행 스타일</Text>
            <Text style={styles.infoValue}>{user.travelStyle}</Text>
          </View>
        )}
        {user.languages && user.languages.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>언어</Text>
            <Text style={styles.infoValue}>{user.languages.join(', ')}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>가입일</Text>
          <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
        </View>
      </View>

      {/* Reviews */}
      {user.recentReviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 리뷰</Text>
          {user.recentReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>
                  {review.reviewerNickname}
                </Text>
                <Text style={styles.reviewStars}>
                  {renderStars(review.rating)}
                </Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>
                {formatDate(review.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.matchButton}
          onPress={handleSendMatchRequest}
        >
          <Text style={styles.matchButtonText}>동행 요청 보내기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
          <Text style={styles.reportButtonText}>신고하기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickname: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  verifiedBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  trustBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  trustText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  compatSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
  },
  compatTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 12,
  },
  compatBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  compatFill: {
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  compatScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewStars: {
    fontSize: 14,
    color: '#F59E0B',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
  },
  matchButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  matchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reportButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 48,
  },
});

export default UserProfileScreen;
