/**
 * Camera & Image Picker Service
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

const IMAGE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      '카메라 권한 필요',
      '사진을 촬영하려면 카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
    );
    return false;
  }
  return true;
}

async function ensureGalleryPermission(): Promise<boolean> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '사진 접근 권한 필요',
        '갤러리에서 사진을 선택하려면 접근 권한이 필요합니다.',
      );
      return false;
    }
  }
  return true;
}

export async function takePhoto(options?: Partial<ImagePicker.ImagePickerOptions>): Promise<ImageResult | null> {
  const hasPermission = await ensureCameraPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    ...IMAGE_OPTIONS,
    ...options,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    base64: asset.base64 ?? undefined,
  };
}

export async function pickImage(options?: Partial<ImagePicker.ImagePickerOptions>): Promise<ImageResult | null> {
  const hasPermission = await ensureGalleryPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    ...IMAGE_OPTIONS,
    ...options,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    base64: asset.base64 ?? undefined,
  };
}

export function showImageSourcePicker(
  onCamera: () => void,
  onGallery: () => void,
): void {
  Alert.alert('사진 선택', '사진을 어디에서 가져올까요?', [
    { text: '카메라', onPress: onCamera },
    { text: '갤러리', onPress: onGallery },
    { text: '취소', style: 'cancel' },
  ]);
}
