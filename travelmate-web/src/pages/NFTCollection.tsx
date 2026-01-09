import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { nftService } from '../services/nftService';
import { achievementService } from '../services/achievementService';
import {
  UserNftCollectionResponse,
  CollectionBookResponse,
  AchievementResponse,
  Rarity,
} from '../types';
import './NFTCollection.css';

// SVG Icons
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CollectionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
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

type TabType = 'collection' | 'book' | 'achievements';

const NFTCollection: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [collections, setCollections] = useState<UserNftCollectionResponse[]>([]);
  const [collectionBook, setCollectionBook] = useState<CollectionBookResponse | null>(null);
  const [achievements, setAchievements] = useState<AchievementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 컬렉션 조회
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

  // 도감 조회
  const loadCollectionBook = useCallback(async () => {
    try {
      const response = await nftService.getCollectionBook();
      setCollectionBook(response);
    } catch {
      toast.error('도감 정보를 불러오는데 실패했습니다.');
    }
  }, [toast]);

  // 업적 조회
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

  // 필터링된 컬렉션
  const filteredCollections = collections.filter(
    nft => selectedRarity === 'ALL' || nft.location.rarity === selectedRarity
  );

  // 더 보기
  const loadMore = () => {
    setPage(prev => prev + 1);
    loadCollections();
  };

  return (
    <div className="nft-collection">
      {/* 헤더 */}
      <header className="collection-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <BackIcon />
        </button>
        <h1>내 NFT</h1>
        <div />
      </header>

      {/* 탭 */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          <CollectionIcon />
          컬렉션
        </button>
        <button
          className={`tab-item ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          <MapPinIcon />
          도감
        </button>
        <button
          className={`tab-item ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <TrophyIcon />
          업적
        </button>
      </div>

      {/* 컬렉션 탭 */}
      {activeTab === 'collection' && (
        <div className="tab-content">
          {/* 필터 */}
          <div className="filter-bar">
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
                  style={
                    selectedRarity === key ? { backgroundColor: rarityColors[key as Rarity] } : {}
                  }
                  onClick={() => setSelectedRarity(key as Rarity)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 컬렉션 그리드 */}
          {filteredCollections.length === 0 && !isLoading ? (
            <div className="empty-state">
              <CollectionIcon />
              <h3>수집한 NFT가 없습니다</h3>
              <p>주변 장소를 방문하여 NFT를 수집해보세요!</p>
              <button className="btn-primary" onClick={() => navigate('/nft')}>
                <MapPinIcon />
                NFT 수집하러 가기
              </button>
            </div>
          ) : (
            <div className="collection-grid">
              {filteredCollections.map(nft => (
                <article key={nft.id} className="nft-card">
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
                    <p className="nft-location">
                      {nft.location.city}, {nft.location.country}
                    </p>
                    <div className="nft-meta">
                      <span className="points">
                        <CoinIcon />
                        {nft.earnedPoints}P
                      </span>
                      <span className="date">{new Date(nft.collectedAt).toLocaleDateString()}</span>
                    </div>
                    {nft.tokenId && <p className="token-id">#{nft.tokenId}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* 더 보기 */}
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

      {/* 도감 탭 */}
      {activeTab === 'book' && collectionBook && (
        <div className="tab-content">
          {/* 전체 통계 */}
          <div className="stats-card">
            <h2>수집 현황</h2>
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="progress-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="progress-fill"
                  style={{
                    strokeDasharray: `${collectionBook.stats.completionRate * 2.83} 283`,
                  }}
                />
              </svg>
              <div className="progress-text">
                <span className="progress-value">
                  {collectionBook.stats.completionRate.toFixed(1)}%
                </span>
                <span className="progress-label">완료율</span>
              </div>
            </div>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">{collectionBook.stats.collectedLocations}</span>
                <span className="stat-label">수집</span>
              </div>
              <div className="stat-divider">/</div>
              <div className="stat-item">
                <span className="stat-value">{collectionBook.stats.totalLocations}</span>
                <span className="stat-label">전체</span>
              </div>
            </div>
          </div>

          {/* 희귀도별 통계 */}
          <div className="rarity-stats">
            <h3>희귀도별 수집</h3>
            <div className="rarity-grid">
              <div className="rarity-item" style={{ borderColor: rarityColors.COMMON }}>
                <span className="rarity-count">{collectionBook.stats.commonCollected}</span>
                <span className="rarity-label">일반</span>
              </div>
              <div className="rarity-item" style={{ borderColor: rarityColors.RARE }}>
                <span className="rarity-count">{collectionBook.stats.rareCollected}</span>
                <span className="rarity-label">레어</span>
              </div>
              <div className="rarity-item" style={{ borderColor: rarityColors.EPIC }}>
                <span className="rarity-count">{collectionBook.stats.epicCollected}</span>
                <span className="rarity-label">에픽</span>
              </div>
              <div className="rarity-item" style={{ borderColor: rarityColors.LEGENDARY }}>
                <span className="rarity-count">{collectionBook.stats.legendaryCollected}</span>
                <span className="rarity-label">전설</span>
              </div>
            </div>
          </div>

          {/* 지역별 진행도 */}
          <div className="region-progress">
            <h3>지역별 수집</h3>
            {collectionBook.regions.map(region => (
              <div key={region.region} className="progress-item">
                <div className="progress-header">
                  <span className="progress-name">
                    {region.region}, {region.country}
                  </span>
                  <span className="progress-count">
                    {region.collected}/{region.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${region.completionRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업적 탭 */}
      {activeTab === 'achievements' && (
        <div className="tab-content">
          {achievements.length === 0 ? (
            <div className="empty-state">
              <TrophyIcon />
              <h3>아직 업적이 없습니다</h3>
              <p>NFT를 수집하여 업적을 달성해보세요!</p>
            </div>
          ) : (
            <div className="achievements-list">
              {achievements.map(achievement => (
                <article
                  key={achievement.id}
                  className={`achievement-card ${achievement.isCompleted ? 'completed' : ''}`}
                >
                  <div className="achievement-icon">
                    {achievement.iconUrl ? (
                      <img src={achievement.iconUrl} alt={achievement.name} />
                    ) : (
                      <TrophyIcon />
                    )}
                  </div>
                  <div className="achievement-info">
                    <h3>{achievement.name}</h3>
                    <p>{achievement.description}</p>
                    <div className="achievement-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(achievement.currentProgress / achievement.targetProgress) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="progress-text">
                        {achievement.currentProgress}/{achievement.targetProgress}
                      </span>
                    </div>
                  </div>
                  <div className="achievement-reward">
                    <StarIcon />
                    <span>{achievement.pointReward}P</span>
                  </div>
                  {achievement.isCompleted && (
                    <div className="completed-badge">
                      <StarIcon />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NFTCollection;
