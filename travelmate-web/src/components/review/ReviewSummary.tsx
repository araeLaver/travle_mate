import React from 'react';
import { useUserReviews } from '../../hooks/useReview';
import StarRating from './StarRating';

interface ReviewSummaryProps {
  userId: number;
}

interface ScoreBarProps {
  label: string;
  icon: string;
  value: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, icon, value }) => {
  const pct = Math.round((value / 5) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-base w-5 shrink-0">{icon}</span>
      <span className="text-sm text-gray-600 dark:text-gray-400 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
};

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ userId }) => {
  const { data, isLoading, isError } = useUserReviews(userId);

  if (isLoading) {
    return (
      <div className="p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  const { avgPunctuality, avgManner, avgCommunication, willTravelAgainRatio, totalCount, overallAvg } = data;

  if (totalCount === 0) {
    return (
      <div className="p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          ⭐ 동행 평가
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          아직 동행 후기가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          ⭐ 동행 평가
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {totalCount}개의 후기
        </span>
      </div>

      {/* 종합 평점 */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {overallAvg.toFixed(1)}
        </span>
        <div className="flex flex-col gap-1">
          <StarRating value={Math.round(overallAvg)} onChange={() => undefined} readOnly size={5} />
          <span className="text-xs text-gray-400 dark:text-gray-500">종합 평점</span>
        </div>
      </div>

      {/* 세부 항목 */}
      <div className="space-y-2.5">
        <ScoreBar icon="⏰" label="시간약속" value={avgPunctuality} />
        <ScoreBar icon="🤝" label="매너/예의" value={avgManner} />
        <ScoreBar icon="💬" label="소통" value={avgCommunication} />
      </div>

      {/* 재동행 의사 */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
          <span>✈️</span>
          <span>재동행 의사</span>
        </span>
        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
          {Math.round(willTravelAgainRatio * 100)}%
        </span>
      </div>
    </div>
  );
};

export default ReviewSummary;
