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
  isItineraryRequestValidationError,
} from '../../services/aiRecommendationService';

interface TravelPlannerProps {
  className?: string;
  onItineraryGenerated?: (itinerary: ItineraryResponse) => void;
}

const formatDateInput = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
    setFormData(prev => ({
      ...prev,
      [name]: name === 'groupSize' ? Number(value) : value,
    }));
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
      setError(
        isItineraryRequestValidationError(err)
          ? err.message
          : '일정 생성 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
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
        <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
          목적지 *
        </label>
        <input
          type="text"
          name="destination"
          value={formData.destination}
          onChange={handleInputChange}
          placeholder="예: 제주도, 부산, 도쿄"
          className="w-full px-4 py-2 bg-sand-100 border border-transparent rounded-[13px] text-ink placeholder-[#9A9AA4] dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
            출발일 *
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            min={formatDateInput()}
            className="w-full px-4 py-2 bg-sand-100 border border-transparent rounded-[13px] text-ink placeholder-[#9A9AA4] dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
            도착일 *
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            min={formData.startDate || formatDateInput()}
            className="w-full px-4 py-2 bg-sand-100 border border-transparent rounded-[13px] text-ink placeholder-[#9A9AA4] dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Travel Style */}
      <div>
        <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
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
                  ? 'bg-ink text-white'
                  : 'bg-sand-100 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-300 hover:bg-sand-200 dark:hover:bg-gray-700'
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
        <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
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
                  ? 'bg-ink text-white'
                  : 'bg-sand-100 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-300 hover:bg-sand-200 dark:hover:bg-gray-700'
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
        <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
          관심사
        </label>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map(interest => (
            <button
              key={interest}
              type="button"
              onClick={() => handleInterestToggle(interest)}
              className={`px-3 py-1.5 rounded-[10px] text-sm font-bold transition-colors ${
                formData.interests?.includes(interest)
                  ? 'bg-ink text-white'
                  : 'bg-sand-100 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-300 hover:bg-sand-200 dark:hover:bg-gray-700'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Group Size */}
      <div>
        <label className="block text-xs font-extrabold tracking-wide text-[#8A8A95] dark:text-gray-300 mb-2">
          인원 수
        </label>
        <select
          name="groupSize"
          value={formData.groupSize}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-sand-100 border border-transparent rounded-[13px] text-ink placeholder-[#9A9AA4] dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500"
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
        <div className="p-3 bg-danger/10 dark:bg-red-900/30 text-danger dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        className="w-full py-3 bg-primary-500 hover:bg-primary-700 text-white rounded-[13px] font-bold shadow-[0_8px_22px_rgba(74,58,255,0.3)] transition-colors"
      >
        AI 일정 생성하기
      </button>
    </div>
  );

  // Render loading
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-center">
        AI가 최적의 여행 일정을 생성하고 있습니다...
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">약 10-20초 정도 소요됩니다</p>
    </div>
  );

  // Render activity
  const renderActivity = (activity: Activity, index: number) => (
    <div key={index} className="flex gap-4 p-4 bg-sand-100 dark:bg-gray-800 rounded-[14px]">
      <div className="flex-shrink-0 w-16 text-center">
        <span className="text-sm font-bold text-primary-500">{activity.time}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-ink dark:text-white">{activity.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400 rounded-[7px] font-semibold">
            {activity.category}
          </span>
          {activity.durationMinutes && (
            <span className="text-xs px-2 py-0.5 bg-sand-200 dark:bg-gray-700 text-[#74747F] dark:text-gray-300 rounded-[7px]">
              {aiRecommendationService.formatDuration(activity.durationMinutes)}
            </span>
          )}
          {activity.estimatedCost && (
            <span className="text-xs px-2 py-0.5 bg-success/10 dark:bg-green-900/30 text-success dark:text-green-300 rounded-[7px]">
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
        <span className="text-lg font-extrabold text-ink dark:text-white">
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
          <span className="px-2 py-0.5 bg-rarity-epic/10 dark:bg-purple-900/30 text-rarity-epic dark:text-purple-300 rounded-[7px] text-sm font-semibold">
            {dayPlan.theme}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {dayPlan.activities.map((activity, idx) => renderActivity(activity, idx))}
      </div>
      {dayPlan.notes && (
        <div className="p-3 bg-rarity-legendary/10 dark:bg-yellow-900/20 text-rarity-legendary dark:text-yellow-200 rounded-lg text-sm">
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
          <h2 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white">
            {itinerary.destination} 여행 일정
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {new Date(itinerary.startDate).toLocaleDateString('ko-KR')} -{' '}
            {new Date(itinerary.endDate).toLocaleDateString('ko-KR')} (
            {aiRecommendationService.calculateTripDays(itinerary.startDate, itinerary.endDate)}일)
          </p>
        </div>

        {/* Summary */}
        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
          <p className="text-gray-700 dark:text-gray-300">{itinerary.summary}</p>
        </div>

        {/* Budget Estimate */}
        {itinerary.budgetEstimate && (
          <div className="p-4 bg-sand-100 dark:bg-gray-800 rounded-2xl">
            <h3 className="font-extrabold text-ink dark:text-white mb-3">예상 비용</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">숙박</p>
                <p className="font-bold font-display text-ink dark:text-white">
                  {aiRecommendationService.formatCurrency(
                    itinerary.budgetEstimate.accommodationEstimate
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">식비</p>
                <p className="font-bold font-display text-ink dark:text-white">
                  {aiRecommendationService.formatCurrency(itinerary.budgetEstimate.foodEstimate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">교통</p>
                <p className="font-bold font-display text-ink dark:text-white">
                  {aiRecommendationService.formatCurrency(
                    itinerary.budgetEstimate.transportationEstimate
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">액티비티</p>
                <p className="font-bold font-display text-ink dark:text-white">
                  {aiRecommendationService.formatCurrency(
                    itinerary.budgetEstimate.activitiesEstimate
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-sand-300 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">총 예상 비용</span>
                <span className="text-xl font-extrabold font-display text-primary-500 dark:text-primary-400">
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
              className={`px-4 py-2 rounded-[10px] font-bold whitespace-nowrap transition-colors ${
                selectedDay === idx
                  ? 'bg-ink text-white'
                  : 'bg-sand-100 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-300 hover:bg-sand-200 dark:hover:bg-gray-700'
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
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
            <h3 className="font-extrabold text-ink dark:text-white mb-2">여행 팁</h3>
            <ul className="space-y-1">
              {itinerary.tips.map((tip, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                >
                  <span className="text-primary-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full py-3 bg-sand-200 dark:bg-gray-800 dark:border dark:border-gray-600 text-ink dark:text-gray-300 rounded-[13px] font-bold hover:bg-sand-400 dark:hover:bg-gray-700 transition-colors"
        >
          새 일정 만들기
        </button>
      </div>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-[0_10px_30px_rgba(16,16,20,0.06)] p-6 ${className}`}
    >
      <h2 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-6 flex items-center gap-2">
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
