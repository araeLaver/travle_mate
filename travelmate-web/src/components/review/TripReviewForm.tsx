import React, { useState } from 'react';
import StarRating from './StarRating';
import { CreateReviewDto } from '../../services/reviewService';

interface TripReviewFormProps {
  targetUserId: number;
  targetUserName: string;
  onSubmit: (data: CreateReviewDto) => void;
  isSubmitting: boolean;
  error?: string | null;
}

interface FormState {
  punctualityScore: number;
  mannerScore: number;
  communicationScore: number;
  willTravelAgain: boolean | null;
  comment: string;
}

const INITIAL_FORM: FormState = {
  punctualityScore: 0,
  mannerScore: 0,
  communicationScore: 0,
  willTravelAgain: null,
  comment: '',
};

const TripReviewForm: React.FC<TripReviewFormProps> = ({
  targetUserId,
  targetUserName,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  const setScore = (field: keyof Pick<FormState, 'punctualityScore' | 'mannerScore' | 'communicationScore'>) =>
    (value: number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (form.punctualityScore === 0) {
      setValidationError('시간약속 점수를 선택해주세요.');
      return;
    }
    if (form.mannerScore === 0) {
      setValidationError('매너/예의 점수를 선택해주세요.');
      return;
    }
    if (form.communicationScore === 0) {
      setValidationError('소통 능력 점수를 선택해주세요.');
      return;
    }
    if (form.willTravelAgain === null) {
      setValidationError('재동행 의사를 선택해주세요.');
      return;
    }

    onSubmit({
      targetUserId,
      punctualityScore: form.punctualityScore,
      mannerScore: form.mannerScore,
      communicationScore: form.communicationScore,
      willTravelAgain: form.willTravelAgain,
      comment: form.comment.trim() || undefined,
    });
  };

  const displayError = validationError || error;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      {/* 대상 유저 헤더 */}
      <div className="text-center pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          동행 후기 작성
        </p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
          {targetUserName}
        </h2>
      </div>

      {/* 시간약속 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span>⏰</span>
          <span>시간약속</span>
          <span className="text-red-500">*</span>
        </label>
        <StarRating
          value={form.punctualityScore}
          onChange={setScore('punctualityScore')}
        />
      </div>

      {/* 매너/예의 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span>🤝</span>
          <span>매너 / 예의</span>
          <span className="text-red-500">*</span>
        </label>
        <StarRating
          value={form.mannerScore}
          onChange={setScore('mannerScore')}
        />
      </div>

      {/* 소통 능력 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span>💬</span>
          <span>소통 능력</span>
          <span className="text-red-500">*</span>
        </label>
        <StarRating
          value={form.communicationScore}
          onChange={setScore('communicationScore')}
        />
      </div>

      {/* 재동행 의사 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span>✈️</span>
          <span>재동행 의사</span>
          <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, willTravelAgain: true }))}
            className={[
              'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border',
              form.willTravelAgain === true
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-md shadow-violet-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500',
            ].join(' ')}
          >
            Yes, 또 함께 여행하고 싶어요
          </button>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, willTravelAgain: false }))}
            className={[
              'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border',
              form.willTravelAgain === false
                ? 'bg-gradient-to-r from-gray-500 to-gray-700 text-white border-transparent shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400',
            ].join(' ')}
          >
            No, 아직은 모르겠어요
          </button>
        </div>
      </div>

      {/* 코멘트 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span>📝</span>
          <span>코멘트</span>
          <span className="text-gray-400 dark:text-gray-500 font-normal">(선택)</span>
        </label>
        <textarea
          value={form.comment}
          onChange={e => setForm(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="동행자에 대한 솔직한 후기를 남겨주세요..."
          maxLength={500}
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
        />
        <p className="text-right text-xs text-gray-400 dark:text-gray-500">
          {form.comment.length}/500
        </p>
      </div>

      {/* 에러 메시지 */}
      {displayError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {displayError}
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '제출 중...' : '후기 제출'}
      </button>
    </form>
  );
};

export default TripReviewForm;
