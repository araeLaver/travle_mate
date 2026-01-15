/**
 * AI Recommendation Page
 * AI 추천 시스템 페이지
 */

import React, { useState } from 'react';
import { AIChat, TravelPlanner, UserTravelProfile, PlaceRecommendations } from '../components/ai';
import { PlaceRecommendation } from '../services/aiRecommendationService';

type TabType = 'planner' | 'places' | 'chat' | 'profile';

const AIRecommendation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('planner');
  const [selectedPlace, setSelectedPlace] = useState<PlaceRecommendation | null>(null);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'planner', label: '여행 플래너', icon: '✈️' },
    { id: 'places', label: '장소 추천', icon: '📍' },
    { id: 'chat', label: 'AI 어시스턴트', icon: '💬' },
    { id: 'profile', label: '나의 여행 프로필', icon: '🎯' },
  ];

  const handlePlaceSelect = (place: PlaceRecommendation) => {
    setSelectedPlace(place);
    // Could navigate to place detail or show a modal
    console.log('Selected place:', place);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">🤖</span>
            AI 여행 추천
          </h1>
          <p className="mt-2 text-blue-100">
            AI가 당신에게 딱 맞는 여행을 추천해드립니다
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Travel Planner Tab */}
        {activeTab === 'planner' && (
          <div className="max-w-3xl mx-auto">
            <TravelPlanner />
          </div>
        )}

        {/* Places Tab */}
        {activeTab === 'places' && (
          <div className="max-w-4xl mx-auto">
            <PlaceRecommendations onPlaceSelect={handlePlaceSelect} />
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="max-w-3xl mx-auto h-[calc(100vh-280px)]">
            <AIChat
              className="h-full"
              onPlaceSelect={handlePlaceSelect}
            />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <UserTravelProfile />
          </div>
        )}
      </div>

      {/* Place Detail Modal (optional - for selected places) */}
      {selectedPlace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedPlace(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedPlace.name}
              </h3>
              <button
                onClick={() => setSelectedPlace(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedPlace.imageUrl && (
              <img
                src={selectedPlace.imageUrl}
                alt={selectedPlace.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedPlace.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                {selectedPlace.category}
              </span>
              {selectedPlace.rating > 0 && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                  ⭐ {selectedPlace.rating.toFixed(1)}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                📍 {selectedPlace.distance?.toFixed(1)}km
              </span>
            </div>

            {selectedPlace.reasons && selectedPlace.reasons.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI 추천 이유:
                </p>
                <ul className="space-y-1">
                  {selectedPlace.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps?q=${selectedPlace.latitude},${selectedPlace.longitude}`,
                    '_blank'
                  );
                }}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                지도에서 보기
              </button>
              <button
                onClick={() => setSelectedPlace(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendation;
