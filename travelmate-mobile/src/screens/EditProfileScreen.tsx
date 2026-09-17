/**
 * Edit Profile Screen for 두리메이트
 *
 * 동행 매칭은 여행 스타일·나이·자기소개로 점수를 낸다. 이 화면이 없으면 사용자가
 * 그 값을 채울 방법이 없어 모든 추천이 빈 프로필끼리 비교하는 꼴이 된다.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { authService, TravelStyle, Gender } from '../services/authService';
import { ThemePalette, fonts, type, spacing, radii } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

const TRAVEL_STYLES: { value: TravelStyle; label: string }[] = [
  { value: 'ADVENTURE', label: '모험' },
  { value: 'CULTURE', label: '문화' },
  { value: 'FOOD', label: '미식' },
  { value: 'RELAXATION', label: '휴양' },
  { value: 'NATURE', label: '자연' },
  { value: 'SHOPPING', label: '쇼핑' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: 'OTHER', label: '선택 안 함' },
];

const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { user, refreshUser } = useAuth();

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState<Gender | undefined>(user?.gender);
  const [travelStyle, setTravelStyle] = useState<TravelStyle | undefined>(user?.travelStyle);
  const [matchingEnabled, setMatchingEnabled] = useState(Boolean(user?.isMatchingEnabled));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      Alert.alert('오류', '닉네임은 2~20자 사이로 입력해주세요.');
      return;
    }
    if (!NICKNAME_PATTERN.test(trimmedNickname)) {
      Alert.alert('오류', '닉네임은 한글, 영문, 숫자, 언더스코어만 사용할 수 있습니다.');
      return;
    }

    let parsedAge: number | undefined;
    if (age.trim()) {
      parsedAge = Number(age.trim());
      if (!Number.isInteger(parsedAge) || parsedAge < 14 || parsedAge > 120) {
        Alert.alert('오류', '나이는 14~120 사이의 숫자로 입력해주세요.');
        return;
      }
    }

    setIsSaving(true);
    try {
      await authService.updateProfile({
        nickname: trimmedNickname,
        bio: bio.trim(),
        age: parsedAge,
        gender,
        travelStyle,
        isMatchingEnabled: matchingEnabled,
      });
      await refreshUser();
      Alert.alert('저장 완료', '프로필이 저장되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('저장 실패', error.message || '프로필 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>닉네임</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="2~20자 닉네임"
        placeholderTextColor={palette.textMuted}
        maxLength={20}
      />

      <Text style={styles.sectionLabel}>자기소개</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={bio}
        onChangeText={setBio}
        placeholder="어떤 여행을 좋아하는지 알려주세요"
        placeholderTextColor={palette.textMuted}
        multiline
        maxLength={500}
      />

      <Text style={styles.sectionLabel}>나이</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="선택 입력"
        placeholderTextColor={palette.textMuted}
        keyboardType="number-pad"
        maxLength={3}
      />

      <Text style={styles.sectionLabel}>성별</Text>
      <View style={styles.chipRow}>
        {GENDERS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, gender === option.value && styles.chipSelected]}
            onPress={() => setGender(gender === option.value ? undefined : option.value)}
          >
            <Text style={[styles.chipText, gender === option.value && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>여행 스타일</Text>
      <Text style={styles.sectionHint}>동행 추천에 쓰입니다</Text>
      <View style={styles.chipRow}>
        {TRAVEL_STYLES.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, travelStyle === option.value && styles.chipSelected]}
            onPress={() =>
              setTravelStyle(travelStyle === option.value ? undefined : option.value)
            }
          >
            <Text
              style={[styles.chipText, travelStyle === option.value && styles.chipTextSelected]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchTexts}>
          <Text style={styles.switchLabel}>동행 매칭 참여</Text>
          <Text style={styles.switchHint}>
            켜면 다른 여행자에게 내 프로필이 추천되고, 나도 추천을 받습니다
          </Text>
        </View>
        <Switch
          value={matchingEnabled}
          onValueChange={setMatchingEnabled}
          trackColor={{ false: palette.outline, true: palette.primary }}
          thumbColor={palette.white}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color={palette.onPrimary} />
        ) : (
          <Text style={styles.saveButtonText}>저장</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.surface,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    sectionLabel: {
      ...type.bodySmall,
      fontFamily: fonts.bold,
      color: palette.ink,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    sectionHint: {
      ...type.caption,
      color: palette.textMuted,
      marginTop: -spacing.xs,
      marginBottom: spacing.sm,
    },
    input: {
      ...type.body,
      backgroundColor: palette.surfaceAlt,
      borderRadius: radii.input,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: palette.ink,
    },
    multiline: {
      minHeight: 110,
      textAlignVertical: 'top',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.chip,
      backgroundColor: palette.surfaceAlt,
    },
    chipSelected: {
      backgroundColor: palette.ink,
    },
    chipText: {
      ...type.bodySmall,
      color: palette.textSecondary,
    },
    chipTextSelected: {
      color: palette.white,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingVertical: spacing.md,
    },
    switchTexts: {
      flex: 1,
      paddingRight: spacing.md,
    },
    switchLabel: {
      ...type.bodySmall,
      fontFamily: fonts.bold,
      color: palette.ink,
    },
    switchHint: {
      ...type.caption,
      color: palette.textMuted,
      marginTop: 2,
    },
    saveButton: {
      marginTop: spacing.xl,
      borderRadius: radii.button,
      backgroundColor: palette.primary,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      ...type.body,
      fontFamily: fonts.bold,
      color: palette.onPrimary,
    },
  });

export default EditProfileScreen;
