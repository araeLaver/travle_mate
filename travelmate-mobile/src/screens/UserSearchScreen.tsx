/**
 * User Search & Recommendation Screen
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiClient } from '../services/apiClient';
import { ThemePalette, fonts, type, spacing, radii } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import Icon from '../components/icons/Icon';

type UserSearchScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'UserSearch'
>;

interface Props {
  navigation: UserSearchScreenNavigationProp;
}

interface UserProfile {
  id: number;
  nickname: string;
  profileImageUrl?: string;
  bio?: string;
  travelStyle?: string;
  compatibilityScore?: number;
  totalTrips: number;
  averageRating: number;
  isVerified: boolean;
}

interface MatchUserSummary {
  id: number;
  nickname: string;
  profileImageUrl?: string;
  bio?: string;
  travelStyle?: string;
  rating?: number;
}

interface MatchRecommendation {
  user: MatchUserSummary;
  totalScore?: number;
}

const UserSearchScreen: React.FC<Props> = ({ navigation }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recommended, setRecommended] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const loadRecommendations = useCallback(async () => {
    try {
      const data = await apiClient.get<MatchRecommendation[]>('/matching/recommendations?limit=20');
      setRecommended(data.map(toUserProfile));
    } catch (error) {
      console.log('Failed to load recommendations:', error);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSearchMode(false);
      setUsers([]);
      return;
    }
    setSearchMode(true);
    setLoading(true);
    try {
      const data = await apiClient.get<MatchRecommendation[]>('/matching/recommendations?limit=50');
      const normalized = text.trim().toLowerCase();
      setUsers(
        data
          .map(toUserProfile)
          .filter(user =>
            [user.nickname, user.bio, user.travelStyle]
              .filter(Boolean)
              .some(value => value!.toLowerCase().includes(normalized))
          )
      );
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  }, [loadRecommendations]);

  const navigateToProfile = (userId: number) => {
    navigation.navigate('UserProfile', { userId });
  };

  const toUserProfile = (recommendation: MatchRecommendation): UserProfile => ({
    id: recommendation.user.id,
    nickname: recommendation.user.nickname,
    profileImageUrl: recommendation.user.profileImageUrl,
    bio: recommendation.user.bio,
    travelStyle: recommendation.user.travelStyle,
    compatibilityScore: recommendation.totalScore ? Math.round(recommendation.totalScore) : undefined,
    totalTrips: 0,
    averageRating: recommendation.user.rating || 0,
    isVerified: false,
  });

  const renderUserCard = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigateToProfile(item.id)}
    >
      {item.profileImageUrl ? (
        <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {item.nickname?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{item.nickname}</Text>
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Icon name="check" size={10} color={palette.onPrimary} strokeWidth={3} />
            </View>
          )}
        </View>
        {item.bio && (
          <Text style={styles.bio} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
        <View style={styles.statsRow}>
          {item.travelStyle && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.travelStyle}</Text>
            </View>
          )}
          <Text style={styles.statText}>{item.totalTrips}회 동행</Text>
          {item.averageRating > 0 && (
            <Text style={styles.statText}>
              {item.averageRating.toFixed(1)}점
            </Text>
          )}
        </View>
      </View>
      {item.compatibilityScore != null && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{item.compatibilityScore}%</Text>
          <Text style={styles.scoreLabel}>호환</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const displayData = searchMode ? users : recommended;
  const emptyText = searchMode
    ? '검색 결과가 없습니다'
    : '추천 동행자가 없습니다';

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <Icon name="search" size={18} color={palette.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="닉네임 또는 여행지로 검색"
          placeholderTextColor={palette.placeholder}
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleSearch('')}
          >
            <Icon name="close" size={16} color={palette.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {!searchMode && (
        <Text style={styles.sectionTitle}>추천 동행자</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={palette.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>{emptyText}</Text>
          }
        />
      )}
    </View>
  );
};

const createStyles = (palette: ThemePalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.screenH,
    height: 46,
    backgroundColor: palette.surface,
    borderRadius: radii.input,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  searchBarFocused: {
    borderColor: palette.primary,
    backgroundColor: palette.background,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: palette.ink,
  },
  clearButton: {
    padding: spacing.sm,
  },
  sectionTitle: {
    ...type.heading,
    color: palette.ink,
    marginHorizontal: spacing.screenH,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.xxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: spacing.lg,
    borderRadius: radii.card,
    marginBottom: spacing.sm,
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
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickname: {
    fontFamily: fonts.bold,
    fontSize: 14,
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
  bio: {
    ...type.caption,
    color: palette.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.chip,
  },
  tagText: {
    ...type.meta,
    color: palette.textSecondary,
  },
  statText: {
    ...type.meta,
    color: palette.textMuted,
  },
  scoreContainer: {
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  scoreValue: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: palette.primary,
  },
  scoreLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: palette.textMuted,
    marginTop: 2,
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

export default UserSearchScreen;
