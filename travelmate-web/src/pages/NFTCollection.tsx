/**
 * NFT Collection Page
 * NFT 컬렉션, 도감, 업적 페이지
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { nftService } from '../services/nftService';
import { achievementService } from '../services/achievementService';
import { mintingService, getMintStatusLabel, getMintStatusColor } from '../services/mintingService';
import { useWallet } from '../hooks/useWallet';
import MintingModal from '../components/nft/MintingModal';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import {
  UserNftCollectionResponse,
  CollectionBookResponse,
  AchievementResponse,
  Rarity,
  MintStatus,
} from '../types';

// Rarity config
const rarityConfig: Record<
  Rarity,
  { color: string; darkColor: string; label: string; emoji: string }
> = {
  COMMON: { color: '#9ca3af', darkColor: '#6b7280', label: '일반', emoji: '⚪' },
  RARE: { color: '#3b82f6', darkColor: '#60a5fa', label: '레어', emoji: '🔵' },
  EPIC: { color: '#8b5cf6', darkColor: '#a78bfa', label: '에픽', emoji: '🟣' },
  LEGENDARY: { color: '#f59e0b', darkColor: '#fbbf24', label: '전설', emoji: '🟡' },
};

type TabType = 'collection' | 'book' | 'achievements';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const NFTCollection: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  useWallet();

  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [collections, setCollections] = useState<UserNftCollectionResponse[]>([]);
  const [collectionBook, setCollectionBook] = useState<CollectionBookResponse | null>(null);
  const [achievements, setAchievements] = useState<AchievementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Minting state
  const [mintingNft, setMintingNft] = useState<UserNftCollectionResponse | null>(null);
  const [showMintingModal, setShowMintingModal] = useState(false);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'collection', label: '컬렉션', icon: '🎨' },
    { id: 'book', label: '도감', icon: '📖' },
    { id: 'achievements', label: '업적', icon: '🏆' },
  ];

  // Load collections
  const loadCollections = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 0 : page;
      setIsLoading(true);
      try {
        const response = await nftService.getMyCollection(currentPage, 20);
        if (reset) {
          setCollections(response.content);
        } else {
          setCollections(prev => [...prev, ...response.content]);
        }
        setHasMore(!response.last);
        setPage(currentPage);
      } catch {
        toast.error('컬렉션을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [page, toast]
  );

  // Load collection book
  const loadCollectionBook = useCallback(async () => {
    try {
      const response = await nftService.getCollectionBook();
      setCollectionBook(response);
    } catch {
      toast.error('도감 정보를 불러오는데 실패했습니다.');
    }
  }, [toast]);

  // Load achievements
  const loadAchievements = useCallback(async () => {
    try {
      const response = await achievementService.getMyAchievements();
      setAchievements(response);
    } catch {
      toast.error('업적 정보를 불러오는데 실패했습니다.');
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'collection') {
      loadCollections(true);
    } else if (activeTab === 'book') {
      loadCollectionBook();
    } else if (activeTab === 'achievements') {
      loadAchievements();
    }
  }, [activeTab, loadCollections, loadCollectionBook, loadAchievements]);

  // Filter collections
  const filteredCollections = collections.filter(
    nft => selectedRarity === 'ALL' || nft.location.rarity === selectedRarity
  );

  // Load more
  const loadMore = () => {
    setPage(prev => prev + 1);
    loadCollections();
  };

  // Minting handlers
  const handleOpenMintingModal = (nft: UserNftCollectionResponse) => {
    setMintingNft(nft);
    setShowMintingModal(true);
  };

  const handleCloseMintingModal = () => {
    setShowMintingModal(false);
    setMintingNft(null);
  };

  const handleMintingComplete = () => {
    loadCollections(true);
    toast.success('NFT 민팅이 완료되었습니다!');
  };

  // Get mint button content
  const getMintButtonContent = (status: MintStatus) => {
    switch (status) {
      case 'PENDING':
        return { text: '민팅하기', emoji: '⛏️', disabled: false };
      case 'MINTING':
      case 'CONFIRMING':
        return { text: '민팅 중...', emoji: '⏳', disabled: true };
      case 'MINTED':
        return { text: '민팅 완료', emoji: '🔗', disabled: true };
      case 'FAILED':
        return { text: '재시도', emoji: '🔄', disabled: false };
      default:
        return { text: '민팅하기', emoji: '⛏️', disabled: false };
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute top-20 left-10 w-72 h-72 bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite' }}
      />
      <div
        className="absolute top-40 right-10 w-96 h-96 bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 2s' }}
      />
      <div
        className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"
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
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <Logo size="sm" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">내 NFT</h1>
          <ThemeToggle />
        </div>
      </motion.nav>

      {/* Tabs */}
      <div className="sticky top-[60px] z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
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
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* Collection Tab */}
          {activeTab === 'collection' && (
            <motion.div key="collection" {...fadeInUp}>
              {/* Rarity Filter */}
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRarity('ALL')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedRarity === 'ALL'
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600'
                  }`}
                >
                  전체
                </button>
                {(Object.keys(rarityConfig) as Rarity[]).map(rarity => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedRarity === rarity
                        ? 'text-white shadow-lg'
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600'
                    }`}
                    style={
                      selectedRarity === rarity
                        ? { backgroundColor: rarityConfig[rarity].color }
                        : {}
                    }
                  >
                    <span>{rarityConfig[rarity].emoji}</span>
                    {rarityConfig[rarity].label}
                  </button>
                ))}
              </div>

              {/* Collection Grid */}
              {filteredCollections.length === 0 && !isLoading ? (
                <motion.div
                  {...fadeInUp}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-12 border border-gray-200/50 dark:border-gray-700/50 text-center"
                >
                  <span className="text-6xl mb-4 block">🎨</span>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    수집한 NFT가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    주변 장소를 방문하여 NFT를 수집해보세요!
                  </p>
                  <button
                    onClick={() => navigate('/nft')}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    NFT 수집하러 가기
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {filteredCollections.map((nft, index) => {
                    const mintButton = getMintButtonContent(nft.mintStatus);
                    return (
                      <motion.article
                        key={nft.id}
                        variants={fadeInUp}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-shadow"
                        data-testid="nft-card"
                      >
                        {/* NFT Image */}
                        <div className="relative aspect-square">
                          {nft.location.nftImageUrl || nft.location.imageUrl ? (
                            <img
                              src={nft.location.nftImageUrl || nft.location.imageUrl}
                              alt={nft.location.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center">
                              <span className="text-6xl">📍</span>
                            </div>
                          )}
                          {/* Rarity Badge */}
                          <span
                            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: rarityConfig[nft.location.rarity].color }}
                          >
                            {rarityConfig[nft.location.rarity].emoji}{' '}
                            {rarityConfig[nft.location.rarity].label}
                          </span>
                          {/* Mint Status Badge */}
                          {nft.mintStatus !== 'PENDING' && (
                            <span
                              className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1"
                              style={{ backgroundColor: getMintStatusColor(nft.mintStatus) }}
                            >
                              {nft.mintStatus === 'MINTED' && '🔗'}
                              {getMintStatusLabel(nft.mintStatus)}
                            </span>
                          )}
                        </div>

                        {/* NFT Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-gray-800 dark:text-white mb-1 truncate">
                            {nft.location.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            📍 {nft.location.city}, {nft.location.country}
                          </p>
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-violet-600 dark:text-violet-400 font-semibold">
                              💰 {nft.earnedPoints}P
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">
                              {new Date(nft.collectedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {nft.tokenId && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 font-mono">
                              #{nft.tokenId}
                            </p>
                          )}

                          {/* Action Button */}
                          {nft.mintStatus === 'MINTED' ? (
                            <a
                              href={mintingService.getPolygonscanTxUrl(nft.tokenId || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                              🔗 Polygonscan
                            </a>
                          ) : (
                            <button
                              onClick={() => handleOpenMintingModal(nft)}
                              disabled={mintButton.disabled}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 font-medium rounded-xl text-sm transition-all ${
                                mintButton.disabled
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:opacity-90'
                              }`}
                            >
                              {mintButton.emoji} {mintButton.text}
                            </button>
                          )}
                        </div>
                      </motion.article>
                    );
                  })}
                </motion.div>
              )}

              {/* Load More */}
              {hasMore && !isLoading && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    className="px-8 py-3 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
                  >
                    더 보기
                  </button>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          )}

          {/* Book Tab */}
          {activeTab === 'book' && collectionBook && (
            <motion.div key="book" {...fadeInUp} className="space-y-6">
              {/* Stats Card */}
              <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                <h2 className="text-xl font-bold mb-6 text-center">수집 현황</h2>

                {/* Progress Circle */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="white"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${collectionBook.stats.completionRate * 2.83} 283`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">
                        {collectionBook.stats.completionRate.toFixed(1)}%
                      </span>
                      <span className="text-sm opacity-80">완료율</span>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex justify-center items-center gap-6 text-center">
                  <div>
                    <span className="block text-3xl font-bold">
                      {collectionBook.stats.collectedLocations}
                    </span>
                    <span className="text-sm opacity-80">수집</span>
                  </div>
                  <span className="text-2xl opacity-50">/</span>
                  <div>
                    <span className="block text-3xl font-bold">
                      {collectionBook.stats.totalLocations}
                    </span>
                    <span className="text-sm opacity-80">전체</span>
                  </div>
                </div>
              </div>

              {/* Rarity Stats */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  희귀도별 수집
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div
                    className="text-center p-4 rounded-xl border-2"
                    style={{ borderColor: rarityConfig.COMMON.color }}
                  >
                    <span className="block text-2xl font-bold text-gray-800 dark:text-white">
                      {collectionBook.stats.commonCollected}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {rarityConfig.COMMON.emoji} 일반
                    </span>
                  </div>
                  <div
                    className="text-center p-4 rounded-xl border-2"
                    style={{ borderColor: rarityConfig.RARE.color }}
                  >
                    <span className="block text-2xl font-bold text-gray-800 dark:text-white">
                      {collectionBook.stats.rareCollected}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {rarityConfig.RARE.emoji} 레어
                    </span>
                  </div>
                  <div
                    className="text-center p-4 rounded-xl border-2"
                    style={{ borderColor: rarityConfig.EPIC.color }}
                  >
                    <span className="block text-2xl font-bold text-gray-800 dark:text-white">
                      {collectionBook.stats.epicCollected}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {rarityConfig.EPIC.emoji} 에픽
                    </span>
                  </div>
                  <div
                    className="text-center p-4 rounded-xl border-2"
                    style={{ borderColor: rarityConfig.LEGENDARY.color }}
                  >
                    <span className="block text-2xl font-bold text-gray-800 dark:text-white">
                      {collectionBook.stats.legendaryCollected}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {rarityConfig.LEGENDARY.emoji} 전설
                    </span>
                  </div>
                </div>
              </div>

              {/* Region Progress */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  지역별 수집
                </h3>
                <div className="space-y-4">
                  {collectionBook.regions.map(region => (
                    <div key={region.region}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          📍 {region.region}, {region.country}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {region.collected}/{region.total}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 to-pink-600 rounded-full transition-all duration-500"
                          style={{ width: `${region.completionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <motion.div key="achievements" {...fadeInUp}>
              {achievements.length === 0 ? (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-12 border border-gray-200/50 dark:border-gray-700/50 text-center">
                  <span className="text-6xl mb-4 block">🏆</span>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    아직 업적이 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    NFT를 수집하여 업적을 달성해보세요!
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-4"
                >
                  {achievements.map((achievement, index) => (
                    <motion.article
                      key={achievement.id}
                      variants={fadeInUp}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-4 ${
                        achievement.isCompleted ? 'ring-2 ring-green-400 dark:ring-green-600' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          achievement.isCompleted
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {achievement.iconUrl ? (
                          <img src={achievement.iconUrl} alt="" className="w-10 h-10" />
                        ) : (
                          <span className="text-3xl">{achievement.isCompleted ? '✅' : '🏆'}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {achievement.description}
                        </p>

                        {/* Progress */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                achievement.isCompleted
                                  ? 'bg-green-500'
                                  : 'bg-gradient-to-r from-violet-600 to-pink-600'
                              }`}
                              style={{
                                width: `${Math.min((achievement.currentProgress / achievement.targetProgress) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {achievement.currentProgress}/{achievement.targetProgress}
                          </span>
                        </div>
                      </div>

                      {/* Reward */}
                      <div className="text-center flex-shrink-0">
                        <span className="text-2xl">⭐</span>
                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
                          {achievement.pointReward}P
                        </p>
                      </div>

                      {/* Completed Badge */}
                      {achievement.isCompleted && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      )}
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minting Modal */}
      {showMintingModal && mintingNft && (
        <MintingModal
          collectionId={mintingNft.id}
          locationName={mintingNft.location.name}
          nftImageUrl={mintingNft.location.nftImageUrl || mintingNft.location.imageUrl}
          rarity={mintingNft.location.rarity}
          currentMintStatus={mintingNft.mintStatus}
          onClose={handleCloseMintingModal}
          onMintingComplete={handleMintingComplete}
        />
      )}
    </div>
  );
};

export default NFTCollection;
