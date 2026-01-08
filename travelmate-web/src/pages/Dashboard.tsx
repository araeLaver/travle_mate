import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import { locationService, TravelMate, Location } from '../services/locationService';
import { chatService } from '../services/chatService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';

// SVG Icons
const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const WifiIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const CompassIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const MapPinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const MapIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MessageCircleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [nearbyUsers, setNearbyUsers] = useState<TravelMate[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentMood, setCurrentMood] = useState('여행 중');
  const [discoveryCount, setDiscoveryCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [userName] = useState(() => {
    const savedName = localStorage.getItem('userName');
    return savedName || '여행러';
  });

  const moods = ['여행 중', '맛집 탐방', '산 좋아', '인생샷 찍기', '카페 투어', '문화 체험'];

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    setIsInitialLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      const DEFAULT_LAT = 37.5665;
      const DEFAULT_LNG = 126.978;
      const EPSILON = 0.0001;

      const isDefaultLocation =
        Math.abs(location.latitude - DEFAULT_LAT) < EPSILON &&
        Math.abs(location.longitude - DEFAULT_LNG) < EPSILON;

      setIsLocationEnabled(!isDefaultLocation);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const discoverNearbyMates = useCallback(async () => {
    if (isDiscovering) return;

    setIsDiscovering(true);
    setDiscoveryCount(prev => prev + 1);

    try {
      const mates = await locationService.findNearbyTravelMates(searchRadius);

      const enhancedMates = mates.map(mate => {
        if (mate.mood === currentMood) {
          return { ...mate, matchScore: Math.min(99, mate.matchScore + 10) };
        }
        return mate;
      });

      setNearbyUsers(enhancedMates.sort((a, b) => b.matchScore - a.matchScore));
    } catch (error) {
      logError('Dashboard.discoverNearbyMates', error);
      toast.error(getErrorMessage(error));
    } finally {
      setTimeout(() => {
        setIsDiscovering(false);
      }, 2000);
    }
  }, [isDiscovering, searchRadius, currentMood, toast]);

  const startChat = (mate: TravelMate) => {
    const room = chatService.createChatRoom(mate.name, mate.id);
    navigate(`/chat/${room.id}`);
  };

  const sendGreeting = (mate: TravelMate) => {
    toast.success(`${mate.name}님에게 인사를 보냈습니다!`);
  };

  const requestLocationPermission = async () => {
    await initializeLocation();
  };

  const setManualLocation = async () => {
    const gwangjuLocation = {
      latitude: 37.4138,
      longitude: 127.2557,
      address: '경기도 광주시 (수동 설정)',
    };

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const response = await fetch(
        `${API_BASE_URL}/location/address?lat=${gwangjuLocation.latitude}&lng=${gwangjuLocation.longitude}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.documents && data.documents.length > 0) {
          const doc = data.documents[0];
          if (doc.road_address && doc.road_address.address_name) {
            gwangjuLocation.address = doc.road_address.address_name;
          } else if (doc.address && doc.address.address_name) {
            gwangjuLocation.address = doc.address.address_name;
          }
        }
      }
    } catch {
      // 주소 조회 실패시 기본 주소 사용
    }

    setCurrentLocation(gwangjuLocation);
    setIsLocationEnabled(true);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  };

  // Avatar component with fallback
  const Avatar = ({ name, image, size = 72 }: { name: string; image?: string; size?: number }) => {
    const initials = name.charAt(0).toUpperCase();

    if (image) {
      return (
        <img
          src={image}
          alt={`${name}의 프로필 사진`}
          className="profile-image"
          style={{ width: size, height: size }}
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }

    return (
      <div
        className="profile-avatar"
        style={{ width: size, height: size }}
        aria-label={`${name}의 프로필`}
      >
        {initials}
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <p className="greeting-text">{getTimeGreeting()},</p>
          <h1>{userName}님!</h1>
          <p className="sub-text">오늘도 멋진 여행을 만들어보세요</p>
        </header>

        <section className="dashboard-stats" aria-label="통계 요약">
          <div className="stat-card" role="group" aria-label="발견된 메이트 수">
            <div className="stat-icon" aria-hidden="true">
              <UsersIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{nearbyUsers.length}</div>
              <div className="stat-label">발견된 메이트</div>
            </div>
          </div>
          <div className="stat-card" role="group" aria-label="온라인 메이트 수">
            <div className="stat-icon online" aria-hidden="true">
              <WifiIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{nearbyUsers.filter(u => u.isOnline).length}</div>
              <div className="stat-label">온라인</div>
            </div>
          </div>
          <div className="stat-card" role="group" aria-label="탐색 횟수">
            <div className="stat-icon explore" aria-hidden="true">
              <CompassIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{discoveryCount}</div>
              <div className="stat-label">탐색 횟수</div>
            </div>
          </div>
        </section>

        {isInitialLoading ? (
          <div className="location-skeleton">
            <div className="skeleton-icon" />
            <div className="skeleton-content">
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
            </div>
          </div>
        ) : (
          currentLocation && (
            <div className="location-info">
              <div className="location-card">
                <div className="location-icon" aria-hidden="true">
                  <MapPinIcon />
                </div>
                <div className="location-content">
                  <div className={`location-status ${!isLocationEnabled ? 'default' : ''}`}>
                    {isLocationEnabled ? '실제 GPS 위치' : '기본 위치 사용 중'}
                  </div>
                  <div className="location-address">
                    {currentLocation.address ||
                      `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
                  </div>
                  <div className="location-debug">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </div>
                  <div className="search-radius">
                    <label htmlFor="radius-select">검색 반경:</label>
                    <select
                      id="radius-select"
                      value={searchRadius}
                      onChange={e => setSearchRadius(Number(e.target.value))}
                      className="radius-select"
                    >
                      <option value={1}>1km 이내</option>
                      <option value={3}>3km 이내</option>
                      <option value={5}>5km 이내</option>
                      <option value={10}>10km 이내</option>
                      <option value={20}>20km 이내</option>
                    </select>
                  </div>
                  {!isLocationEnabled && (
                    <>
                      <div className="location-tip">
                        더 정확한 위치를 원하시면 브라우저에서 위치 권한을 허용해주세요
                      </div>
                      <div className="location-buttons">
                        <button
                          onClick={requestLocationPermission}
                          className="location-btn primary"
                        >
                          <MapPinIcon />
                          위치 권한 요청
                        </button>
                        <button onClick={setManualLocation} className="location-btn secondary">
                          경기광주로 설정
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        <div className="discovery-section">
          <h2>여행 메이트 발견하기</h2>

          <fieldset className="mood-selector">
            <legend>
              <span className="legend-text">현재 나의 여행 기분</span>
            </legend>
            <div className="mood-options" role="radiogroup" aria-label="여행 기분 선택">
              {moods.map(mood => (
                <button
                  key={mood}
                  className={`mood-btn ${currentMood === mood ? 'active' : ''}`}
                  onClick={() => setCurrentMood(mood)}
                  role="radio"
                  aria-checked={currentMood === mood}
                >
                  {mood}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="discovery-area">
            <div className={`radar-container ${isDiscovering ? 'active' : ''}`} aria-hidden="true">
              <div className="radar-circle">
                <div className="radar-sweep" />
                <div className="radar-ring ring-1" />
                <div className="radar-ring ring-2" />
                <div className="radar-ring ring-3" />
                <div className="center-dot" />
              </div>
            </div>

            <button
              className={`discovery-btn ${isDiscovering ? 'discovering' : ''}`}
              onClick={discoverNearbyMates}
              disabled={isDiscovering}
              aria-busy={isDiscovering}
            >
              {isDiscovering ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>탐색 중...</span>
                </>
              ) : (
                <>
                  <RefreshIcon />
                  <span>주변 메이트 발견하기</span>
                </>
              )}
            </button>

            <p className="discovery-info">실시간 위치 기반으로 가까운 여행 메이트를 찾아드립니다</p>
          </div>
        </div>

        {nearbyUsers.length > 0 ? (
          <section className="nearby-users-section" aria-label="발견된 여행 메이트 목록">
            <div className="section-header">
              <h2>발견된 여행 메이트</h2>
              <span className="badge">{nearbyUsers.length}명</span>
            </div>
            <div className="nearby-users" role="list">
              {nearbyUsers.map(user => (
                <article
                  key={user.id}
                  className="user-card"
                  role="listitem"
                  aria-label={`${user.name}, ${user.age}세, 매칭도 ${user.matchScore}%`}
                >
                  <div className="user-profile">
                    <Avatar name={user.name} image={user.profileImage} />
                    <div className="user-info">
                      <div className="user-header">
                        <h4>{user.name}</h4>
                        <span className="user-age">{user.age}세</span>
                        <span
                          className={`online-indicator ${user.isOnline ? 'online' : 'offline'}`}
                          aria-label={user.isOnline ? '온라인' : '오프라인'}
                        />
                      </div>
                      <p className="user-mood">{user.mood}</p>
                      <p className="user-details">
                        <MapPinIcon /> {user.distance}km · {user.travelStyle}
                      </p>
                      <div className="user-interests" aria-label="관심사">
                        {user.interests.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="interest-tag">
                            #{interest}
                          </span>
                        ))}
                      </div>
                      <p className="user-bio">{user.bio}</p>
                      <div className="match-score-bar">
                        <div className="match-label">
                          <span>매칭도</span>
                          <strong>{user.matchScore}%</strong>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${user.matchScore}%` }}
                            aria-label={`매칭도 ${user.matchScore}퍼센트`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button
                      className="btn-action primary"
                      onClick={() => startChat(user)}
                      aria-label={`${user.name}님과 채팅 시작`}
                    >
                      <MessageCircleIcon />
                      채팅 시작
                    </button>
                    <button
                      className="btn-action secondary"
                      onClick={() => sendGreeting(user)}
                      aria-label={`${user.name}님에게 인사하기`}
                    >
                      인사하기
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : discoveryCount > 0 && !isDiscovering ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <UsersIcon />
            </div>
            <h3>주변에 여행 메이트가 없어요</h3>
            <p>검색 반경을 넓히거나 다른 시간에 다시 시도해보세요</p>
            <button className="btn-retry" onClick={discoverNearbyMates}>
              <RefreshIcon />
              다시 검색하기
            </button>
          </div>
        ) : null}

        <nav className="quick-actions" aria-label="빠른 액션">
          <h2>빠른 액션</h2>
          <div className="actions-grid">
            <button
              className="action-card"
              onClick={() => navigate('/groups/create')}
              aria-label="여행 그룹 만들기"
            >
              <div className="action-icon" aria-hidden="true">
                <MapIcon />
              </div>
              <div className="action-label">여행 그룹 만들기</div>
            </button>
            <button
              className="action-card"
              onClick={() => navigate('/groups')}
              aria-label="그룹 찾기"
            >
              <div className="action-icon" aria-hidden="true">
                <SearchIcon />
              </div>
              <div className="action-label">그룹 찾기</div>
            </button>
            <button
              className="action-card"
              onClick={() => navigate('/chat')}
              aria-label="채팅방으로 이동"
            >
              <div className="action-icon" aria-hidden="true">
                <MessageCircleIcon />
              </div>
              <div className="action-label">채팅방</div>
            </button>
            <button
              className="action-card"
              onClick={() => navigate('/profile')}
              aria-label="내 프로필 보기"
            >
              <div className="action-icon" aria-hidden="true">
                <UserIcon />
              </div>
              <div className="action-label">내 프로필</div>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Dashboard;
