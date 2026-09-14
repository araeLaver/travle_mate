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
import PageBackground from '../components/PageBackground';

// Rarity config
const rarityConfig: Record<
  Rarity,
  { color: string; darkColor: string; label: string; emoji: string }
> = {
  COMMON: { color: '#8A8A95', darkColor: '#8A8A95', label: '일반', emoji: '⚪' },
  RARE: { color: '#2E7DF6', darkColor: '#2E7DF6', label: '레어', emoji: '🔵' },
  EPIC: { color: '#8B45E8', darkColor: '#8B45E8', label: '에픽', emoji: '🟣' },
  LEGENDARY: { color: '#E0952A', darkColor: '#E0952A', label: '전설', emoji: '🟡' },
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
    <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] relative overflow-hidden">
      <PageBackground />

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
                    ? 'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400'
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
                  className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all ${
                    selectedRarity === 'ALL'
                      ? 'bg-ink text-white'
                      : 'bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-sand-400 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                  }`}
                >
                  전체
                </button>
                {(Object.keys(rarityConfig) as Rarity[]).map(rarity => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all flex items-center gap-2 ${
                      selectedRarity === rarity
                        ? 'text-white'
                        : 'bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-sand-400 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
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
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-12 border border-transparent dark:border-gray-700/50 text-center"
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
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
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
                        className="bg-white dark:bg-gray-900 rounded-2xl border-2 overflow-hidden hover:shadow-[0_10px_30px_rgba(16,16,20,0.1)] transition-shadow"
                        style={{
                          borderColor:
                            nft.location.rarity === 'COMMON'
                              ? '#EDECE8'
                              : rarityConfig[nft.location.rarity].color,
                        }}
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
                            <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                              <span className="text-6xl">📍</span>
                            </div>
                          )}
                          {/* Rarity Badge */}
                          <span
                            className="absolute top-3 left-3 px-2.5 py-1 rounded-[7px] text-[10px] font-extrabold uppercase tracking-wide text-white"
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
                          <h3 className="text-sm font-extrabold text-ink dark:text-white mb-1 truncate">
                            {nft.location.name}
                          </h3>
                          <p className="text-[11px] text-[#8A8A95] dark:text-gray-400 mb-2">
                            📍 {nft.location.city}, {nft.location.country}
                          </p>
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-primary-500 dark:text-primary-400 font-bold">
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
                              className={`w-full flex items-center justify-center gap-2 py-2.5 font-bold rounded-xl text-sm transition-all ${
                                mintButton.disabled
                                  ? 'bg-sand-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                  : 'bg-primary-500 hover:bg-primary-700 text-white'
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
                    className="px-8 py-3 bg-sand-200 dark:bg-gray-800/80 text-ink dark:text-gray-300 font-bold rounded-xl hover:bg-sand-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    더 보기
                  </button>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-primary-100 dark:border-primary-800 border-t-primary-500 rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          )}

          {/* Book Tab */}
          {activeTab === 'book' && collectionBook && (
            <motion.div key="book" {...fadeInUp} className="space-y-6">
              {/* Stats Card */}
              <div className="bg-ink rounded-2xl p-6 text-white shadow-[0_10px_30px_rgba(16,16,20,0.1)]">
                <h2 className="text-xl font-extrabold tracking-tight mb-6 text-center">
                  수집 현황
                </h2>

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
                        stroke="#8E7BFF"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${collectionBook.stats.completionRate * 2.83} 283`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold font-display">
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
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-transparent dark:border-gray-700/50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  희귀도별 수집
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {(
                    [
                      ['COMMON', collectionBook.stats.commonCollected, '일반'],
                      ['RARE', collectionBook.stats.rareCollected, '레어'],
                      ['EPIC', collectionBook.stats.epicCollected, '에픽'],
                      ['LEGENDARY', collectionBook.stats.legendaryCollected, '전설'],
                    ] as [Rarity, number, string][]
                  ).map(([rarity, count, label]) => (
                    <div
                      key={rarity}
                      className="relative overflow-hidden text-center p-4 pl-5 rounded-2xl bg-white dark:bg-gray-800 shadow-[0_10px_30px_rgba(16,16,20,0.06)]"
                    >
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-11 rounded-r"
                        style={{ backgroundColor: rarityConfig[rarity].color }}
                      />
                      <span
                        className="block text-[28px] leading-9 font-bold font-display"
                        style={{ color: rarityConfig[rarity].color }}
                      >
                        {count}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {rarityConfig[rarity].emoji} {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Region Progress */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-transparent dark:border-gray-700/50">
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
                      <div className="h-1.5 bg-[#EDECE8] dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
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
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-12 border border-transparent dark:border-gray-700/50 text-center">
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
                      className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 border border-transparent dark:border-gray-700/50 flex items-center gap-4 ${
                        achievement.isCompleted ? 'ring-2 ring-success/60 dark:ring-success' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          achievement.isCompleted ? 'bg-success' : 'bg-sand-200 dark:bg-gray-800'
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
                          <div className="flex-1 h-1.5 bg-[#EDECE8] dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                achievement.isCompleted ? 'bg-success' : 'bg-primary-500'
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
                        <p className="text-sm font-bold text-primary-500 dark:text-primary-400">
                          {achievement.pointReward}P
                        </p>
                      </div>

                      {/* Completed Badge */}
                      {achievement.isCompleted && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center">
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
