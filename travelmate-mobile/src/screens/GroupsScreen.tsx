/**
 * Groups Screen for TravelMate Mobile
 * Displays list of user's groups and public groups
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService, TravelGroup } from '../services/chatService';
import { ListSkeleton } from '../components/SkeletonLoader';
import Icon from '../components/icons/Icon';
import { palette, fonts, type, spacing, radii } from '../theme';

type GroupsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Groups'>;

interface Props {
  navigation: GroupsScreenNavigationProp;
}

type TabType = 'my' | 'public';

const GroupsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [myGroups, setMyGroups] = useState<TravelGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<TravelGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  const fetchMyGroups = useCallback(async () => {
    try {
      const [groups, unreads] = await Promise.all([
        chatService.getMyGroups(),
        chatService.getUnreadCounts(),
      ]);
      setMyGroups(groups);
      setUnreadCounts(unreads);
    } catch (error) {
      console.error('Failed to fetch my groups:', error);
    }
  }, []);

  const fetchPublicGroups = useCallback(async () => {
    try {
      const response = await chatService.getPublicGroups(searchQuery);
      setPublicGroups(response.content);
    } catch (error) {
      console.error('Failed to fetch public groups:', error);
    }
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchMyGroups(), fetchPublicGroups()]);
    setIsLoading(false);
  }, [fetchMyGroups, fetchPublicGroups]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'public') {
      fetchPublicGroups();
    }
  }, [searchQuery, activeTab, fetchPublicGroups]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleGroupPress = (group: TravelGroup) => {
    if (group.isMember) {
      navigation.navigate('ChatRoom', { groupId: group.id, groupName: group.name });
    } else {
      Alert.alert(
        '그룹 참여',
        `${group.name} 그룹에 참여하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '참여',
            onPress: async () => {
              try {
                await chatService.joinGroup(group.id);
                Alert.alert('성공', '그룹에 참여했습니다.');
                loadData();
              } catch (error) {
                Alert.alert('오류', '그룹 참여에 실패했습니다.');
              }
            },
          },
        ]
      );
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const renderGroupItem = ({ item }: { item: TravelGroup }) => {
    const unreadCount = unreadCounts[item.id] || 0;

    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => handleGroupPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.groupImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.groupImage} />
          ) : (
            <View style={[styles.groupImage, styles.groupImagePlaceholder]}>
              <Text style={styles.groupImageText}>{item.name.charAt(0)}</Text>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.lastMessage && (
              <Text style={styles.lastMessageTime}>
                {chatService.formatMessageTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>

          {item.lastMessage ? (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.senderNickname}: {item.lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.groupDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}

          <View style={styles.groupMeta}>
            <Text style={styles.memberCount}>
              멤버 {item.memberCount}/{item.maxMembers}
            </Text>
            {!item.isPublic && (
              <View style={styles.privateBadge}>
                <Text style={styles.privateBadgeText}>비공개</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.chevron}>
          <Icon name="right" size={18} color={palette.disabled} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconTile}>
        <Icon
          name={activeTab === 'my' ? 'users' : 'search'}
          size={28}
          color={palette.textMuted}
        />
      </View>
      <Text style={styles.emptyText}>
        {activeTab === 'my'
          ? '참여 중인 그룹이 없습니다'
          : '검색 결과가 없습니다'}
      </Text>
      {activeTab === 'my' && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
          <Text style={styles.createButtonText}>그룹 만들기</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ListSkeleton count={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>그룹 채팅</Text>
        <TouchableOpacity onPress={handleCreateGroup} style={styles.addButton}>
          <Icon name="plus" size={16} color={palette.white} />
          <Text style={styles.addButtonText}>만들기</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            내 그룹
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'public' && styles.activeTab]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
            그룹 찾기
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search (for public tab) */}
      {activeTab === 'public' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <Icon name="search" size={18} color={palette.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="그룹 검색..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={palette.placeholder}
            />
          </View>
        </View>
      )}

      {/* Group List */}
      <FlatList
        data={activeTab === 'my' ? myGroups : publicGroups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
  headerTitle: {
    ...type.title,
    color: palette.ink,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.iconButton,
    backgroundColor: palette.ink,
    justifyContent: 'center',
  },
  addButtonText: {
    ...type.bodySmall,
    fontFamily: fonts.bold,
    color: palette.white,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: palette.background,
    paddingHorizontal: spacing.screenH,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: palette.ink,
  },
  tabText: {
    ...type.body,
    fontFamily: fonts.bold,
    color: palette.textMuted,
  },
  activeTabText: {
    color: palette.ink,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing.md,
    backgroundColor: palette.background,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 46,
    backgroundColor: palette.surface,
    borderRadius: radii.input,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    paddingVertical: 0,
    color: palette.ink,
  },
  listContainer: {
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing.lg,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  groupImageContainer: {
    position: 'relative',
  },
  groupImage: {
    width: 56,
    height: 56,
    borderRadius: radii.input,
  },
  groupImagePlaceholder: {
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImageText: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: palette.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: palette.primary,
    borderRadius: radii.chip,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...type.badge,
    color: palette.white,
  },
  groupInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  groupName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    color: palette.ink,
    flex: 1,
  },
  lastMessageTime: {
    ...type.meta,
    color: palette.textMuted,
    marginLeft: spacing.sm,
  },
  lastMessage: {
    ...type.bodySmall,
    fontFamily: fonts.medium,
    color: palette.textTertiary,
    marginBottom: spacing.xs,
  },
  groupDescription: {
    ...type.bodySmall,
    fontFamily: fonts.medium,
    color: palette.textMuted,
    marginBottom: spacing.xs,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  memberCount: {
    ...type.meta,
    color: palette.textMuted,
  },
  privateBadge: {
    backgroundColor: palette.warningBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.badge,
    marginLeft: spacing.sm,
  },
  privateBadgeText: {
    ...type.badge,
    letterSpacing: 0,
    color: palette.warningText,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconTile: {
    width: 64,
    height: 64,
    borderRadius: radii.cardLarge,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...type.body,
    color: palette.textTertiary,
    marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: palette.primary,
    height: 50,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    ...type.button,
    color: palette.white,
  },
});

export default GroupsScreen;
