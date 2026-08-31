/**
 * Location Detail Screen for TravelMate Mobile
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { nftService, CollectibleLocation } from '../services/nftService';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { ThemePalette, fonts, type, spacing, radii, rarityColorFor } from '../theme';
import Icon from '../components/icons/Icon';

type LocationDetailScreenRouteProp = RouteProp<RootStackParamList, 'LocationDetail'>;
type LocationDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'LocationDetail'
>;

interface Props {
  route: LocationDetailScreenRouteProp;
  navigation: LocationDetailScreenNavigationProp;
}

const LocationDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { locationId } = route.params;
  const [location, setLocation] = useState<CollectibleLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isCollected, setIsCollected] = useState(false);

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationData = await nftService.getLocationDetails(locationId);
        setLocation(locationData);

        // Get user location for distance calculation
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = currentLocation.coords;
          setUserLocation({ latitude, longitude });

          const dist = calculateDistance(
            latitude,
            longitude,
            locationData.latitude,
            locationData.longitude
          );
          setDistance(dist);
        }
      } catch (error: any) {
        Alert.alert('오류', error.message || '장소 정보를 불러오는데 실패했습니다.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [locationId, navigation, calculateDistance]);

  const handleCollect = async () => {
    if (!location || !userLocation) return;

    setIsCollecting(true);
    try {
      const response = await nftService.collectNft({
        locationId: location.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      if (response.success) {
        setIsCollected(true);
        Alert.alert(
          '수집 성공!',
          `${location.name}을(를) 수집했습니다!\n+${response.pointsEarned} 포인트`
        );
      } else {
        Alert.alert('수집 실패', response.message);
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '수집에 실패했습니다.');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleOpenMaps = () => {
    if (!location) return;

    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url);
  };

  const handleShare = async () => {
    if (!location) return;

    try {
      await Share.share({
        title: location.name,
        message: `Fryndo에서 ${location.name}을(를) 확인해보세요! 🗺️\n${location.description}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  if (isLoading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>장소 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const badgeColor = rarityColorFor(palette, location.rarity);
  const isWithinRange =
    distance !== null && distance * 1000 <= location.collectRadius;

  return (
    <ScrollView style={styles.container}>
      {/* Hero Image */}
      {location.imageUrl ? (
        <Image source={{ uri: location.imageUrl }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
          <Text style={styles.placeholderText}>{location.name[0]}</Text>
        </View>
      )}

      {/* Content sheet overlapping hero */}
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={[styles.rarityBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.rarityText}>
              {nftService.getRarityLabel(location.rarity)}
            </Text>
          </View>
          <Text style={styles.title}>{location.name}</Text>
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <View style={styles.metaItem}>
            <Icon name="pin" size={14} color={palette.textTertiary} />
            <Text style={styles.locationText}>
              {location.region}, {location.country}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="grid" size={14} color={palette.textTertiary} />
            <Text style={styles.categoryText}>{location.category}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{location.description}</Text>

        {/* Stat tiles */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{location.collectRadius}m</Text>
            <Text style={styles.statLabel}>수집 반경</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>+{location.pointReward}</Text>
            <Text style={styles.statLabel}>보상 포인트</Text>
          </View>
          {distance !== null && (
            <View style={styles.statTile}>
              <Text
                style={[
                  styles.statValue,
                  isWithinRange && styles.statValueSuccess,
                ]}
              >
                {distance < 1
                  ? `${Math.round(distance * 1000)}m`
                  : `${distance.toFixed(1)}km`}
              </Text>
              <Text style={styles.statLabel}>현재 거리</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenMaps}
          >
            <Icon name="nav" size={16} color={palette.ink} />
            <Text style={styles.secondaryButtonText}>지도에서 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
            <Icon name="share" size={16} color={palette.ink} />
            <Text style={styles.secondaryButtonText}>공유하기</Text>
          </TouchableOpacity>
        </View>

        {/* Collect Section */}
        {isCollected ? (
          <View style={styles.collectedBanner}>
            <Icon name="check" size={18} color={palette.primary} />
            <Text style={styles.collectedBannerText}>
              이미 수집한 장소입니다
            </Text>
          </View>
        ) : !userLocation ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              위치 권한이 필요합니다.{'\n'}설정에서 위치 권한을 허용해주세요.
            </Text>
          </View>
        ) : !isWithinRange ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              수집 범위 밖입니다{'\n'}
              {distance !== null &&
                `${Math.round(
                  distance * 1000 - location.collectRadius
                )}m 더 가까이 이동하세요`}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.collectButton, isCollecting && styles.collectButtonDisabled]}
            onPress={handleCollect}
            disabled={isCollecting}
          >
            {isCollecting ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text style={styles.collectButtonText}>방문 인증하고 수집</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  loadingText: {
    marginTop: spacing.lg,
    ...type.body,
    color: palette.textTertiary,
  },
  heroImage: {
    width: '100%',
    height: 320,
  },
  heroImagePlaceholder: {
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
    fontFamily: fonts.display,
    color: palette.textMuted,
  },
  content: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.xxl,
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: radii.badge,
    marginBottom: spacing.sm,
  },
  rarityText: {
    ...type.badge,
    color: palette.background,
  },
  title: {
    fontSize: 23,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.46,
    color: palette.ink,
  },
  locationInfo: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    ...type.bodySmall,
    color: palette.textTertiary,
  },
  categoryText: {
    ...type.bodySmall,
    color: palette.textTertiary,
  },
  description: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: palette.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  statTile: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.iconButton,
    padding: 11,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 15,
    fontFamily: fonts.extrabold,
    color: palette.ink,
  },
  statValueSuccess: {
    color: palette.primary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: palette.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: palette.ink,
  },
  collectButton: {
    height: 54,
    backgroundColor: palette.primary,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectButtonDisabled: {
    opacity: 0.7,
  },
  collectButtonText: {
    ...type.button,
    color: palette.onPrimary,
  },
  collectedBanner: {
    flexDirection: 'row',
    backgroundColor: palette.primarySoft,
    borderRadius: radii.button,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  collectedBannerText: {
    ...type.cardTitle,
    color: palette.primary,
  },
  warningBanner: {
    backgroundColor: palette.warningBg,
    borderRadius: radii.button,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  warningText: {
    ...type.bodySmall,
    color: palette.warningText,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LocationDetailScreen;
