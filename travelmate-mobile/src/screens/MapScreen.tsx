/**
 * Map Screen for TravelMate Mobile
 * NFT Collection Map with nearby locations
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { nftService, NearbyLocation, CollectNftResponse } from '../services/nftService';
import { palette, fonts, type, spacing, radii, shadows } from '../theme';
import Icon from '../components/icons/Icon';

type MapScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: MapScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<NearbyLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);

  const fetchLocations = useCallback(async (latitude: number, longitude: number) => {
    try {
      const locations = await nftService.getNearbyLocations(latitude, longitude, 10);
      setNearbyLocations(locations);
    } catch (error) {
      console.log('Failed to fetch locations:', error);
    }
  }, []);

  useEffect(() => {
    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '지도를 사용하려면 위치 권한이 필요합니다.');
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setUserLocation({ latitude, longitude });
        await fetchLocations(latitude, longitude);
      } catch (error) {
        console.log('Location error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initLocation();
  }, [fetchLocations]);

  const handleMarkerPress = (location: NearbyLocation) => {
    setSelectedLocation(location);
    setShowCollectModal(true);
  };

  const handleCollect = async () => {
    if (!selectedLocation || !userLocation) return;

    setIsCollecting(true);
    try {
      const response: CollectNftResponse = await nftService.collectNft({
        locationId: selectedLocation.location.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      if (response.success) {
        Alert.alert(
          '수집 성공!',
          `${selectedLocation.location.name}을(를) 수집했습니다!\n+${response.pointsEarned} 포인트`,
          [{ text: '확인', onPress: () => setShowCollectModal(false) }]
        );
        // Refresh locations
        await fetchLocations(userLocation.latitude, userLocation.longitude);
      } else {
        Alert.alert('수집 실패', response.message);
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '수집에 실패했습니다.');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleRegionChange = async (region: Region) => {
    await fetchLocations(region.latitude, region.longitude);
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const getMarkerColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      COMMON: palette.rarityCommon,
      UNCOMMON: '#10B981',
      RARE: palette.rarityRare,
      EPIC: palette.rarityEpic,
      LEGENDARY: palette.rarityLegendary,
    };
    return colors[rarity] || palette.rarityCommon;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>위치를 확인하는 중...</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          위치 정보를 가져올 수 없습니다.{'\n'}
          위치 권한을 확인해주세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...userLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {nearbyLocations.map((item) => (
          <React.Fragment key={item.location.id}>
            <Marker
              coordinate={{
                latitude: item.location.latitude,
                longitude: item.location.longitude,
              }}
              onPress={() => handleMarkerPress(item)}
              pinColor={item.isCollected ? palette.disabled : getMarkerColor(item.location.rarity)}
            />
            {!item.isCollected && (
              <Circle
                center={{
                  latitude: item.location.latitude,
                  longitude: item.location.longitude,
                }}
                radius={item.location.collectRadius}
                fillColor="rgba(74, 58, 255, 0.08)"
                strokeColor="rgba(74, 58, 255, 0.3)"
                strokeWidth={1}
              />
            )}
          </React.Fragment>
        ))}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={centerOnUser}>
        <Icon name="nav" size={20} color={palette.ink} />
      </TouchableOpacity>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>희귀도</Text>
        <View style={styles.legendItems}>
          {['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'].map((rarity) => (
            <View key={rarity} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: getMarkerColor(rarity) }]}
              />
              <Text style={styles.legendText}>{nftService.getRarityLabel(rarity)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Collect Modal */}
      <Modal
        visible={showCollectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCollectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedLocation && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedLocation.location.name}</Text>
                  <TouchableOpacity
                    onPress={() => setShowCollectModal(false)}
                    style={styles.closeButton}
                  >
                    <Icon name="close" size={18} color={palette.textTertiary} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.rarityBadge,
                    { backgroundColor: getMarkerColor(selectedLocation.location.rarity) },
                  ]}
                >
                  <Text style={styles.rarityText}>
                    {nftService.getRarityLabel(selectedLocation.location.rarity)}
                  </Text>
                </View>

                <Text style={styles.modalDescription}>
                  {selectedLocation.location.description}
                </Text>

                <View style={styles.modalInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>거리</Text>
                    <Text style={styles.infoValue}>
                      {selectedLocation.distance < 1
                        ? `${Math.round(selectedLocation.distance * 1000)}m`
                        : `${selectedLocation.distance.toFixed(1)}km`}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>수집 반경</Text>
                    <Text style={styles.infoValue}>
                      {selectedLocation.location.collectRadius}m
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>보상 포인트</Text>
                    <Text style={styles.infoValue}>
                      +{selectedLocation.location.pointReward}
                    </Text>
                  </View>
                </View>

                {selectedLocation.isCollected ? (
                  <View style={styles.collectedBanner}>
                    <Icon name="check" size={16} color={palette.primary} />
                    <Text style={styles.collectedBannerText}>이미 수집한 장소입니다</Text>
                  </View>
                ) : selectedLocation.distance * 1000 <= selectedLocation.location.collectRadius ? (
                  <TouchableOpacity
                    style={[styles.collectButton, isCollecting && styles.collectButtonDisabled]}
                    onPress={handleCollect}
                    disabled={isCollecting}
                  >
                    {isCollecting ? (
                      <ActivityIndicator color={palette.white} />
                    ) : (
                      <Text style={styles.collectButtonText}>수집하기</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.tooFarBanner}>
                    <Text style={styles.tooFarText}>
                      수집 범위 밖입니다{'\n'}
                      {Math.round(selectedLocation.distance * 1000 - selectedLocation.location.collectRadius)}m 더 가까이 이동하세요
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => {
                    setShowCollectModal(false);
                    navigation.navigate('LocationDetail', {
                      locationId: selectedLocation.location.id,
                    });
                  }}
                >
                  <Text style={styles.detailButtonText}>상세 정보 보기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  loadingText: {
    ...type.bodySmall,
    marginTop: spacing.lg,
    color: palette.textTertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
    padding: spacing.xxl,
  },
  errorText: {
    ...type.body,
    color: palette.textTertiary,
    textAlign: 'center',
  },
  myLocationButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 120,
    width: 44,
    height: 44,
    backgroundColor: palette.white,
    borderRadius: radii.iconButton,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.floating,
  },
  legend: {
    position: 'absolute',
    left: spacing.lg,
    bottom: 100,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: spacing.md,
    ...shadows.floating,
  },
  legendTitle: {
    ...type.caption,
    fontFamily: fonts.bold,
    color: palette.textSecondary,
    marginBottom: spacing.sm,
  },
  legendItems: {
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...type.tabLabel,
    color: palette.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 16, 20, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.white,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.xxl,
    maxHeight: height * 0.7,
    ...shadows.sheet,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.36,
    color: palette.ink,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.badge,
    marginBottom: spacing.md,
  },
  rarityText: {
    ...type.badge,
    color: palette.white,
  },
  modalDescription: {
    ...type.bodySmall,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.medium,
    color: palette.textSecondary,
    marginBottom: spacing.lg,
  },
  modalInfo: {
    backgroundColor: palette.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    ...type.bodySmall,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: palette.textTertiary,
  },
  infoValue: {
    ...type.bodySmall,
    fontSize: 14,
    fontFamily: fonts.bold,
    color: palette.ink,
  },
  collectButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.button,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.primaryGlow,
  },
  collectButtonDisabled: {
    opacity: 0.7,
  },
  collectButtonText: {
    ...type.button,
    color: palette.white,
  },
  collectedBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm - 2,
    backgroundColor: palette.primarySoft,
    borderRadius: radii.input,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  collectedBannerText: {
    ...type.caption,
    fontFamily: fonts.bold,
    color: palette.primary,
  },
  tooFarBanner: {
    backgroundColor: palette.warningBg,
    borderRadius: radii.input,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tooFarText: {
    ...type.bodySmall,
    fontSize: 14,
    lineHeight: 21,
    color: palette.warningText,
    textAlign: 'center',
  },
  detailButton: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.button,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailButtonText: {
    ...type.button,
    color: palette.ink,
  },
});

export default MapScreen;
