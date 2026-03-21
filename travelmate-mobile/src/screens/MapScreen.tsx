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
      COMMON: '#9CA3AF',
      UNCOMMON: '#10B981',
      RARE: '#3B82F6',
      EPIC: '#8B5CF6',
      LEGENDARY: '#F59E0B',
    };
    return colors[rarity] || '#9CA3AF';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
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
              pinColor={item.isCollected ? '#D1D5DB' : getMarkerColor(item.location.rarity)}
            />
            {!item.isCollected && (
              <Circle
                center={{
                  latitude: item.location.latitude,
                  longitude: item.location.longitude,
                }}
                radius={item.location.collectRadius}
                fillColor="rgba(59, 130, 246, 0.1)"
                strokeColor="rgba(59, 130, 246, 0.3)"
                strokeWidth={1}
              />
            )}
          </React.Fragment>
        ))}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={centerOnUser}>
        <Text style={styles.myLocationIcon}>📍</Text>
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
                    <Text style={styles.closeButtonText}>✕</Text>
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
                    <Text style={styles.collectedBannerText}>이미 수집한 장소입니다</Text>
                  </View>
                ) : selectedLocation.distance * 1000 <= selectedLocation.location.collectRadius ? (
                  <TouchableOpacity
                    style={[styles.collectButton, isCollecting && styles.collectButtonDisabled]}
                    onPress={handleCollect}
                    disabled={isCollecting}
                  >
                    {isCollecting ? (
                      <ActivityIndicator color="#fff" />
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myLocationIcon: {
    fontSize: 20,
  },
  legend: {
    position: 'absolute',
    left: 16,
    bottom: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  rarityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  collectButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectButtonDisabled: {
    opacity: 0.7,
  },
  collectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  collectedBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  collectedBannerText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
  tooFarBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  tooFarText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  detailButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MapScreen;
