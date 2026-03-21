/**
 * User Travel Profile Component
 * AI 분석 사용자 여행 프로필 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import {
  aiRecommendationService,
  UserAnalysis,
  TRAVEL_PERSONAS,
} from '../../services/aiRecommendationService';

interface UserTravelProfileProps {
  className?: string;
}

const UserTravelProfile: React.FC<UserTravelProfileProps> = ({ className = '' }) => {
  const [analysis, setAnalysis] = useState<UserAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiRecommendationService.getUserAnalysis();
      setAnalysis(data);
    } catch (err) {
      setError('분석 데이터를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Score bar component
  const ScoreBar: React.FC<{ label: string; score: number; color: string }> = ({
    label,
    score,
    color,
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {Math.round(score * 100)}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadAnalysis}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            여행 기록이 쌓이면 AI가 분석해드립니다.
          </p>
        </div>
      </div>
    );
  }

  const persona = TRAVEL_PERSONAS[analysis.travelPersona] || {
    title: analysis.travelPersona,
    description: '당신만의 독특한 여행 스타일',
    emoji: '🌍',
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <span className="text-2xl">🎯</span>
        나의 여행 프로필
      </h2>

      {/* Persona */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl mb-3">
          {persona.emoji}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{persona.title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{persona.description}</p>
      </div>

      {/* Travel Scores */}
      <div className="space-y-4 mb-8">
        <h4 className="font-semibold text-gray-900 dark:text-white">여행 성향</h4>
        <ScoreBar label="모험 지수" score={analysis.adventureScore} color="bg-red-500" />
        <ScoreBar label="문화 지수" score={analysis.cultureScore} color="bg-purple-500" />
        <ScoreBar label="휴양 지수" score={analysis.relaxationScore} color="bg-green-500" />
        <ScoreBar label="사교 지수" score={analysis.socialScore} color="bg-blue-500" />
      </div>

      {/* Top Interests */}
      {analysis.topInterests && analysis.topInterests.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">관심사 Top</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.topInterests.map((interest, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  idx === 0
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600'
                    : idx === 1
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500'
                      : idx === 2
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-600'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {idx < 3 && <span className="mr-1">{['🥇', '🥈', '🥉'][idx]}</span>}
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Destinations */}
      {analysis.preferredDestinations && analysis.preferredDestinations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">선호 여행지</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.preferredDestinations.map((dest, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                📍 {dest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Predicted Next Destination */}
      {analysis.predictedNextDestination && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔮</span>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI 예측 다음 여행지</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {analysis.predictedNextDestination}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTravelProfile;
