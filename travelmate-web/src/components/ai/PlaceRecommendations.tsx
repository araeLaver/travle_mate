/**
 * AI Place Recommendations Component
 * AI 장소 추천 컴포넌트
 */

import React, { useState, useCallback } from 'react';
import {
  aiRecommendationService,
  PlaceRecommendation,
  PlaceRecommendationRequest,
  isPlaceRecommendationRequestValidationError,
} from '../../services/aiRecommendationService';

interface PlaceRecommendationsProps {
  className?: string;
  onPlaceSelect?: (place: PlaceRecommendation) => void;
}

const PlaceRecommendations: React.FC<PlaceRecommendationsProps> = ({
  className = '',
  onPlaceSelect,
}) => {
  const [recommendations, setRecommendations] = useState<PlaceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [filters, setFilters] = useState({
    radiusKm: 5,
    categories: [] as string[],
    timeOfDay: '',
  });

  const categoryOptions = [
    { value: 'RESTAURANT', label: '맛집', icon: '🍽️' },
    { value: 'CAFE', label: '카페', icon: '☕' },
    { value: 'ATTRACTION', label: '관광지', icon: '🏛️' },
    { value: 'NATURE', label: '자연', icon: '🌲' },
    { value: 'SHOPPING', label: '쇼핑', icon: '🛍️' },
    { value: 'ACTIVITY', label: '액티비티', icon: '🎯' },
  ];

  const timeOptions = [
    { value: '', label: '전체' },
    { value: 'MORNING', label: '오전' },
    { value: 'AFTERNOON', label: '오후' },
    { value: 'EVENING', label: '저녁' },
    { value: 'NIGHT', label: '밤' },
  ];

  // Get current location and fetch recommendations
  const handleGetRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      setHasLocation(true);

      const request: PlaceRecommendationRequest = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusKm: filters.radiusKm,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        timeOfDay: filters.timeOfDay || undefined,
      };

      const data = await aiRecommendationService.getPlaceRecommendations(request);
      setRecommendations(data);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError('위치 권한을 허용해주세요.');
      } else if (isPlaceRecommendationRequestValidationError(err)) {
        setError(err.message);
      } else {
        setError('추천을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Toggle category filter
  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  // Render place card
  const renderPlaceCard = (place: PlaceRecommendation) => {
    const scoreBadge = aiRecommendationService.getAIScoreBadge(place.aiScore);

    return (
      <div
        key={place.placeId}
        onClick={() => onPlaceSelect?.(place)}
        className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-sand-300 dark:border-gray-700 hover:shadow-[0_10px_30px_rgba(16,16,20,0.08)] transition-shadow cursor-pointer"
      >
        {/* Image */}
        {place.imageUrl && (
          <div className="relative h-40 mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
            <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
            <div
              className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium bg-${scoreBadge.color}-500 text-white`}
            >
              {scoreBadge.label}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-ink dark:text-white line-clamp-1">{place.name}</h3>
            <span className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
              {place.distance?.toFixed(1)}km
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {place.description}
          </p>

          {/* Category & Rating */}
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400 rounded-[7px] font-semibold">
              {place.category}
            </span>
            {place.rating > 0 && (
              <span className="flex items-center gap-1 text-rarity-legendary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {place.rating.toFixed(1)}
              </span>
            )}
            {place.reviewCount > 0 && (
              <span className="text-gray-400 dark:text-gray-500">({place.reviewCount})</span>
            )}
          </div>

          {/* Reasons */}
          {place.reasons && place.reasons.length > 0 && (
            <div className="pt-2 border-t border-sand-300 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI 추천 이유:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                {place.reasons.slice(0, 2).map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-primary-500">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex flex-wrap gap-2 pt-1">
            {place.bestTimeToVisit && (
              <span className="text-xs px-2 py-0.5 bg-sand-100 dark:bg-gray-700 text-[#74747F] dark:text-gray-400 rounded-[7px]">
                🕐 {place.bestTimeToVisit}
              </span>
            )}
            {place.estimatedDuration && (
              <span className="text-xs px-2 py-0.5 bg-sand-100 dark:bg-gray-700 text-[#74747F] dark:text-gray-400 rounded-[7px]">
                ⏱️ {place.estimatedDuration}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-[0_10px_30px_rgba(16,16,20,0.06)] p-6 ${className}`}
    >
      {/* Header */}
      <h2 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-6 flex items-center gap-2">
        <span className="text-2xl">📍</span>
        AI 장소 추천
      </h2>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Radius */}
        <div>
          <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
            반경: {filters.radiusKm}km
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={filters.radiusKm}
            onChange={e => setFilters(prev => ({ ...prev, radiusKm: Number(e.target.value) }))}
            className="w-full h-2 bg-[#EDECE8] dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
            카테고리
          </label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map(cat => (
              <button
                key={cat.value}
                onClick={() => handleCategoryToggle(cat.value)}
                className={`px-3 py-1.5 rounded-[10px] text-sm font-bold transition-colors ${
                  filters.categories.includes(cat.value)
                    ? 'bg-ink text-white'
                    : 'bg-sand-100 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-300 hover:bg-sand-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
            시간대
          </label>
          <div className="flex gap-2">
            {timeOptions.map(time => (
              <button
                key={time.value}
                onClick={() => setFilters(prev => ({ ...prev, timeOfDay: time.value }))}
                className={`px-3 py-1.5 rounded-[10px] text-sm font-bold transition-colors ${
                  filters.timeOfDay === time.value
                    ? 'bg-ink text-white'
                    : 'bg-sand-100 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-300 hover:bg-sand-200 dark:hover:bg-gray-700'
                }`}
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Get Recommendations Button */}
      <button
        onClick={handleGetRecommendations}
        disabled={isLoading}
        className="w-full py-3 bg-primary-500 hover:bg-primary-700 text-white rounded-[13px] font-bold shadow-[0_8px_22px_rgba(74,58,255,0.3)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            AI가 분석 중...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            현재 위치에서 추천받기
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-danger/10 dark:bg-red-900/30 text-danger dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Results */}
      {recommendations.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {recommendations.length}개의 장소를 찾았습니다
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map(place => renderPlaceCard(place))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && hasLocation && recommendations.length === 0 && (
        <div className="mt-6 text-center py-8">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500 dark:text-gray-400">조건에 맞는 장소를 찾지 못했습니다.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            검색 반경을 늘리거나 필터를 조정해보세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaceRecommendations;
