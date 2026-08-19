/**
 * User Search & Recommendation Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recommended, setRecommended] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

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
          {item.isVerified && <Text style={styles.verifiedBadge}>V</Text>}
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
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="닉네임 또는 여행지로 검색"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleSearch('')}
          >
            <Text style={styles.clearButtonText}>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {!searchMode && (
        <Text style={styles.sectionTitle}>추천 동행자</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  bio: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scoreContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
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

export default UserSearchScreen;
