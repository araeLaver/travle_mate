/**
 * Location Detail Screen for TravelMate Mobile
 */

import React, { useEffect, useState, useCallback } from 'react';
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
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>장소 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const rarityColor = nftService.getRarityColor(location.rarity);
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

      {/* Content */}
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{location.name}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityText}>
              {nftService.getRarityLabel(location.rarity)}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 {location.region}, {location.country}
          </Text>
          <Text style={styles.categoryText}>🏷️ {location.category}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{location.description}</Text>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>수집 반경</Text>
            <Text style={styles.detailValue}>{location.collectRadius}m</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>보상 포인트</Text>
            <Text style={styles.detailValue}>+{location.pointReward}</Text>
          </View>
          {distance !== null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>현재 거리</Text>
              <Text
                style={[
                  styles.detailValue,
                  isWithinRange && styles.detailValueSuccess,
                ]}
              >
                {distance < 1
                  ? `${Math.round(distance * 1000)}m`
                  : `${distance.toFixed(1)}km`}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenMaps}
          >
            <Text style={styles.secondaryButtonText}>지도에서 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
            <Text style={styles.secondaryButtonText}>공유하기</Text>
          </TouchableOpacity>
        </View>

        {/* Collect Section */}
        {isCollected ? (
          <View style={styles.collectedBanner}>
            <Text style={styles.collectedBannerText}>
              ✅ 이미 수집한 장소입니다
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
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.collectButtonText}>NFT 수집하기</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  heroImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
    color: '#9CA3AF',
  },
  content: {
    padding: 24,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailValueSuccess: {
    color: '#059669',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  collectButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  collectButtonDisabled: {
    opacity: 0.7,
  },
  collectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  collectedBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  collectedBannerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D97706',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LocationDetailScreen;
