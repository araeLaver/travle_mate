/**
 * Settings Screen for TravelMate Mobile
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [nearbyAlerts, setNearbyAlerts] = useState(true);
  const [collectAlerts, setCollectAlerts] = useState(true);

  const handleToggle = async (
    key: string,
    value: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      setter(value);
      await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));
    } catch (error) {
      console.log('Failed to save setting:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      '캐시 삭제',
      '저장된 캐시 데이터를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear image cache or other cached data
              Alert.alert('완료', '캐시가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', '캐시 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleOpenSystemSettings = () => {
    Linking.openSettings();
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@fryndo.com?subject=Fryndo 앱 문의');
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://travelmate.com/privacy');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://travelmate.com/terms');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>푸시 알림</Text>
            <Text style={styles.settingDescription}>
              앱 알림을 받습니다
            </Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={(value) =>
              handleToggle('pushNotifications', value, setPushNotifications)
            }
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={pushNotifications ? '#3B82F6' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>주변 장소 알림</Text>
            <Text style={styles.settingDescription}>
              수집 가능한 장소가 근처에 있을 때 알림
            </Text>
          </View>
          <Switch
            value={nearbyAlerts}
            onValueChange={(value) =>
              handleToggle('nearbyAlerts', value, setNearbyAlerts)
            }
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={nearbyAlerts ? '#3B82F6' : '#f4f3f4'}
            disabled={!pushNotifications}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>수집 완료 알림</Text>
            <Text style={styles.settingDescription}>
              NFT 수집 완료 시 알림
            </Text>
          </View>
          <Switch
            value={collectAlerts}
            onValueChange={(value) =>
              handleToggle('collectAlerts', value, setCollectAlerts)
            }
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={collectAlerts ? '#3B82F6' : '#f4f3f4'}
            disabled={!pushNotifications}
          />
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>위치</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>위치 서비스</Text>
            <Text style={styles.settingDescription}>
              백그라운드 위치 추적 활성화
            </Text>
          </View>
          <Switch
            value={locationServices}
            onValueChange={(value) =>
              handleToggle('locationServices', value, setLocationServices)
            }
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={locationServices ? '#3B82F6' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={styles.settingButton}
          onPress={handleOpenSystemSettings}
        >
          <Text style={styles.settingButtonText}>시스템 위치 설정</Text>
          <Text style={styles.settingButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>데이터</Text>

        <TouchableOpacity style={styles.settingButton} onPress={handleClearCache}>
          <Text style={styles.settingButtonText}>캐시 삭제</Text>
          <Text style={styles.settingButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>지원</Text>

        <TouchableOpacity
          style={styles.settingButton}
          onPress={handleContactSupport}
        >
          <Text style={styles.settingButtonText}>문의하기</Text>
          <Text style={styles.settingButtonArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton} onPress={handleOpenTerms}>
          <Text style={styles.settingButtonText}>이용약관</Text>
          <Text style={styles.settingButtonArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingButton}
          onPress={handleOpenPrivacyPolicy}
        >
          <Text style={styles.settingButtonText}>개인정보처리방침</Text>
          <Text style={styles.settingButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>버전</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>빌드</Text>
          <Text style={styles.infoValue}>100</Text>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  settingButtonArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#111827',
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 48,
  },
});

export default SettingsScreen;
