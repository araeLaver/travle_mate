import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { marketplaceService } from '../services/marketplaceService';
import { nftService } from '../services/nftService';
import { pointService } from '../services/pointService';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import {
  MarketplaceListingResponse,
  UserNftCollectionResponse,
  Rarity,
  PointBalanceResponse,
} from '../types';
import PageBackground from '../components/PageBackground';

// Rarity 색상 매핑
const rarityConfig: Record<Rarity, { color: string; label: string; emoji: string }> = {
  COMMON: { color: '#9ca3af', label: '일반', emoji: '⚪' },
  RARE: { color: '#3b82f6', label: '레어', emoji: '🔵' },
  EPIC: { color: '#8b5cf6', label: '에픽', emoji: '🟣' },
  LEGENDARY: { color: '#f59e0b', label: '전설', emoji: '🟡' },
};

type TabType = 'market' | 'sell' | 'my-listings' | 'purchases';

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

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [listings, setListings] = useState<MarketplaceListingResponse[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListingResponse[]>([]);
  const [myPurchases, setMyPurchases] = useState<MarketplaceListingResponse[]>([]);
  const [myNfts, setMyNfts] = useState<UserNftCollectionResponse[]>([]);
  const [balance, setBalance] = useState<PointBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 필터
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'ALL'>('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // 판매 모달
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedNft, setSelectedNft] = useState<UserNftCollectionResponse | null>(null);
  const [sellPrice, setSellPrice] = useState<string>('');
  const [sellDuration, setSellDuration] = useState<number>(7);

  // 구매 확인 모달
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListingResponse | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const tabs = [
    { id: 'market' as TabType, label: '마켓', icon: '🏪' },
    { id: 'sell' as TabType, label: '판매', icon: '💵' },
    { id: 'my-listings' as TabType, label: '내 판매', icon: '📋' },
    { id: 'purchases' as TabType, label: '구매', icon: '🛒' },
  ];

  // 포인트 잔액 조회
  const loadBalance = useCallback(async () => {
    try {
      const res = await pointService.getBalance();
      setBalance(res);
    } catch {
      // silent fail
    }
  }, []);

  // 마켓 리스팅 조회
  const loadListings = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 0 : page;
      setIsLoading(true);
      try {
        let response;
        if (selectedRarity !== 'ALL') {
          response = await marketplaceService.getListingsByRarity(selectedRarity, currentPage, 20);
        } else if (minPrice && maxPrice) {
          response = await marketplaceService.getListingsByPriceRange(
            parseInt(minPrice),
            parseInt(maxPrice),
            currentPage,
            20
          );
        } else {
          response = await marketplaceService.getActiveListings(currentPage, 20);
        }

        if (reset) {
          setListings(response.content);
        } else {
          setListings(prev => [...prev, ...response.content]);
        }
        setHasMore(!response.last);
        setPage(currentPage);
      } catch {
        toast.error('리스팅을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [page, selectedRarity, minPrice, maxPrice, toast]
  );

  // 내 판매 리스팅 조회
  const loadMyListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketplaceService.getMyListings(0, 50);
      setMyListings(response.content);
    } catch {
      toast.error('내 판매 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 내 구매 내역 조회
  const loadMyPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await marketplaceService.getMyPurchases(0, 50);
      setMyPurchases(response.content);
    } catch {
      toast.error('구매 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 내 NFT 목록 조회
  const loadMyNfts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await nftService.getMyCollection(0, 100);
      setMyNfts(response.content);
    } catch {
      toast.error('NFT 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    if (activeTab === 'market') {
      loadListings(true);
    } else if (activeTab === 'sell') {
      loadMyNfts();
    } else if (activeTab === 'my-listings') {
      loadMyListings();
    } else if (activeTab === 'purchases') {
      loadMyPurchases();
    }
  }, [activeTab, loadListings, loadMyNfts, loadMyListings, loadMyPurchases]);

  // 필터 적용
  const applyFilters = () => {
    setPage(0);
    loadListings(true);
  };

  // 더 보기
  const loadMore = () => {
    setPage(prev => prev + 1);
    loadListings();
  };

  // 판매 등록
  const handleSell = async () => {
    if (!selectedNft || !sellPrice) return;

    const price = parseInt(sellPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('올바른 가격을 입력해주세요.');
      return;
    }

    try {
      await marketplaceService.createListing({
        nftCollectionId: selectedNft.id,
        priceInPoints: price,
        durationDays: sellDuration,
      });
      toast.success('판매 등록이 완료되었습니다!');
      setShowSellModal(false);
      setSelectedNft(null);
      setSellPrice('');
      loadMyNfts();
      loadMyListings();
    } catch {
      toast.error('판매 등록에 실패했습니다.');
    }
  };

  // 구매
  const handleBuy = async () => {
    if (!selectedListing || isBuying) return;

    if (!balance || balance.totalPoints < selectedListing.priceInPoints) {
      toast.error('포인트가 부족합니다.');
      return;
    }

    setIsBuying(true);
    try {
      const response = await marketplaceService.buyNft(selectedListing.id);
      if (response.success) {
        toast.success('구매가 완료되었습니다!');
        setShowBuyModal(false);
        setSelectedListing(null);
        loadBalance();
        loadListings(true);
      } else {
        toast.error(response.message || '구매에 실패했습니다.');
      }
    } catch {
      toast.error('구매에 실패했습니다.');
    } finally {
      setIsBuying(false);
    }
  };

  // 판매 취소
  const handleCancelListing = async (listingId: number) => {
    try {
      await marketplaceService.cancelListing(listingId);
      toast.success('판매가 취소되었습니다.');
      loadMyListings();
    } catch {
      toast.error('판매 취소에 실패했습니다.');
    }
  };

  // 남은 시간 계산
  const getTimeRemaining = (expiresAt?: string): string => {
    if (!expiresAt) return '';
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return '만료됨';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}일 ${hours}시간`;
    return `${hours}시간`;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      <PageBackground />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <Logo size="sm" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">NFT 마켓</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <span>💰</span>
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                {balance?.totalPoints?.toLocaleString() || 0}P
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>

      {/* 탭 */}
      <div className="sticky top-[57px] z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* 마켓 탭 */}
          {activeTab === 'market' && (
            <motion.div key="market" {...fadeInUp}>
              {/* 필터 */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 mb-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">희귀도</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedRarity('ALL')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedRarity === 'ALL'
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      전체
                    </button>
                    {Object.entries(rarityConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedRarity(key as Rarity)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          selectedRarity === key
                            ? 'text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                        style={selectedRarity === key ? { backgroundColor: config.color } : {}}
                      >
                        {config.emoji} {config.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">가격</span>
                  <input
                    type="number"
                    placeholder="최소"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none text-gray-800 dark:text-white"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-24 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none text-gray-800 dark:text-white"
                  />
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    적용
                  </button>
                </div>
              </div>

              {/* 리스팅 */}
              {listings.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-6xl mb-4">🏪</span>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    등록된 NFT가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">첫 번째로 NFT를 판매해보세요!</p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-2 gap-4"
                >
                  {listings.map(listing => (
                    <motion.article
                      key={listing.id}
                      variants={fadeInUp}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
                    >
                      <div className="aspect-square relative">
                        {listing.nftCollection.location.nftImageUrl ||
                        listing.nftCollection.location.imageUrl ? (
                          <img
                            src={
                              listing.nftCollection.location.nftImageUrl ||
                              listing.nftCollection.location.imageUrl
                            }
                            alt={listing.nftCollection.location.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-6xl">
                            📍
                          </div>
                        )}
                        <span
                          className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold text-white"
                          style={{
                            backgroundColor:
                              rarityConfig[listing.nftCollection.location.rarity].color,
                          }}
                        >
                          {rarityConfig[listing.nftCollection.location.rarity].emoji}{' '}
                          {rarityConfig[listing.nftCollection.location.rarity].label}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate mb-1">
                          {listing.nftCollection.location.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          판매자: {listing.seller.nickname}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold">
                            💰 {listing.priceInPoints.toLocaleString()}P
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            ⏰ {getTimeRemaining(listing.expiresAt)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedListing(listing);
                            setShowBuyModal(true);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
                        >
                          구매하기
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}

              {hasMore && !isLoading && (
                <button
                  onClick={loadMore}
                  className="w-full mt-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  더 보기
                </button>
              )}

              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          )}

          {/* 판매 탭 */}
          {activeTab === 'sell' && (
            <motion.div key="sell" {...fadeInUp}>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                판매할 NFT 선택
              </h2>
              {myNfts.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-6xl mb-4">📍</span>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    보유한 NFT가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    NFT를 수집해서 마켓에 판매해보세요!
                  </p>
                  <button
                    onClick={() => navigate('/nft')}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl"
                  >
                    NFT 수집하러 가기
                  </button>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-2 gap-4"
                >
                  {myNfts.map(nft => (
                    <motion.article
                      key={nft.id}
                      variants={fadeInUp}
                      onClick={() => {
                        setSelectedNft(nft);
                        setShowSellModal(true);
                      }}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all"
                    >
                      <div className="aspect-square relative">
                        {nft.location.nftImageUrl || nft.location.imageUrl ? (
                          <img
                            src={nft.location.nftImageUrl || nft.location.imageUrl}
                            alt={nft.location.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-6xl">
                            📍
                          </div>
                        )}
                        <span
                          className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: rarityConfig[nft.location.rarity].color }}
                        >
                          {rarityConfig[nft.location.rarity].emoji}{' '}
                          {rarityConfig[nft.location.rarity].label}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                          {nft.location.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {nft.location.city}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          )}

          {/* 내 판매 탭 */}
          {activeTab === 'my-listings' && (
            <motion.div key="my-listings" {...fadeInUp}>
              {myListings.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-6xl mb-4">📋</span>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    판매중인 NFT가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">NFT를 판매 등록해보세요!</p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-3"
                >
                  {myListings.map(listing => (
                    <motion.article
                      key={listing.id}
                      variants={fadeInUp}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {listing.nftCollection.location.nftImageUrl ? (
                          <img
                            src={listing.nftCollection.location.nftImageUrl}
                            alt={listing.nftCollection.location.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
                            📍
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                          {listing.nftCollection.location.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                            💰 {listing.priceInPoints.toLocaleString()}P
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              listing.status === 'ACTIVE'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : listing.status === 'SOLD'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}
                          >
                            {listing.status === 'ACTIVE'
                              ? '판매중'
                              : listing.status === 'SOLD'
                                ? '판매완료'
                                : '취소됨'}
                          </span>
                        </div>
                      </div>
                      {listing.status === 'ACTIVE' && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            ⏰ {getTimeRemaining(listing.expiresAt)}
                          </span>
                          <button
                            onClick={() => handleCancelListing(listing.id)}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </motion.article>
                  ))}
                </motion.div>
              )}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          )}

          {/* 구매 내역 탭 */}
          {activeTab === 'purchases' && (
            <motion.div key="purchases" {...fadeInUp}>
              {myPurchases.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-6xl mb-4">🛒</span>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    구매 내역이 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">마켓에서 NFT를 구매해보세요!</p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-3"
                >
                  {myPurchases.map(listing => (
                    <motion.article
                      key={listing.id}
                      variants={fadeInUp}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {listing.nftCollection.location.nftImageUrl ? (
                          <img
                            src={listing.nftCollection.location.nftImageUrl}
                            alt={listing.nftCollection.location.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
                            📍
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                          {listing.nftCollection.location.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          판매자: {listing.seller.nickname}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                          💰 {listing.priceInPoints.toLocaleString()}P
                        </span>
                        <p className="text-xs text-gray-400">
                          {new Date(listing.listedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 판매 등록 모달 */}
      <AnimatePresence>
        {showSellModal && selectedNft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowSellModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200/50 dark:border-gray-700/50"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">NFT 판매 등록</h2>
                <button
                  onClick={() => setShowSellModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  {selectedNft.location.nftImageUrl || selectedNft.location.imageUrl ? (
                    <img
                      src={selectedNft.location.nftImageUrl || selectedNft.location.imageUrl}
                      alt={selectedNft.location.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
                      📍
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {selectedNft.location.name}
                  </h3>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white mt-1"
                    style={{ backgroundColor: rarityConfig[selectedNft.location.rarity].color }}
                  >
                    {rarityConfig[selectedNft.location.rarity].emoji}{' '}
                    {rarityConfig[selectedNft.location.rarity].label}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  판매 가격 (포인트)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">💰</span>
                  <input
                    type="number"
                    placeholder="판매할 가격을 입력하세요"
                    value={sellPrice}
                    onChange={e => setSellPrice(e.target.value)}
                    min="1"
                    className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none text-gray-800 dark:text-white placeholder-gray-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">P</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  판매 기간
                </label>
                <div className="flex gap-2">
                  {[3, 7, 14, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setSellDuration(days)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sellDuration === days
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {days}일
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSell}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                💵 판매 등록
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 구매 확인 모달 */}
      <AnimatePresence>
        {showBuyModal && selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowBuyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200/50 dark:border-gray-700/50"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">구매 확인</h2>
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  {selectedListing.nftCollection.location.nftImageUrl ||
                  selectedListing.nftCollection.location.imageUrl ? (
                    <img
                      src={
                        selectedListing.nftCollection.location.nftImageUrl ||
                        selectedListing.nftCollection.location.imageUrl
                      }
                      alt={selectedListing.nftCollection.location.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
                      📍
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {selectedListing.nftCollection.location.name}
                  </h3>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white mt-1"
                    style={{
                      backgroundColor:
                        rarityConfig[selectedListing.nftCollection.location.rarity].color,
                    }}
                  >
                    {rarityConfig[selectedListing.nftCollection.location.rarity].emoji}{' '}
                    {rarityConfig[selectedListing.nftCollection.location.rarity].label}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">판매자</span>
                  <span className="text-gray-800 dark:text-white">
                    {selectedListing.seller.nickname}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">가격</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                    💰 {selectedListing.priceInPoints.toLocaleString()}P
                  </span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">내 포인트</span>
                  <span className="text-gray-800 dark:text-white">
                    {balance?.totalPoints?.toLocaleString() || 0}P
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">구매 후 잔액</span>
                  <span
                    className={`font-bold ${
                      balance && balance.totalPoints < selectedListing.priceInPoints
                        ? 'text-red-500'
                        : 'text-gray-800 dark:text-white'
                    }`}
                  >
                    {((balance?.totalPoints || 0) - selectedListing.priceInPoints).toLocaleString()}
                    P
                  </span>
                </div>
              </div>

              {balance && balance.totalPoints < selectedListing.priceInPoints && (
                <p className="text-red-500 text-sm text-center mb-4">포인트가 부족합니다.</p>
              )}

              <button
                onClick={handleBuy}
                disabled={
                  isBuying || !balance || balance.totalPoints < selectedListing.priceInPoints
                }
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBuying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    구매 중...
                  </>
                ) : (
                  '🛒 구매하기'
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
