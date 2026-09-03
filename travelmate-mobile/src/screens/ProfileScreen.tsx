/**
 * Profile Screen for TravelMate Mobile
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { takePhoto, pickImage, showImageSourcePicker } from '../services/cameraService';
import apiClient from '../services/apiClient';
import Icon, { IconName } from '../components/icons/Icon';
import { useTheme } from '../contexts/ThemeContext';
import { ThemePalette, fonts, type, spacing, radii } from '../theme';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface MenuRowProps {
  icon: IconName;
  label: string;
  subtext?: string;
  onPress?: () => void;
  palette: ThemePalette;
  styles: ReturnType<typeof createStyles>;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, label, subtext, onPress, palette, styles }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconTile}>
      <Icon name={icon} size={20} color={palette.textSecondary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuText}>{label}</Text>
      {subtext ? <Text style={styles.menuSubtext}>{subtext}</Text> : null}
    </View>
    <Icon name="right" size={18} color={palette.disabled} />
  </TouchableOpacity>
);

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { user, logout, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleChangeProfilePhoto = () => {
    showImageSourcePicker(
      async () => {
        const photo = await takePhoto();
        if (photo) await uploadProfileImage(photo.uri);
      },
      async () => {
        const photo = await pickImage();
        if (photo) await uploadProfileImage(photo.uri);
      },
    );
  };

  const uploadProfileImage = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const fileName = `profile_${Date.now()}.jpg`;
      await apiClient.uploadFile('/files/upload/profile', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      });
      await refreshUser();
      Alert.alert('완료', '프로필 사진이 변경되었습니다.');
    } catch (error) {
      Alert.alert('오류', '프로필 사진 변경에 실패했습니다.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, [refreshUser]);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.log('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleChangeProfilePhoto} disabled={uploadingPhoto}>
            {user.profileImageUrl ? (
              <Image
                source={{ uri: user.profileImageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitial}>
                  {user.nickname?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.cameraButton}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={palette.onPrimary} />
              ) : (
                <Icon name="camera" size={14} color={palette.onPrimary} />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{user.nickname}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalNftsCollected}</Text>
            <Text style={styles.statLabel}>수집 NFT</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>포인트</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDate(user.createdAt).split(' ')[0]}
            </Text>
            <Text style={styles.statLabel}>가입일</Text>
          </View>
        </View>
      </View>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>내 활동</Text>

        <MenuRow
          palette={palette}
          styles={styles}
          icon="crown"
          label="내 컬렉션"
          subtext={`${user.totalNftsCollected}개의 NFT`}
          onPress={() => navigation.navigate('Collection' as any)}
        />

        <MenuRow
          palette={palette}
          styles={styles}
          icon="wallet"
          label="포인트 내역"
          subtext={`${user.totalPoints.toLocaleString()} P`}
          onPress={() => {/* 포인트 내역 페이지 */}}
        />
      </View>

      {/* Settings Section */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>설정</Text>

        <MenuRow
          palette={palette}
          styles={styles}
          icon="gear"
          label="앱 설정"
          onPress={() => navigation.navigate('Settings')}
        />

        <MenuRow
          palette={palette}
          styles={styles}
          icon="user"
          label="프로필 편집"
          onPress={() => {/* 프로필 편집 페이지 */}}
        />

        <MenuRow
          palette={palette}
          styles={styles}
          icon="bell"
          label="알림 설정"
          onPress={() => {/* 알림 설정 */}}
        />
      </View>

      {/* Support Section */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>지원</Text>

        <MenuRow palette={palette} styles={styles} icon="chat" label="도움말" />

        <MenuRow palette={palette} styles={styles} icon="stamp" label="이용약관" />

        <MenuRow palette={palette} styles={styles} icon="lock" label="개인정보처리방침" />
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Fryndo v1.0.0</Text>
      </View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  loadingText: {
    ...type.body,
    color: palette.textTertiary,
  },
  header: {
    backgroundColor: palette.background,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.screenH,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  profileImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  profileImagePlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: palette.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.background,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  nickname: {
    fontFamily: fonts.extrabold,
    fontSize: 21,
    lineHeight: 27,
    color: palette.ink,
  },
  email: {
    ...type.bodySmall,
    color: palette.textTertiary,
    marginTop: 2,
  },
  bio: {
    ...type.bodySmall,
    fontFamily: fonts.medium,
    color: palette.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: radii.input,
    padding: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...type.statNumber,
    color: palette.ink,
  },
  statLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 15,
    color: palette.textMuted,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: palette.outline,
    marginHorizontal: spacing.sm,
  },
  menuSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.screenH,
  },
  menuTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    lineHeight: 16,
    color: palette.textMuted,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: spacing.md,
    borderRadius: radii.card,
    marginBottom: spacing.sm,
  },
  menuIconTile: {
    width: 40,
    height: 40,
    borderRadius: radii.iconButton,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: palette.ink,
  },
  menuSubtext: {
    ...type.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: 32,
    paddingHorizontal: spacing.screenH,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: palette.errorBg,
    height: 46,
    paddingHorizontal: 32,
    borderRadius: radii.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    ...type.button,
    color: palette.error,
  },
  versionText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: palette.placeholder,
    marginTop: spacing.lg,
  },
  bottomPadding: {
    height: 48,
  },
  });

export default ProfileScreen;
