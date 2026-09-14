/**
 * Collection Screen for TravelMate Mobile
 * Displays user's NFT collection
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';
import { ThemePalette, fonts, type, spacing, radii, rarityColorFor } from '../theme';
import Icon from '../components/icons/Icon';

type CollectionScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Collection'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: CollectionScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.screenH * 2 - spacing.md) / 2;

/** Rarity → stat-number tint (common uses ink per spec; UNCOMMON has no design equivalent). */
const rarityStatColor = (palette: ThemePalette, rarity: string): string => {
  switch (rarity) {
    case 'COMMON':
      return palette.ink;
    case 'UNCOMMON':
      return '#10B981';
    default:
      return rarityColorFor(palette, rarity);
  }
};

/** Mint status → chip colors (민팅됨 = primarySoft/primary per spec). */
const mintStatusChip = (
  palette: ThemePalette,
  status: string
): { backgroundColor: string; color: string } => {
  switch (status) {
    case 'MINTED':
      return { backgroundColor: palette.primarySoft, color: palette.primary };
    case 'MINTING':
      return { backgroundColor: palette.warningBg, color: palette.warningText };
    case 'FAILED':
      return { backgroundColor: palette.errorBg, color: palette.error };
    default:
      return { backgroundColor: palette.surfaceAlt, color: palette.textMuted };
  }
};

const CollectionScreen: React.FC<Props> = ({ navigation }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
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
    const itemRarityColor = rarityColorFor(palette, item.rarity);
    const mintChip = mintStatusChip(palette, item.mintStatus);

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: itemRarityColor }]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.cardImageWrap}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Text style={styles.placeholderText}>{item.locationName[0]}</Text>
            </View>
          )}
          <View style={[styles.rarityBadge, { backgroundColor: itemRarityColor }]}>
            <Text style={styles.rarityBadgeText}>
              {nftService.getRarityLabel(item.rarity)}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.locationName}
          </Text>

          <View style={styles.badgeRow}>
            <View style={[styles.mintBadge, { backgroundColor: mintChip.backgroundColor }]}>
              <Text style={[styles.mintBadgeText, { color: mintChip.color }]}>
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
            <View key={rarity} style={styles.statTile}>
              <Text style={[styles.statCount, { color: rarityStatColor(palette, rarity) }]}>
                {count}
              </Text>
              <Text style={styles.statLabel}>{nftService.getRarityLabel(rarity)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Icon name="pin" size={30} color={palette.textMuted} />
      </View>
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
        <ActivityIndicator size="small" color={palette.primary} />
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
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  headerTitle: {
    ...type.title,
    color: palette.ink,
  },
  headerSubtitle: {
    ...type.caption,
    color: palette.textMuted,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.input,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statCount: {
    ...type.statNumber,
  },
  statLabel: {
    ...type.tabLabel,
    color: palette.textMuted,
    marginTop: spacing.xs,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: palette.background,
    borderRadius: radii.card,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardImageWrap: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  cardImagePlaceholder: {
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...type.statNumber,
    fontSize: 28,
    lineHeight: 34,
    color: palette.textMuted,
  },
  rarityBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.badge,
  },
  rarityBadgeText: {
    ...type.badge,
    color: palette.background,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    color: palette.ink,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  mintBadge: {
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.badge,
  },
  mintBadgeText: {
    ...type.badge,
  },
  dateText: {
    ...type.meta,
    color: palette.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: palette.dashed,
    borderStyle: 'dashed',
    paddingVertical: 48,
    paddingHorizontal: spacing.xxl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.hero,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...type.heading,
    color: palette.ink,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...type.bodySmall,
    color: palette.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  emptyButton: {
    backgroundColor: palette.primary,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.button,
  },
  emptyButtonText: {
    ...type.button,
    color: palette.onPrimary,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  });

export default CollectionScreen;
