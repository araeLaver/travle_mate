import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';
import { useGeolocation } from '../hooks/useGeolocation';
import { nftService } from '../services/nftService';
import { pointService } from '../services/pointService';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import {
  CollectibleLocationResponse,
  CollectNftResponse,
  PointBalanceResponse,
  Rarity,
  LocationCategory,
} from '../types';

// Rarity 색상 및 라벨 매핑
const rarityConfig: Record<Rarity, { color: string; darkColor: string; label: string; emoji: string }> = {
  COMMON: { color: '#9ca3af', darkColor: '#6b7280', label: '일반', emoji: '⚪' },
  RARE: { color: '#3b82f6', darkColor: '#60a5fa', label: '레어', emoji: '🔵' },
  EPIC: { color: '#8b5cf6', darkColor: '#a78bfa', label: '에픽', emoji: '🟣' },
  LEGENDARY: { color: '#f59e0b', darkColor: '#fbbf24', label: '전설', emoji: '🟡' },
};

const categoryLabels: Record<LocationCategory, { label: string; emoji: string }> = {
  LANDMARK: { label: '랜드마크', emoji: '🏛️' },
  MUSEUM: { label: '박물관', emoji: '🏛️' },
  PARK: { label: '공원', emoji: '🌳' },
  TEMPLE: { label: '사찰', emoji: '⛩️' },
  BEACH: { label: '해변', emoji: '🏖️' },
  MOUNTAIN: { label: '산', emoji: '⛰️' },
  HISTORIC: { label: '유적지', emoji: '🏰' },
  CULTURAL: { label: '문화', emoji: '🎭' },
  ENTERTAINMENT: { label: '엔터테인먼트', emoji: '🎪' },
  FOOD: { label: '맛집', emoji: '🍽️' },
  SHOPPING: { label: '쇼핑', emoji: '🛍️' },
  NATURE: { label: '자연', emoji: '🌿' },
  HIDDEN_GEM: { label: '숨은 명소', emoji: '💎' },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const NFTMap: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    latitude,
    longitude,
    accuracy,
    error: geoError,
    loading: geoLoading,
    refresh,
  } = useGeolocation();

  const [nearbyLocations, setNearbyLocations] = useState<CollectibleLocationResponse[]>([]);
  const [pointBalance, setPointBalance] = useState<PointBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollecting, setIsCollecting] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'ALL'>('ALL');

  // 포인트 잔액 조회
  const loadPointBalance = useCallback(async () => {
    try {
      const balance = await pointService.getBalance();
      setPointBalance(balance);
    } catch {
      // 조용히 처리
    }
  }, []);

  // 주변 장소 조회
  const loadNearbyLocations = useCallback(async () => {
    if (!latitude || !longitude) return;

    setIsLoading(true);
    try {
      const locations = await nftService.getNearbyLocations(latitude, longitude, searchRadius);
      setNearbyLocations(locations);
    } catch {
      toast.error('주변 장소를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, searchRadius, toast]);

  useEffect(() => {
    loadPointBalance();
  }, [loadPointBalance]);

  useEffect(() => {
    if (latitude && longitude) {
      loadNearbyLocations();
    }
  }, [latitude, longitude, searchRadius, loadNearbyLocations]);

  // NFT 수집
  const handleCollect = async (location: CollectibleLocationResponse) => {
    if (!latitude || !longitude) {
      toast.error('현재 위치를 확인할 수 없습니다.');
      return;
    }

    if (location.isCollected) {
      toast.info('이미 수집한 장소입니다.');
      return;
    }

    setIsCollecting(location.id);
    try {
      const response: CollectNftResponse = await nftService.collectNft({
        locationId: location.id,
        latitude,
        longitude,
        gpsAccuracy: accuracy ?? undefined,
        isMockLocation: false,
      });

      if (response.success) {
        toast.success(response.message);

        if (response.unlockedAchievements && response.unlockedAchievements.length > 0) {
          response.unlockedAchievements.forEach((achievement) => {
            toast.success(`업적 달성! ${achievement.name} (+${achievement.pointReward}P)`);
          });
        }

        loadPointBalance();
        loadNearbyLocations();
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error('NFT 수집에 실패했습니다.');
    } finally {
      setIsCollecting(null);
    }
  };

  // 거리 포맷팅
  const formatDistance = (meters?: number) => {
    if (!meters) return '거리 정보 없음';
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // 필터링된 장소
  const filteredLocations = nearbyLocations.filter(
    (loc) => selectedCategory === 'ALL' || loc.category === selectedCategory
  );

  // 수집 가능 여부 확인
  const canCollect = (location: CollectibleLocationResponse) => {
    return !location.isCollected && location.distance !== undefined && location.distance <= location.collectRadius;
  };

  // 로딩 상태
  if (geoLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">위치 정보를 가져오는 중...</p>
      </div>
    );
  }

  // 위치 오류 상태
  if (geoError) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex flex-col items-center justify-center px-4">
        <span className="text-6xl mb-4">📍</span>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">위치 정보 필요</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">{geoError}</p>
        <button
          onClick={refresh}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          🔄 다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden pb-20">
      {/* Background Effects */}
      <div
        className="absolute top-20 left-10 w-72 h-72 bg-green-400/30 dark:bg-green-600/20 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite' }}
      />
      <div
        className="absolute top-40 right-10 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 2s' }}
      />
      <div
        className="absolute bottom-40 left-1/3 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 4s' }}
      />

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" onClick={() => navigate('/')} />
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">NFT 수집</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/nft/collection')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">🖼️</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* 포인트 배너 */}
        {pointBalance && (
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg flex items-center gap-3"
          >
            <span className="text-3xl">💰</span>
            <div>
              <span className="text-2xl font-bold">{pointBalance.totalPoints.toLocaleString()}</span>
              <span className="text-sm ml-1 opacity-80">P</span>
            </div>
            <span className="ml-auto text-sm opacity-80">보유 포인트</span>
          </motion.div>
        )}

        {/* 현재 위치 카드 */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
            📍
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">현재 위치</p>
            <p className="font-mono text-gray-800 dark:text-white">
              {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              정확도: {accuracy ? `${Math.round(accuracy)}m` : '측정 중'}
            </p>
          </div>
          <button
            onClick={refresh}
            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            🔄
          </button>
        </motion.div>

        {/* 검색 옵션 */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.15 }}
          className="flex gap-3"
        >
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">검색 반경</label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value={1}>1km</option>
              <option value={3}>3km</option>
              <option value={5}>5km</option>
              <option value={10}>10km</option>
              <option value={20}>20km</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">카테고리</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as LocationCategory | 'ALL')}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="ALL">전체</option>
              {Object.entries(categoryLabels).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>
                  {emoji} {label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* 장소 목록 헤더 */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">주변 수집 장소</h2>
          <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-sm font-medium">
            {filteredLocations.length}개
          </span>
        </motion.div>

        {/* 장소 목록 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">장소를 검색하는 중...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-6xl mb-4">📍</span>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              주변에 수집 가능한 장소가 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400">검색 반경을 넓히거나 다른 지역으로 이동해보세요</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
            {filteredLocations.map((location) => (
              <motion.article
                key={location.id}
                variants={fadeInUp}
                className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden ${
                  location.isCollected ? 'opacity-60' : ''
                } ${canCollect(location) ? 'ring-2 ring-green-500/50' : ''}`}
              >
                <div className="flex">
                  {/* 이미지 */}
                  <div className="w-32 h-32 relative flex-shrink-0">
                    {location.nftImageUrl || location.imageUrl ? (
                      <img
                        src={location.nftImageUrl || location.imageUrl}
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-4xl">
                        📍
                      </div>
                    )}
                    <span
                      className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: rarityConfig[location.rarity].color }}
                    >
                      {rarityConfig[location.rarity].emoji} {rarityConfig[location.rarity].label}
                    </span>
                    {location.isCollected && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 rounded-lg text-xs font-bold text-white">
                        ✓ 수집완료
                      </span>
                    )}
                  </div>

                  {/* 콘텐츠 */}
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{location.name}</h3>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                        {categoryLabels[location.category]?.emoji} {categoryLabels[location.category]?.label}
                      </span>
                    </div>

                    {location.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                        {location.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm mt-auto">
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        📍 {formatDistance(location.distance)}
                        {canCollect(location) && (
                          <span className="text-green-500 font-medium">(수집 가능)</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        ⭐ {location.pointReward}P
                      </span>
                    </div>

                    {location.isSeasonalEvent && (
                      <div className="mt-2 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-xs text-pink-600 dark:text-pink-400 inline-flex items-center gap-1 w-fit">
                        ✨ 시즌 이벤트
                        {location.eventEndAt && (
                          <span> (~{new Date(location.eventEndAt).toLocaleDateString()})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 수집 버튼 */}
                <div className="px-4 pb-4">
                  {location.isCollected ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium rounded-xl"
                    >
                      ✓ 수집 완료
                    </button>
                  ) : canCollect(location) ? (
                    <button
                      onClick={() => handleCollect(location)}
                      disabled={isCollecting === location.id}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCollecting === location.id ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          수집 중...
                        </>
                      ) : (
                        <>
                          ⭐ NFT 수집하기
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium rounded-xl flex items-center justify-center gap-2"
                    >
                      📍 {location.collectRadius}m 이내로 이동
                    </button>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-50">
        <div className="max-w-4xl mx-auto flex">
          <button className="flex-1 py-4 flex flex-col items-center gap-1 text-violet-600 dark:text-violet-400">
            <span className="text-xl">📍</span>
            <span className="text-xs font-medium">수집</span>
          </button>
          <button
            onClick={() => navigate('/nft/collection')}
            className="flex-1 py-4 flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-xl">🖼️</span>
            <span className="text-xs font-medium">컬렉션</span>
          </button>
          <button
            onClick={() => navigate('/points')}
            className="flex-1 py-4 flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-xl">💰</span>
            <span className="text-xs font-medium">포인트</span>
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex-1 py-4 flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-xl">🏆</span>
            <span className="text-xs font-medium">랭킹</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default NFTMap;
