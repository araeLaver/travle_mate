/**
 * Create Group Screen for TravelMate Mobile
 * Form for creating a new travel group
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService } from '../services/chatService';
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_DESTINATION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  MAX_MEMBERS_OPTIONS,
  PURPOSE_OPTIONS,
  getCreateGroupValidationMessage,
  isoDateDaysFromNow,
  toCreateGroupRequest,
} from './createGroupForm';
import type { Purpose } from './createGroupForm';
import { palette, fonts, type, spacing, radii } from '../theme';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateGroup'>;

interface Props {
  navigation: CreateGroupScreenNavigationProp;
}

const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(isoDateDaysFromNow(7));
  const [endDate, setEndDate] = useState(isoDateDaysFromNow(10));
  const [purpose, setPurpose] = useState<Purpose>('LEISURE');
  const [maxMembers, setMaxMembers] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const message = getCreateGroupValidationMessage({
      name,
      description,
      destination,
      startDate,
      endDate,
      purpose,
      maxMembers,
    });
    if (message) {
      Alert.alert('입력 오류', message);
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const group = await chatService.createGroup(toCreateGroupRequest({
        name,
        description,
        destination,
        startDate,
        endDate,
        purpose,
        maxMembers,
      }));

      Alert.alert('성공', '그룹이 생성되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            navigation.replace('ChatRoom', { groupId: group.id, groupName: group.name });
          },
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || '그룹 생성에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Name */}
        <View style={styles.section}>
          <Text style={styles.label}>그룹 이름 *</Text>
          <TextInput
            style={[styles.input, focusedField === 'name' && styles.inputFocused]}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="그룹 이름을 입력하세요"
            placeholderTextColor={palette.placeholder}
            maxLength={GROUP_NAME_MAX_LENGTH}
          />
          <Text style={styles.charCount}>{name.length}/{GROUP_NAME_MAX_LENGTH}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              focusedField === 'description' && styles.inputFocused,
            ]}
            value={description}
            onChangeText={setDescription}
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
            placeholder="그룹에 대한 설명을 입력하세요"
            placeholderTextColor={palette.placeholder}
            multiline
            numberOfLines={4}
            maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {description.length}/{GROUP_DESCRIPTION_MAX_LENGTH}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>목적지 *</Text>
          <TextInput
            style={[styles.input, focusedField === 'destination' && styles.inputFocused]}
            value={destination}
            onChangeText={setDestination}
            onFocus={() => setFocusedField('destination')}
            onBlur={() => setFocusedField(null)}
            placeholder="예: 제주도, 도쿄, 파리"
            placeholderTextColor={palette.placeholder}
            maxLength={GROUP_DESTINATION_MAX_LENGTH}
          />
          <Text style={styles.charCount}>
            {destination.length}/{GROUP_DESTINATION_MAX_LENGTH}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>여행 기간 *</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldHint}>시작일</Text>
              <TextInput
                style={[styles.input, focusedField === 'startDate' && styles.inputFocused]}
                value={startDate}
                onChangeText={setStartDate}
                onFocus={() => setFocusedField('startDate')}
                onBlur={() => setFocusedField(null)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={palette.placeholder}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldHint}>종료일</Text>
              <TextInput
                style={[styles.input, focusedField === 'endDate' && styles.inputFocused]}
                value={endDate}
                onChangeText={setEndDate}
                onFocus={() => setFocusedField('endDate')}
                onBlur={() => setFocusedField(null)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={palette.placeholder}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>여행 목적</Text>
          <View style={styles.optionsRow}>
            {PURPOSE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  purpose === option.value && styles.optionButtonActive,
                ]}
                onPress={() => setPurpose(option.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    purpose === option.value && styles.optionButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max Members */}
        <View style={styles.section}>
          <Text style={styles.label}>최대 인원</Text>
          <View style={styles.optionsRow}>
            {MAX_MEMBERS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  maxMembers === option && styles.optionButtonActive,
                ]}
                onPress={() => setMaxMembers(option)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    maxMembers === option && styles.optionButtonTextActive,
                  ]}
                >
                  {option}명
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <Text style={styles.createButtonText}>그룹 만들기</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenH,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  label: {
    ...type.bodySmall,
    fontFamily: fonts.bold,
    color: palette.ink,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radii.input,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: palette.ink,
  },
  inputFocused: {
    borderColor: palette.primary,
    backgroundColor: palette.background,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  charCount: {
    ...type.caption,
    color: palette.placeholder,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  fieldHint: {
    ...type.caption,
    color: palette.textTertiary,
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.chip,
    backgroundColor: palette.surface,
  },
  optionButtonActive: {
    backgroundColor: palette.ink,
  },
  optionButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: palette.textSecondary,
  },
  optionButtonTextActive: {
    color: palette.white,
  },
  footer: {
    padding: spacing.screenH,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.screenH,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
  },
  createButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.button,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    ...type.button,
    color: palette.white,
  },
});

export default CreateGroupScreen;
