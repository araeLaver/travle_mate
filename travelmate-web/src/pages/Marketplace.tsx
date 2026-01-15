import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { marketplaceService } from '../services/marketplaceService';
import { nftService } from '../services/nftService';
import { pointService } from '../services/pointService';
import {
  MarketplaceListingResponse,
  UserNftCollectionResponse,
  Rarity,
  PointBalanceResponse,
} from '../types';
import './Marketplace.css';

// SVG Icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const ShopIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const CoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const XCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// Rarity 색상 매핑
const rarityColors: Record<Rarity, string> = {
  COMMON: '#9ca3af',
  RARE: '#3b82f6',
  EPIC: '#8b5cf6',
  LEGENDARY: '#f59e0b',
};

const rarityLabels: Record<Rarity, string> = {
  COMMON: '일반',
  RARE: '레어',
  EPIC: '에픽',
  LEGENDARY: '전설',
};

type TabType = 'market' | 'sell' | 'my-listings' | 'purchases';

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
  const loadListings = useCallback(async (reset = false) => {
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
  }, [page, selectedRarity, minPrice, maxPrice, toast]);

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

  // 내 NFT 목록 조회 (판매용)
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
    <div className="marketplace">
      {/* 헤더 */}
      <header className="marketplace-header">
        <button className="btn-back" onClick={() => navigate(-1)} aria-label="뒤로 가기">
          <BackIcon />
        </button>
        <h1>NFT 마켓플레이스</h1>
        <div className="header-balance">
          <CoinIcon />
          <span>{balance?.totalPoints?.toLocaleString() || 0}P</span>
        </div>
      </header>

      {/* 탭 */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          <ShopIcon />
          마켓
        </button>
        <button
          className={`tab-item ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          <SellIcon />
          판매
        </button>
        <button
          className={`tab-item ${activeTab === 'my-listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-listings')}
        >
          <ListIcon />
          내 판매
        </button>
        <button
          className={`tab-item ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          <CartIcon />
          구매
        </button>
      </div>

      {/* 마켓 탭 */}
      {activeTab === 'market' && (
        <div className="tab-content">
          {/* 필터 */}
          <div className="filter-section">
            <div className="filter-row">
              <span className="filter-label">희귀도</span>
              <div className="filter-options">
                <button
                  className={`filter-btn ${selectedRarity === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedRarity('ALL')}
                >
                  전체
                </button>
                {Object.entries(rarityLabels).map(([key, label]) => (
                  <button
                    key={key}
                    className={`filter-btn ${selectedRarity === key ? 'active' : ''}`}
                    style={selectedRarity === key ? { backgroundColor: rarityColors[key as Rarity] } : {}}
                    onClick={() => setSelectedRarity(key as Rarity)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-row price-filter">
              <span className="filter-label">가격</span>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="최소"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span>~</span>
                <input
                  type="number"
                  placeholder="최대"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
                <button className="btn-apply" onClick={applyFilters}>적용</button>
              </div>
            </div>
          </div>

          {/* 리스팅 그리드 */}
          {listings.length === 0 && !isLoading ? (
            <div className="empty-state">
              <ShopIcon />
              <h3>등록된 NFT가 없습니다</h3>
              <p>첫 번째로 NFT를 판매해보세요!</p>
            </div>
          ) : (
            <div className="listing-grid">
              {listings.map(listing => (
                <article key={listing.id} className="listing-card">
                  <div className="listing-image">
                    {listing.nftCollection.location.nftImageUrl || listing.nftCollection.location.imageUrl ? (
                      <img
                        src={listing.nftCollection.location.nftImageUrl || listing.nftCollection.location.imageUrl}
                        alt={listing.nftCollection.location.name}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <MapPinIcon />
                      </div>
                    )}
                    <span
                      className="rarity-badge"
                      style={{ backgroundColor: rarityColors[listing.nftCollection.location.rarity] }}
                    >
                      {rarityLabels[listing.nftCollection.location.rarity]}
                    </span>
                  </div>
                  <div className="listing-info">
                    <h3>{listing.nftCollection.location.name}</h3>
                    <p className="seller">판매자: {listing.seller.nickname}</p>
                    <div className="listing-meta">
                      <span className="price">
                        <CoinIcon />
                        {listing.priceInPoints.toLocaleString()}P
                      </span>
                      <span className="time">
                        <ClockIcon />
                        {getTimeRemaining(listing.expiresAt)}
                      </span>
                    </div>
                    <button
                      className="btn-buy"
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowBuyModal(true);
                      }}
                    >
                      구매하기
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasMore && !isLoading && (
            <button className="btn-load-more" onClick={loadMore}>
              더 보기
            </button>
          )}

          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          )}
        </div>
      )}

      {/* 판매 탭 */}
      {activeTab === 'sell' && (
        <div className="tab-content">
          <h2 className="section-title">판매할 NFT 선택</h2>
          {myNfts.length === 0 && !isLoading ? (
            <div className="empty-state">
              <MapPinIcon />
              <h3>보유한 NFT가 없습니다</h3>
              <p>NFT를 수집해서 마켓에 판매해보세요!</p>
              <button className="btn-primary" onClick={() => navigate('/nft')}>
                NFT 수집하러 가기
              </button>
            </div>
          ) : (
            <div className="nft-select-grid">
              {myNfts.map(nft => (
                <article
                  key={nft.id}
                  className={`nft-select-card ${selectedNft?.id === nft.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedNft(nft);
                    setShowSellModal(true);
                  }}
                >
                  <div className="nft-image">
                    {nft.location.nftImageUrl || nft.location.imageUrl ? (
                      <img
                        src={nft.location.nftImageUrl || nft.location.imageUrl}
                        alt={nft.location.name}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <MapPinIcon />
                      </div>
                    )}
                    <span
                      className="rarity-badge"
                      style={{ backgroundColor: rarityColors[nft.location.rarity] }}
                    >
                      {rarityLabels[nft.location.rarity]}
                    </span>
                  </div>
                  <div className="nft-info">
                    <h3>{nft.location.name}</h3>
                    <p>{nft.location.city}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          )}
        </div>
      )}

      {/* 내 판매 탭 */}
      {activeTab === 'my-listings' && (
        <div className="tab-content">
          {myListings.length === 0 && !isLoading ? (
            <div className="empty-state">
              <ListIcon />
              <h3>판매중인 NFT가 없습니다</h3>
              <p>NFT를 판매 등록해보세요!</p>
            </div>
          ) : (
            <div className="my-listings-list">
              {myListings.map(listing => (
                <article key={listing.id} className="my-listing-card">
                  <div className="listing-image small">
                    {listing.nftCollection.location.nftImageUrl ? (
                      <img
                        src={listing.nftCollection.location.nftImageUrl}
                        alt={listing.nftCollection.location.name}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <MapPinIcon />
                      </div>
                    )}
                  </div>
                  <div className="listing-details">
                    <h3>{listing.nftCollection.location.name}</h3>
                    <div className="listing-meta-row">
                      <span className="price">
                        <CoinIcon />
                        {listing.priceInPoints.toLocaleString()}P
                      </span>
                      <span className={`status ${listing.status.toLowerCase()}`}>
                        {listing.status === 'ACTIVE' ? '판매중' : listing.status === 'SOLD' ? '판매완료' : '취소됨'}
                      </span>
                    </div>
                    {listing.status === 'ACTIVE' && (
                      <div className="listing-actions">
                        <span className="time">
                          <ClockIcon />
                          {getTimeRemaining(listing.expiresAt)}
                        </span>
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancelListing(listing.id)}
                        >
                          <XCircleIcon />
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          )}
        </div>
      )}

      {/* 구매 내역 탭 */}
      {activeTab === 'purchases' && (
        <div className="tab-content">
          {myPurchases.length === 0 && !isLoading ? (
            <div className="empty-state">
              <CartIcon />
              <h3>구매 내역이 없습니다</h3>
              <p>마켓에서 NFT를 구매해보세요!</p>
            </div>
          ) : (
            <div className="purchases-list">
              {myPurchases.map(listing => (
                <article key={listing.id} className="purchase-card">
                  <div className="listing-image small">
                    {listing.nftCollection.location.nftImageUrl ? (
                      <img
                        src={listing.nftCollection.location.nftImageUrl}
                        alt={listing.nftCollection.location.name}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <MapPinIcon />
                      </div>
                    )}
                  </div>
                  <div className="purchase-details">
                    <h3>{listing.nftCollection.location.name}</h3>
                    <p className="seller">판매자: {listing.seller.nickname}</p>
                    <div className="purchase-meta">
                      <span className="price">
                        <CoinIcon />
                        {listing.priceInPoints.toLocaleString()}P
                      </span>
                      <span className="date">
                        {new Date(listing.listedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          )}
        </div>
      )}

      {/* 판매 등록 모달 */}
      {showSellModal && selectedNft && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSellModal(false)}>
              <CloseIcon />
            </button>
            <h2>NFT 판매 등록</h2>

            <div className="modal-nft-preview">
              <div className="preview-image">
                {selectedNft.location.nftImageUrl || selectedNft.location.imageUrl ? (
                  <img
                    src={selectedNft.location.nftImageUrl || selectedNft.location.imageUrl}
                    alt={selectedNft.location.name}
                  />
                ) : (
                  <div className="image-placeholder">
                    <MapPinIcon />
                  </div>
                )}
              </div>
              <div className="preview-info">
                <h3>{selectedNft.location.name}</h3>
                <span
                  className="rarity-tag"
                  style={{ backgroundColor: rarityColors[selectedNft.location.rarity] }}
                >
                  {rarityLabels[selectedNft.location.rarity]}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sellPrice">판매 가격 (포인트)</label>
              <div className="price-input-wrapper">
                <CoinIcon />
                <input
                  id="sellPrice"
                  type="number"
                  placeholder="판매할 가격을 입력하세요"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  min="1"
                />
                <span>P</span>
              </div>
            </div>

            <div className="form-group">
              <label>판매 기간</label>
              <div className="duration-options">
                {[3, 7, 14, 30].map(days => (
                  <button
                    key={days}
                    className={`duration-btn ${sellDuration === days ? 'active' : ''}`}
                    onClick={() => setSellDuration(days)}
                  >
                    {days}일
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-confirm" onClick={handleSell}>
              <SellIcon />
              판매 등록
            </button>
          </div>
        </div>
      )}

      {/* 구매 확인 모달 */}
      {showBuyModal && selectedListing && (
        <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBuyModal(false)}>
              <CloseIcon />
            </button>
            <h2>구매 확인</h2>

            <div className="modal-nft-preview">
              <div className="preview-image">
                {selectedListing.nftCollection.location.nftImageUrl || selectedListing.nftCollection.location.imageUrl ? (
                  <img
                    src={selectedListing.nftCollection.location.nftImageUrl || selectedListing.nftCollection.location.imageUrl}
                    alt={selectedListing.nftCollection.location.name}
                  />
                ) : (
                  <div className="image-placeholder">
                    <MapPinIcon />
                  </div>
                )}
              </div>
              <div className="preview-info">
                <h3>{selectedListing.nftCollection.location.name}</h3>
                <span
                  className="rarity-tag"
                  style={{ backgroundColor: rarityColors[selectedListing.nftCollection.location.rarity] }}
                >
                  {rarityLabels[selectedListing.nftCollection.location.rarity]}
                </span>
              </div>
            </div>

            <div className="purchase-summary">
              <div className="summary-row">
                <span>판매자</span>
                <span>{selectedListing.seller.nickname}</span>
              </div>
              <div className="summary-row">
                <span>가격</span>
                <span className="price-value">
                  <CoinIcon />
                  {selectedListing.priceInPoints.toLocaleString()}P
                </span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row">
                <span>내 포인트</span>
                <span>{balance?.totalPoints?.toLocaleString() || 0}P</span>
              </div>
              <div className="summary-row balance-after">
                <span>구매 후 잔액</span>
                <span className={balance && balance.totalPoints < selectedListing.priceInPoints ? 'insufficient' : ''}>
                  {((balance?.totalPoints || 0) - selectedListing.priceInPoints).toLocaleString()}P
                </span>
              </div>
            </div>

            {balance && balance.totalPoints < selectedListing.priceInPoints && (
              <div className="warning-message">
                포인트가 부족합니다.
              </div>
            )}

            <button
              className="btn-confirm"
              onClick={handleBuy}
              disabled={isBuying || !balance || balance.totalPoints < selectedListing.priceInPoints}
            >
              {isBuying ? '구매 중...' : '구매하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
