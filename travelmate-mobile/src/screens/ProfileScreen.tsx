/**
 * Profile Screen for TravelMate Mobile
 */

import React, { useState, useCallback } from 'react';
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

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
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
      // TODO: Upload to backend API when ready
      // const formData = new FormData();
      // formData.append('image', { uri, type: 'image/jpeg', name: 'profile.jpg' } as any);
      // await apiClient.put('/users/me/profile-image', formData);
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
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.cameraIcon}>📷</Text>
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

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Collection' as any)}
        >
          <Text style={styles.menuIcon}>🏆</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>내 컬렉션</Text>
            <Text style={styles.menuSubtext}>{user.totalNftsCollected}개의 NFT</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {/* 포인트 내역 페이지 */}}
        >
          <Text style={styles.menuIcon}>💰</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>포인트 내역</Text>
            <Text style={styles.menuSubtext}>{user.totalPoints.toLocaleString()} P</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>설정</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>앱 설정</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {/* 프로필 편집 페이지 */}}
        >
          <Text style={styles.menuIcon}>✏️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>프로필 편집</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {/* 알림 설정 */}}
        >
          <Text style={styles.menuIcon}>🔔</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>알림 설정</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>지원</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>도움말</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📝</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>이용약관</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔒</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>개인정보처리방침</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
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
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraIcon: {
    fontSize: 14,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  nickname: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: '#374151',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#111827',
  },
  menuSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  logoutSection: {
    marginTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },
  bottomPadding: {
    height: 48,
  },
});

export default ProfileScreen;
