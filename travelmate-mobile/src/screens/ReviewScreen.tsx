/**
 * Review Write Screen — post-travel mutual review
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiClient } from '../services/apiClient';
import {
  buildTravelReviewPayload,
  calculateTravelReviewAverage,
  hasCompleteTravelReviewRatings,
  TravelReviewRatingKey,
  TravelReviewRatings,
} from '../services/travelReviewPayload';

type ReviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Review'
>;

type ReviewScreenRouteProp = RouteProp<RootStackParamList, 'Review'>;

interface Props {
  navigation: ReviewScreenNavigationProp;
  route: ReviewScreenRouteProp;
}

const CRITERIA: Array<{
  key: TravelReviewRatingKey;
  label: string;
  description: string;
}> = [
  { key: 'punctuality', label: '시간 약속', description: '약속 시간을 잘 지켰나요?' },
  { key: 'manner', label: '매너', description: '함께 있을 때 매너가 좋았나요?' },
  { key: 'communication', label: '소통', description: '의사소통이 원활했나요?' },
  { key: 'retravelWillingness', label: '재동행 의사', description: '다시 함께 여행하고 싶은가요?' },
];

const ReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { matchId, targetUserId, targetUserNickname } = route.params;
  const targetDisplayName = targetUserNickname || '상대방';
  const [ratings, setRatings] = useState<TravelReviewRatings>({
    punctuality: 0,
    manner: 0,
    communication: 0,
    retravelWillingness: 0,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overallRating = calculateTravelReviewAverage(ratings);

  const handleRating = (key: TravelReviewRatingKey, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const matchRequestId = Number(matchId);
    const revieweeId = Number(targetUserId);

    if (!Number.isInteger(matchRequestId) || !Number.isInteger(revieweeId)) {
      Alert.alert('오류', '리뷰 대상 정보를 확인할 수 없습니다. 매칭 목록에서 다시 시도해주세요.');
      return;
    }

    if (!hasCompleteTravelReviewRatings(ratings)) {
      Alert.alert('알림', '모든 항목을 평가해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildTravelReviewPayload({
        matchId: matchRequestId,
        revieweeId,
        ratings,
        comment,
      });
      await apiClient.post('/reviews', payload);
      Alert.alert('완료', '리뷰가 등록되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('오류', '리뷰 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRow = (key: TravelReviewRatingKey) => {
    const currentRating = ratings[key];
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(key, star)}
            style={styles.starButton}
          >
            <Text
              style={[
                styles.star,
                star <= currentRating && styles.starFilled,
              ]}
            >
              {star <= currentRating ? '\u2605' : '\u2606'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {targetDisplayName}님과의 동행은 어떠셨나요?
          </Text>
          <Text style={styles.subtitle}>
            솔직한 리뷰는 다른 여행자에게 도움이 됩니다
          </Text>
        </View>

        {/* Rating Criteria */}
        {CRITERIA.map((criterion) => (
          <View key={criterion.key} style={styles.criterionCard}>
            <View style={styles.criterionHeader}>
              <Text style={styles.criterionLabel}>{criterion.label}</Text>
              <Text style={styles.criterionDesc}>{criterion.description}</Text>
            </View>
            {renderStarRow(criterion.key)}
          </View>
        ))}

        {/* Overall Score */}
        <View style={styles.overallCard}>
          <Text style={styles.overallLabel}>종합 평점</Text>
          <Text style={styles.overallValue}>
            {overallRating > 0 ? overallRating.toFixed(1) : '-'}
          </Text>
        </View>

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>한 줄 리뷰 (선택)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="함께한 여행에 대한 소감을 남겨주세요"
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/300</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? '등록 중...' : '리뷰 등록'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  criterionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  criterionHeader: {
    marginBottom: 10,
  },
  criterionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  criterionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 28,
    color: '#D1D5DB',
  },
  starFilled: {
    color: '#F59E0B',
  },
  overallCard: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  overallValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  commentSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 48,
  },
});

export default ReviewScreen;
