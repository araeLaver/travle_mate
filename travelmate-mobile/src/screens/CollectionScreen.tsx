/**
 * Collection Screen for TravelMate Mobile
 * Displays user's NFT collection
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { nftService, NftCollection } from '../services/nftService';
import { ListSkeleton } from '../components/SkeletonLoader';

type CollectionScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Collection'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: CollectionScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

const CollectionScreen: React.FC<Props> = ({ navigation }) => {
  const [collections, setCollections] = useState<NftCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchCollections = useCallback(async (pageNum: number = 0, isRefresh: boolean = false) => {
    try {
      const response = await nftService.getMyCollection(pageNum, 20);

      if (isRefresh || pageNum === 0) {
        setCollections(response.content);
      } else {
        setCollections((prev) => [...prev, ...response.content]);
      }

      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setPage(pageNum);
    } catch (error) {
      console.log('Failed to fetch collections:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections(0);
  }, [fetchCollections]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCollections(0, true);
  }, [fetchCollections]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || page >= totalPages - 1) return;

    setIsLoadingMore(true);
    await fetchCollections(page + 1);
  }, [fetchCollections, isLoadingMore, page, totalPages]);

  const handleItemPress = (collection: NftCollection) => {
    navigation.navigate('LocationDetail', { locationId: collection.locationId });
  };

  const renderItem = ({ item }: { item: NftCollection }) => {
    const rarityColor = nftService.getRarityColor(item.rarity);
    const mintStatusColor = getMintStatusColor(item.mintStatus);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleItemPress(item)}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.placeholderText}>{item.locationName[0]}</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.locationName}
          </Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: rarityColor }]}>
              <Text style={styles.badgeText}>
                {nftService.getRarityLabel(item.rarity)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: mintStatusColor }]}>
              <Text style={styles.badgeText}>
                {nftService.getMintStatusLabel(item.mintStatus)}
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>
            {new Date(item.collectedAt).toLocaleDateString('ko-KR')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getMintStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      NOT_MINTED: '#6B7280',
      MINTING: '#F59E0B',
      MINTED: '#10B981',
      FAILED: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>내 컬렉션</Text>
      <Text style={styles.headerSubtitle}>
        총 {totalElements}개의 NFT를 수집했어요
      </Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'].map((rarity) => {
          const count = collections.filter((c) => c.rarity === rarity).length;
          return (
            <View key={rarity} style={styles.statItem}>
              <View
                style={[
                  styles.statDot,
                  { backgroundColor: nftService.getRarityColor(rarity) },
                ]}
              />
              <Text style={styles.statCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🗺️</Text>
      <Text style={styles.emptyTitle}>아직 수집한 NFT가 없어요</Text>
      <Text style={styles.emptySubtitle}>
        지도에서 주변 장소를 찾아{'\n'}NFT를 수집해보세요!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Map' as any)}
      >
        <Text style={styles.emptyButtonText}>지도로 이동</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ListSkeleton count={6} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={collections}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH,
  },
  cardImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: '#9CA3AF',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default CollectionScreen;
