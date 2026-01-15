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
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { chatService } from '../services/chatService';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateGroup'>;

interface Props {
  navigation: CreateGroupScreenNavigationProp;
}

const MAX_MEMBERS_OPTIONS = [5, 10, 20, 50, 100];

const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('입력 오류', '그룹 이름을 입력해주세요.');
      return false;
    }
    if (name.trim().length < 2) {
      Alert.alert('입력 오류', '그룹 이름은 2자 이상이어야 합니다.');
      return false;
    }
    if (name.trim().length > 50) {
      Alert.alert('입력 오류', '그룹 이름은 50자 이하여야 합니다.');
      return false;
    }
    if (description.length > 500) {
      Alert.alert('입력 오류', '설명은 500자 이하여야 합니다.');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const group = await chatService.createGroup({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        maxMembers,
      });

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
            maxLength={50}
          />
          <Text style={styles.charCount}>{name.length}/50</Text>
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
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Public/Private Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.label}>공개 그룹</Text>
              <Text style={styles.toggleDescription}>
                {isPublic
                  ? '누구나 그룹을 검색하고 참여할 수 있습니다'
                  : '초대를 통해서만 참여할 수 있습니다'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={isPublic ? '#3B82F6' : '#F3F4F6'}
            />
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

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 그룹 생성 팁</Text>
          <Text style={styles.tipItem}>• 명확한 그룹 이름을 사용하세요</Text>
          <Text style={styles.tipItem}>• 그룹의 목적을 설명에 작성하세요</Text>
          <Text style={styles.tipItem}>• 여행 지역이나 테마를 포함하면 좋아요</Text>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
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
  tipsSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 22,
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
