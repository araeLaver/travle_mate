/**
 * AI Recommendation Page
 * AI 추천 시스템 페이지
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AIChat, TravelPlanner, UserTravelProfile, PlaceRecommendations } from '../components/ai';
import { PlaceRecommendation } from '../services/aiRecommendationService';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import PageBackground from '../components/PageBackground';

type TabType = 'planner' | 'places' | 'chat' | 'profile';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const AIRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('planner');
  const [selectedPlace, setSelectedPlace] = useState<PlaceRecommendation | null>(null);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'planner', label: '여행 플래너', icon: '✈️' },
    { id: 'places', label: '장소 추천', icon: '📍' },
    { id: 'chat', label: 'AI 어시스턴트', icon: '💬' },
    { id: 'profile', label: '나의 프로필', icon: '🎯' },
  ];

  const handlePlaceSelect = (place: PlaceRecommendation) => {
    setSelectedPlace(place);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      <PageBackground />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <Logo size="sm" />
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">🤖</span>
            AI 여행 추천
          </h1>
          <p className="mt-2 text-blue-100">AI가 당신에게 딱 맞는 여행을 추천해드립니다</p>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400'
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
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* Travel Planner Tab */}
          {activeTab === 'planner' && (
            <motion.div key="planner" {...fadeInUp} className="max-w-3xl mx-auto">
              <TravelPlanner />
            </motion.div>
          )}

          {/* Places Tab */}
          {activeTab === 'places' && (
            <motion.div key="places" {...fadeInUp} className="max-w-4xl mx-auto">
              <PlaceRecommendations onPlaceSelect={handlePlaceSelect} />
            </motion.div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              {...fadeInUp}
              className="max-w-3xl mx-auto h-[calc(100vh-280px)]"
            >
              <AIChat className="h-full" onPlaceSelect={handlePlaceSelect} />
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div key="profile" {...fadeInUp} className="max-w-2xl mx-auto">
              <UserTravelProfile />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Place Detail Modal */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedPlace(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200/50 dark:border-gray-700/50"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedPlace.name}
                </h3>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              {selectedPlace.imageUrl && (
                <img
                  src={selectedPlace.imageUrl}
                  alt={selectedPlace.name}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}

              <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedPlace.description}</p>

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
                      <li
                        key={idx}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                      >
                        <span className="text-violet-500">•</span>
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
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  지도에서 보기
                </button>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIRecommendation;
