/**
 * Settings Screen for TravelMate Mobile
 */

import React, { useState, useEffect } from 'react';
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
import {
  isBiometricAvailable,
  getBiometricType,
  getBiometricLabel,
  authenticate,
  isBiometricEnabled,
  setBiometricEnabled,
  BiometricType,
} from '../services/biometricService';
import { buildWebUrl } from '../services/appConfig';
import { palette, fonts, type, spacing, radii } from '../theme';
import Icon from '../components/icons/Icon';

const TOGGLE_TRACK = { false: palette.outline, true: palette.primary };

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
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
        const enabled = await isBiometricEnabled();
        setBiometricOn(enabled);
      }
    })();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const success = await authenticate('생체 인증을 활성화합니다');
      if (!success) return;
    }
    setBiometricOn(value);
    await setBiometricEnabled(value);
  };

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
    Linking.openURL(buildWebUrl('/privacy'));
  };

  const handleOpenTerms = () => {
    Linking.openURL(buildWebUrl('/terms'));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림</Text>

        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.rowIcon}>
              <Icon name="bell" size={22} color={palette.ink} />
            </View>
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
              trackColor={TOGGLE_TRACK}
              thumbColor={palette.white}
            />
          </View>

          <View style={[styles.settingItem, styles.rowDivider]}>
            <View style={styles.rowIcon}>
              <Icon name="pin" size={22} color={palette.ink} />
            </View>
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
              trackColor={TOGGLE_TRACK}
              thumbColor={palette.white}
              disabled={!pushNotifications}
            />
          </View>

          <View style={[styles.settingItem, styles.rowDivider]}>
            <View style={styles.rowIcon}>
              <Icon name="stamp" size={22} color={palette.ink} />
            </View>
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
              trackColor={TOGGLE_TRACK}
              thumbColor={palette.white}
              disabled={!pushNotifications}
            />
          </View>
        </View>
      </View>

      {/* Security Section */}
      {biometricAvailable && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>보안</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.rowIcon}>
                <Icon name="lock" size={22} color={palette.ink} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{getBiometricLabel(biometricType)}</Text>
                <Text style={styles.settingDescription}>
                  앱 잠금 해제 시 생체 인증을 사용합니다
                </Text>
              </View>
              <Switch
                value={biometricOn}
                onValueChange={handleBiometricToggle}
                trackColor={TOGGLE_TRACK}
                thumbColor={palette.white}
              />
            </View>
          </View>
        </View>
      )}

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>위치</Text>

        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.rowIcon}>
              <Icon name="nav" size={22} color={palette.ink} />
            </View>
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
              trackColor={TOGGLE_TRACK}
              thumbColor={palette.white}
            />
          </View>

          <TouchableOpacity
            style={[styles.settingButton, styles.rowDivider]}
            onPress={handleOpenSystemSettings}
          >
            <View style={styles.rowIcon}>
              <Icon name="gear" size={22} color={palette.ink} />
            </View>
            <Text style={styles.settingButtonText}>시스템 위치 설정</Text>
            <Icon name="right" size={18} color={palette.disabled} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>데이터</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.settingButton} onPress={handleClearCache}>
            <View style={styles.rowIcon}>
              <Icon name="image" size={22} color={palette.ink} />
            </View>
            <Text style={styles.settingButtonText}>캐시 삭제</Text>
            <Icon name="right" size={18} color={palette.disabled} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>지원</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleContactSupport}
          >
            <View style={styles.rowIcon}>
              <Icon name="chat" size={22} color={palette.ink} />
            </View>
            <Text style={styles.settingButtonText}>문의하기</Text>
            <Icon name="right" size={18} color={palette.disabled} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.rowDivider]}
            onPress={handleOpenTerms}
          >
            <View style={styles.rowIcon}>
              <Icon name="cal" size={22} color={palette.ink} />
            </View>
            <Text style={styles.settingButtonText}>이용약관</Text>
            <Icon name="right" size={18} color={palette.disabled} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.rowDivider]}
            onPress={handleOpenPrivacyPolicy}
          >
            <View style={styles.rowIcon}>
              <Icon name="lock" size={22} color={palette.ink} />
            </View>
            <Text style={styles.settingButtonText}>개인정보처리방침</Text>
            <Icon name="right" size={18} color={palette.disabled} />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>

        <View style={styles.card}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>버전</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={[styles.infoItem, styles.rowDivider]}>
            <Text style={styles.infoLabel}>빌드</Text>
            <Text style={styles.infoValue}>100</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.screenH,
  },
  sectionTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: palette.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: palette.background,
    borderRadius: radii.cardLarge,
    overflow: 'hidden',
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  rowIcon: {
    width: 22,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: palette.ink,
  },
  settingDescription: {
    ...type.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  settingButtonText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: palette.ink,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  infoLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: palette.ink,
  },
  infoValue: {
    ...type.caption,
    color: palette.textMuted,
  },
  bottomPadding: {
    height: 48,
  },
});

export default SettingsScreen;
