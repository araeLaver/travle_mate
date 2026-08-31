/**
 * Home Screen for TravelMate Mobile
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { nftService, NearbyLocation } from '../services/nftService';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { ThemePalette, fonts, type, spacing, radii, rarityColorFor } from '../theme';
import Icon, { IconName } from '../components/icons/Icon';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const NEARBY_CARD_WIDTH = 150;

const QuickActionIcon: React.FC<{
  name: IconName;
  palette: ThemePalette;
  styles: ReturnType<typeof createStyles>;
}> = ({ name, palette, styles }) => (
  <View style={styles.actionIcon}>
    <Icon name={name} size={22} color={palette.primary} />
  </View>
);

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  const fetchNearbyLocations = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission(false);
        return;
      }
      setLocationPermission(true);

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const locations = await nftService.getNearbyLocations(latitude, longitude, 10);
      setNearbyLocations(locations);
    } catch (error) {
      console.log('Failed to fetch nearby locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNearbyLocations();
  }, [fetchNearbyLocations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNearbyLocations();
    setRefreshing(false);
  }, [fetchNearbyLocations]);

  const handleLocationPress = (locationId: number) => {
    navigation.navigate('LocationDetail', { locationId });
  };

  const renderNearbyCard = (item: NearbyLocation) => {
    const { location, distance, isCollected } = item;

    return (
      <TouchableOpacity
        key={location.id}
        style={styles.nearbyCard}
        onPress={() => handleLocationPress(location.id)}
      >
        <View style={styles.cardImageWrap}>
          {location.imageUrl ? (
            <Image source={{ uri: location.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Text style={styles.placeholderText}>{location.name[0]}</Text>
            </View>
          )}
          <View
            style={[styles.rarityBadge, { backgroundColor: rarityColorFor(palette, location.rarity) }]}
          >
            <Text style={styles.rarityText}>
              {nftService.getRarityLabel(location.rarity)}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {location.name}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.distanceText}>
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
            </Text>
            {isCollected && (
              <View style={styles.collectedBadge}>
                <Text style={styles.collectedText}>수집 완료</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeTextWrap}>
            <View style={styles.welcomeCaptionRow}>
              <Icon name="nav" size={13} color={palette.textMuted} />
              <Text style={styles.welcomeSubtext}>
                오늘은 어떤 장소를 수집해볼까요?
              </Text>
            </View>
            <Text style={styles.welcomeText}>
              안녕하세요, {user?.nickname || '여행자'}님!
            </Text>
          </View>
          <View style={styles.welcomeRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={20} color={palette.ink} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="user" size={18} color={palette.textMuted} />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('UserSearch')}
        activeOpacity={0.7}
      >
        <Icon name="search" size={18} color={palette.placeholder} />
        <Text style={styles.searchPlaceholder}>장소, 사람, 그룹 검색</Text>
      </TouchableOpacity>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.totalNftsCollected || 0}</Text>
          <Text style={styles.statLabel}>수집 NFT</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>포인트</Text>
        </View>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Map' as any)}
        >
          <Text style={styles.statNumber}>{nearbyLocations.length}</Text>
          <Text style={styles.statLabel}>주변 장소</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>빠른 메뉴</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Map' as any)}
          >
            <QuickActionIcon name="pin" palette={palette} styles={styles} />
            <Text style={styles.actionText}>지도 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Collection' as any)}
          >
            <QuickActionIcon name="grid" palette={palette} styles={styles} />
            <Text style={styles.actionText}>내 컬렉션</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('UserSearch')}
          >
            <QuickActionIcon name="search" palette={palette} styles={styles} />
            <Text style={styles.actionText}>동행자 찾기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Matching')}
          >
            <QuickActionIcon name="users" palette={palette} styles={styles} />
            <Text style={styles.actionText}>매칭 관리</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <QuickActionIcon name="gear" palette={palette} styles={styles} />
            <Text style={styles.actionText}>설정</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nearby Locations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>근처에서 수집 가능</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Map' as any)}>
            <Text style={styles.seeAllText}>전체 보기</Text>
          </TouchableOpacity>
        </View>

        {!locationPermission ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              위치 권한이 필요합니다.{'\n'}
              설정에서 위치 권한을 허용해주세요.
            </Text>
          </View>
        ) : isLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyList}
          >
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.nearbyCard}>
                <View style={styles.skeletonImage} />
                <View style={styles.cardContent}>
                  <View style={styles.skeletonLineWide} />
                  <View style={styles.skeletonLineNarrow} />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : nearbyLocations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              주변에 수집 가능한 장소가 없습니다.{'\n'}
              다른 지역으로 이동해보세요!
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyList}
          >
            {nearbyLocations.slice(0, 5).map(renderNearbyCard)}
          </ScrollView>
        )}
      </View>

      {/* Bottom Padding */}
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
  welcomeSection: {
    backgroundColor: palette.background,
    paddingHorizontal: spacing.screenH,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeTextWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  welcomeCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  welcomeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: radii.iconButton,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: palette.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: palette.background,
  },
  notificationBadgeText: {
    ...type.badge,
    fontSize: 9,
    lineHeight: 11,
    color: palette.onPrimary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    ...type.title,
    color: palette.ink,
  },
  welcomeSubtext: {
    ...type.caption,
    fontFamily: fonts.bold,
    color: palette.textMuted,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.screenH,
    height: 46,
    borderRadius: radii.input,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg - 2,
  },
  searchPlaceholder: {
    ...type.body,
    fontSize: 14,
    color: palette.placeholder,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenH,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statNumber: {
    ...type.statNumber,
    color: palette.ink,
  },
  statLabel: {
    ...type.meta,
    fontFamily: fonts.bold,
    color: palette.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.screenH,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...type.heading,
    color: palette.ink,
    marginBottom: spacing.lg,
  },
  seeAllText: {
    ...type.caption,
    fontFamily: fonts.bold,
    color: palette.primary,
    marginBottom: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: palette.background,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: palette.hairline,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.iconButton,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    ...type.meta,
    fontFamily: fonts.bold,
    color: palette.textSecondary,
  },
  nearbyList: {
    paddingRight: spacing.screenH,
    gap: spacing.md,
  },
  nearbyCard: {
    width: NEARBY_CARD_WIDTH,
    backgroundColor: palette.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  cardImageWrap: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 104,
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
  cardContent: {
    padding: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    color: palette.ink,
    marginBottom: spacing.xs,
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
  rarityText: {
    ...type.badge,
    color: palette.background,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceText: {
    ...type.meta,
    color: palette.textMuted,
  },
  collectedBadge: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.badge,
  },
  collectedText: {
    ...type.badge,
    color: palette.primary,
  },
  emptyState: {
    backgroundColor: palette.background,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: palette.dashed,
    borderStyle: 'dashed',
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...type.bodySmall,
    color: palette.textTertiary,
    textAlign: 'center',
  },
  skeletonImage: {
    width: '100%',
    height: 104,
    backgroundColor: palette.surfaceAlt,
  },
  skeletonLineWide: {
    width: '70%',
    height: 14,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.badge - 3,
  },
  skeletonLineNarrow: {
    width: '45%',
    height: 11,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.badge - 3,
    marginTop: spacing.sm - 2,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
  });

export default HomeScreen;
