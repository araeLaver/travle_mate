/**
 * User Detail Profile Screen
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import Icon from '../components/icons/Icon';
import { useTheme } from '../contexts/ThemeContext';
import { ThemePalette, fonts, type, spacing, radii } from '../theme';

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

const createTrustBadges = (
  palette: ThemePalette
): Record<string, { label: string; color: string }> => ({
  NEW: { label: '새싹', color: palette.rarityCommon },
  NEWCOMER: { label: '새싹', color: palette.rarityCommon },
  BRONZE: { label: '브론즈', color: palette.warningText },
  SILVER: { label: '실버', color: palette.textTertiary },
  GOLD: { label: '골드', color: palette.rarityLegendary },
  PLATINUM: { label: '플래티넘', color: palette.rarityEpic },
});

const UserProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const trustBadges = useMemo(() => createTrustBadges(palette), [palette]);
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
      i < filled ? '★' : '☆'
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
        <ActivityIndicator size="large" color={palette.primary} />
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

  const badge = trustBadges[user.trustLevel] || trustBadges.NEWCOMER;

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
                <Icon name="check" size={10} color={palette.onPrimary} strokeWidth={2.5} />
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

const createStyles = (palette: ThemePalette) =>
  StyleSheet.create({
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
  errorText: {
    ...type.body,
    color: palette.textTertiary,
  },
  header: {
    backgroundColor: palette.background,
    padding: spacing.xxl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: palette.background,
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontFamily: fonts.extrabold,
    fontSize: 36,
    color: palette.primary,
  },
  nameSection: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickname: {
    fontFamily: fonts.extrabold,
    fontSize: 21,
    lineHeight: 27,
    color: palette.ink,
  },
  verifiedBadge: {
    backgroundColor: palette.primary,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  trustBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.badge,
    marginTop: spacing.sm,
  },
  trustText: {
    ...type.caption,
    fontFamily: fonts.bold,
  },
  section: {
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    ...type.heading,
    color: palette.ink,
    marginBottom: spacing.md,
  },
  bioText: {
    ...type.bodySmall,
    fontFamily: fonts.medium,
    color: palette.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    marginHorizontal: spacing.screenH,
    borderRadius: radii.input,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...type.statNumber,
    color: palette.ink,
  },
  statLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 15,
    color: palette.textMuted,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: palette.outline,
    marginHorizontal: spacing.xs,
  },
  compatSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.tintIndigo,
    marginHorizontal: spacing.screenH,
    marginTop: spacing.sm,
    borderRadius: radii.input,
    padding: spacing.lg,
  },
  compatTitle: {
    ...type.bodySmall,
    color: palette.textTertiary,
    marginRight: spacing.md,
  },
  compatBar: {
    flex: 1,
    height: 8,
    backgroundColor: palette.track,
    borderRadius: 4,
    overflow: 'hidden',
  },
  compatFill: {
    height: 8,
    backgroundColor: palette.primary,
    borderRadius: 4,
  },
  compatScore: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    lineHeight: 21,
    color: palette.primary,
    marginLeft: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    padding: 14,
    borderRadius: radii.chip,
    marginBottom: 6,
  },
  infoLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: palette.textTertiary,
  },
  infoValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    color: palette.ink,
  },
  reviewCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: 14,
    borderRadius: radii.card,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    color: palette.ink,
  },
  reviewStars: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: palette.rarityLegendary,
  },
  reviewComment: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    color: palette.textSecondary,
    marginTop: 6,
  },
  reviewDate: {
    ...type.caption,
    color: palette.textMuted,
    marginTop: 6,
  },
  actionSection: {
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing.lg,
    gap: 10,
  },
  matchButton: {
    backgroundColor: palette.primary,
    height: 50,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchButtonText: {
    ...type.button,
    color: palette.onPrimary,
  },
  reportButton: {
    paddingVertical: 14,
    borderRadius: radii.button,
    alignItems: 'center',
  },
  reportButtonText: {
    ...type.bodySmall,
    color: palette.textMuted,
  },
  bottomPadding: {
    height: 48,
  },
  });

export default UserProfileScreen;
