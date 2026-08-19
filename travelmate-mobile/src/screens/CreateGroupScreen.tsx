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
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="그룹 이름을 입력하세요"
            placeholderTextColor="#9CA3AF"
            maxLength={GROUP_NAME_MAX_LENGTH}
          />
          <Text style={styles.charCount}>{name.length}/{GROUP_NAME_MAX_LENGTH}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="그룹에 대한 설명을 입력하세요"
            placeholderTextColor="#9CA3AF"
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
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="예: 제주도, 도쿄, 파리"
            placeholderTextColor="#9CA3AF"
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
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldHint}>종료일</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
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
            <ActivityIndicator color="#FFFFFF" />
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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  fieldHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default CreateGroupScreen;
