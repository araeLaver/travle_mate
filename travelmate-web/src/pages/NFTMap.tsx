import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useGeolocation } from '../hooks/useGeolocation';
import { nftService } from '../services/nftService';
import { pointService } from '../services/pointService';
import {
  CollectibleLocationResponse,
  CollectNftResponse,
  PointBalanceResponse,
  Rarity,
  LocationCategory,
} from '../types';
import './NFTMap.css';

// SVG Icons
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
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

const categoryLabels: Record<LocationCategory, string> = {
  LANDMARK: '랜드마크',
  MUSEUM: '박물관',
  PARK: '공원',
  TEMPLE: '사찰',
  BEACH: '해변',
  MOUNTAIN: '산',
  HISTORIC: '유적지',
  CULTURAL: '문화',
  ENTERTAINMENT: '엔터테인먼트',
  FOOD: '맛집',
  SHOPPING: '쇼핑',
  NATURE: '자연',
  HIDDEN_GEM: '숨은 명소',
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
      // 포인트 조회 실패는 조용히 처리
    }
  }, []);

  // 주변 장소 조회
  const loadNearbyLocations = useCallback(async () => {
    if (!latitude || !longitude) return;

    setIsLoading(true);
    try {
      const locations = await nftService.getNearbyLocations(latitude, longitude, searchRadius);
      setNearbyLocations(locations);
    } catch (err) {
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

        // 업적 알림
        if (response.unlockedAchievements && response.unlockedAchievements.length > 0) {
          response.unlockedAchievements.forEach(achievement => {
            toast.success(`업적 달성! ${achievement.name} (+${achievement.pointReward}P)`);
          });
        }

        // 포인트 및 장소 목록 갱신
        loadPointBalance();
        loadNearbyLocations();
      } else {
        toast.error(response.message);
      }
    } catch (err) {
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
    loc => selectedCategory === 'ALL' || loc.category === selectedCategory
  );

  // 수집 가능 여부 확인
  const canCollect = (location: CollectibleLocationResponse) => {
    return (
      !location.isCollected &&
      location.distance !== undefined &&
      location.distance <= location.collectRadius
    );
  };

  if (geoLoading) {
    return (
      <div className="nft-map">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>위치 정보를 가져오는 중...</p>
        </div>
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="nft-map">
        <div className="error-state">
          <MapPinIcon />
          <h2>위치 정보 필요</h2>
          <p>{geoError}</p>
          <button className="btn-primary" onClick={refresh}>
            <RefreshIcon /> 다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-map">
      {/* 헤더 */}
      <header className="nft-map-header">
        <h1>NFT 수집</h1>
        <div className="header-actions">
          <button className="btn-icon" onClick={() => navigate('/nft/collection')}>
            <CollectionIcon />
          </button>
        </div>
      </header>

      {/* 포인트 정보 */}
      {pointBalance && (
        <div className="point-banner">
          <CoinIcon />
          <span className="point-amount">{pointBalance.totalPoints.toLocaleString()}P</span>
          <span className="point-label">보유 포인트</span>
        </div>
      )}

      {/* 현재 위치 정보 */}
      <div className="location-info-card">
        <div className="location-icon">
          <MapPinIcon />
        </div>
        <div className="location-details">
          <p className="location-coords">
            {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
          </p>
          <p className="location-accuracy">
            정확도: {accuracy ? `${Math.round(accuracy)}m` : '측정 중'}
          </p>
        </div>
        <button className="btn-refresh" onClick={refresh}>
          <RefreshIcon />
        </button>
      </div>

      {/* 검색 옵션 */}
      <div className="search-options">
        <div className="option-group">
          <label>검색 반경</label>
          <select value={searchRadius} onChange={e => setSearchRadius(Number(e.target.value))}>
            <option value={1}>1km</option>
            <option value={3}>3km</option>
            <option value={5}>5km</option>
            <option value={10}>10km</option>
            <option value={20}>20km</option>
          </select>
        </div>
        <div className="option-group">
          <label>카테고리</label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as LocationCategory | 'ALL')}
          >
            <option value="ALL">전체</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 장소 목록 */}
      <section className="locations-section">
        <div className="section-header">
          <h2>주변 수집 장소</h2>
          <span className="count">{filteredLocations.length}개</span>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>장소를 검색하는 중...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="empty-state">
            <MapPinIcon />
            <h3>주변에 수집 가능한 장소가 없습니다</h3>
            <p>검색 반경을 넓히거나 다른 지역으로 이동해보세요</p>
          </div>
        ) : (
          <div className="locations-list">
            {filteredLocations.map(location => (
              <article
                key={location.id}
                className={`location-card ${location.isCollected ? 'collected' : ''} ${canCollect(location) ? 'collectable' : ''}`}
              >
                <div className="location-image">
                  {location.nftImageUrl || location.imageUrl ? (
                    <img src={location.nftImageUrl || location.imageUrl} alt={location.name} />
                  ) : (
                    <div className="image-placeholder">
                      <MapPinIcon />
                    </div>
                  )}
                  <span
                    className="rarity-badge"
                    style={{ backgroundColor: rarityColors[location.rarity] }}
                  >
                    {rarityLabels[location.rarity]}
                  </span>
                  {location.isCollected && <span className="collected-badge">수집 완료</span>}
                </div>

                <div className="location-content">
                  <div className="location-header">
                    <h3>{location.name}</h3>
                    <span className="category-tag">{categoryLabels[location.category]}</span>
                  </div>

                  {location.description && (
                    <p className="location-description">{location.description}</p>
                  )}

                  <div className="location-meta">
                    <span className="distance">
                      <MapPinIcon />
                      {formatDistance(location.distance)}
                      {location.distance && location.distance <= location.collectRadius && (
                        <span className="in-range"> (수집 가능)</span>
                      )}
                    </span>
                    <span className="points">
                      <StarIcon />
                      {location.pointReward}P
                    </span>
                  </div>

                  {location.city && (
                    <p className="location-address">
                      {location.city}, {location.country}
                    </p>
                  )}

                  {location.isSeasonalEvent && (
                    <div className="event-badge">
                      <StarIcon />
                      시즌 이벤트
                      {location.eventEndAt && (
                        <span> (~{new Date(location.eventEndAt).toLocaleDateString()})</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="location-actions">
                  {location.isCollected ? (
                    <button className="btn-collected" disabled>
                      수집 완료
                    </button>
                  ) : canCollect(location) ? (
                    <button
                      className="btn-collect"
                      onClick={() => handleCollect(location)}
                      disabled={isCollecting === location.id}
                    >
                      {isCollecting === location.id ? (
                        <>
                          <span className="spinner" />
                          수집 중...
                        </>
                      ) : (
                        <>
                          <StarIcon />
                          NFT 수집하기
                        </>
                      )}
                    </button>
                  ) : (
                    <button className="btn-too-far" disabled>
                      <MapPinIcon />
                      {location.collectRadius}m 이내로 이동
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 하단 네비게이션 */}
      <nav className="bottom-nav">
        <button className="nav-item active">
          <MapPinIcon />
          <span>수집</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/nft/collection')}>
          <CollectionIcon />
          <span>컬렉션</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/points')}>
          <CoinIcon />
          <span>포인트</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/leaderboard')}>
          <StarIcon />
          <span>랭킹</span>
        </button>
      </nav>
    </div>
  );
};

export default NFTMap;
