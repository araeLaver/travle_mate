/**
 * AI Travel Planner Component
 * AI 여행 일정 생성 컴포넌트
 */

import React, { useState } from 'react';
import {
  aiRecommendationService,
  ItineraryRequest,
  ItineraryResponse,
  DayPlan,
  Activity,
  TRAVEL_STYLES,
  BUDGET_RANGES,
} from '../../services/aiRecommendationService';

interface TravelPlannerProps {
  className?: string;
  onItineraryGenerated?: (itinerary: ItineraryResponse) => void;
}

const TravelPlanner: React.FC<TravelPlannerProps> = ({ className = '', onItineraryGenerated }) => {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [formData, setFormData] = useState<ItineraryRequest>({
    destination: '',
    startDate: '',
    endDate: '',
    travelStyle: '',
    budgetRange: '',
    interests: [],
    preferences: [],
    groupSize: 1,
  });
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const interestOptions = [
    '맛집',
    '카페',
    '쇼핑',
    '역사',
    '자연',
    '액티비티',
    '야경',
    '사진',
    '축제',
    '박물관',
    '해변',
    '등산',
  ];

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle interest toggle
  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...(prev.interests || []), interest],
    }));
  };

  // Generate itinerary
  const handleGenerate = async () => {
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      setError('목적지와 여행 날짜를 입력해주세요.');
      return;
    }

    setError(null);
    setStep('loading');

    try {
      const result = await aiRecommendationService.generateItinerary(formData);
      setItinerary(result);
      setStep('result');
      onItineraryGenerated?.(result);
    } catch (err) {
      setError('일정 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      setStep('form');
    }
  };

  // Reset form
  const handleReset = () => {
    setStep('form');
    setItinerary(null);
    setSelectedDay(0);
  };

  // Render form
  const renderForm = () => (
    <div className="space-y-6">
      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          목적지 *
        </label>
        <input
          type="text"
          name="destination"
          value={formData.destination}
          onChange={handleInputChange}
          placeholder="예: 제주도, 부산, 도쿄"
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            출발일 *
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            도착일 *
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            min={formData.startDate || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Travel Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          여행 스타일
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TRAVEL_STYLES.map(style => (
            <button
              key={style.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, travelStyle: style.value }))}
              className={`p-2 rounded-lg text-center transition-colors ${
                formData.travelStyle === style.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{style.icon}</span>
              <p className="text-xs mt-1">{style.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          예산
        </label>
        <div className="grid grid-cols-4 gap-2">
          {BUDGET_RANGES.map(budget => (
            <button
              key={budget.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, budgetRange: budget.value }))}
              className={`p-2 rounded-lg text-center transition-colors ${
                formData.budgetRange === budget.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <p className="font-medium">{budget.label}</p>
              <p className="text-xs opacity-70">{budget.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          관심사
        </label>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map(interest => (
            <button
              key={interest}
              type="button"
              onClick={() => handleInterestToggle(interest)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                formData.interests?.includes(interest)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Group Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          인원 수
        </label>
        <select
          name="groupSize"
          value={formData.groupSize}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <option key={n} value={n}>
              {n}명
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        AI 일정 생성하기
      </button>
    </div>
  );

  // Render loading
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-center">
        AI가 최적의 여행 일정을 생성하고 있습니다...
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">약 10-20초 정도 소요됩니다</p>
    </div>
  );

  // Render activity
  const renderActivity = (activity: Activity, index: number) => (
    <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex-shrink-0 w-16 text-center">
        <span className="text-sm font-medium text-blue-500">{activity.time}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{activity.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            {activity.category}
          </span>
          {activity.durationMinutes && (
            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
              {aiRecommendationService.formatDuration(activity.durationMinutes)}
            </span>
          )}
          {activity.estimatedCost && (
            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
              {aiRecommendationService.formatCurrency(activity.estimatedCost)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Render day plan
  const renderDayPlan = (dayPlan: DayPlan) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          Day {dayPlan.dayNumber}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {new Date(dayPlan.date).toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </span>
        {dayPlan.theme && (
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
            {dayPlan.theme}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {dayPlan.activities.map((activity, idx) => renderActivity(activity, idx))}
      </div>
      {dayPlan.notes && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
          <span className="font-medium">Tip:</span> {dayPlan.notes}
        </div>
      )}
    </div>
  );

  // Render result
  const renderResult = () => {
    if (!itinerary) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {itinerary.destination} 여행 일정
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {new Date(itinerary.startDate).toLocaleDateString('ko-KR')} -{' '}
            {new Date(itinerary.endDate).toLocaleDateString('ko-KR')} (
            {aiRecommendationService.calculateTripDays(itinerary.startDate, itinerary.endDate)}일)
          </p>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{itinerary.summary}</p>
        </div>

        {/* Budget Estimate */}
        {itinerary.budgetEstimate && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">예상 비용</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">숙박</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {aiRecommendationService.formatCurrency(
                    itinerary.budgetEstimate.accommodationEstimate
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">식비</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {aiRecommendationService.formatCurrency(itinerary.budgetEstimate.foodEstimate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">교통</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {aiRecommendationService.formatCurrency(
                    itinerary.budgetEstimate.transportationEstimate
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">액티비티</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {aiRecommendationService.formatCurrency(
                    itinerary.budgetEstimate.activitiesEstimate
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">총 예상 비용</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {aiRecommendationService.formatCurrency(itinerary.budgetEstimate.totalEstimate)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {itinerary.dayPlans.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDay(idx)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedDay === idx
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Day {idx + 1}
            </button>
          ))}
        </div>

        {/* Day plan content */}
        {itinerary.dayPlans[selectedDay] && renderDayPlan(itinerary.dayPlans[selectedDay])}

        {/* Tips */}
        {itinerary.tips && itinerary.tips.length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">여행 팁</h3>
            <ul className="space-y-1">
              {itinerary.tips.map((tip, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                >
                  <span className="text-blue-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          새 일정 만들기
        </button>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <span className="text-2xl">✈️</span>
        AI 여행 플래너
      </h2>
      {step === 'form' && renderForm()}
      {step === 'loading' && renderLoading()}
      {step === 'result' && renderResult()}
    </div>
  );
};

export default TravelPlanner;
