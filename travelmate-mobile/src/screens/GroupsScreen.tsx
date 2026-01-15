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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService, TravelGroup } from '../services/chatService';

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
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'my' ? '👥' : '🔍'}
      </Text>
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
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>그룹 채팅</Text>
        <TouchableOpacity onPress={handleCreateGroup} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
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
          <TextInput
            style={styles.searchInput}
            placeholder="그룹 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContainer: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupImageContainer: {
    position: 'relative',
  },
  groupImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupImagePlaceholder: {
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  privateBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  privateBadgeText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupsScreen;
