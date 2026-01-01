import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { locationService, TravelMate, Location } from '../services/locationService';
import { chatService } from '../services/chatService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [nearbyUsers, setNearbyUsers] = useState<TravelMate[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [currentMood, setCurrentMood] = useState('여행 중');
  const [discoveryCount, setDiscoveryCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  const moods = ['여행 중', '맛집 탐방', '산 좋아', '인생샷 찍기', '카페 투어', '문화 체험'];

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    const location = await locationService.getCurrentLocation();
    setCurrentLocation(location);

    const DEFAULT_LAT = 37.5665;
    const DEFAULT_LNG = 126.978;
    const EPSILON = 0.0001;

    const isDefaultLocation =
      Math.abs(location.latitude - DEFAULT_LAT) < EPSILON &&
      Math.abs(location.longitude - DEFAULT_LNG) < EPSILON;

    setIsLocationEnabled(!isDefaultLocation);
  };

  const discoverNearbyMates = async () => {
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
  };

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
    } catch (error) {
      // 주소 조회 실패시 기본 주소 사용
    }

    setCurrentLocation(gwangjuLocation);
    setIsLocationEnabled(true);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>오늘도 멋진 여행을 만들어보세요!</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{nearbyUsers.length}</div>
              <div className="stat-label">발견된 메이트</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎆</div>
            <div className="stat-content">
              <div className="stat-number">{nearbyUsers.filter(u => u.isOnline).length}</div>
              <div className="stat-label">온라인</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌟</div>
            <div className="stat-content">
              <div className="stat-number">{discoveryCount}</div>
              <div className="stat-label">탐색 횟수</div>
            </div>
          </div>
        </div>

        {currentLocation && (
          <div className="location-info">
            <div className="location-card">
              <div className="location-icon">📍</div>
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
                  검색 반경:
                  <select
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
                      <button onClick={requestLocationPermission} className="location-btn primary">
                        📍 위치 권한 요청
                      </button>
                      <button onClick={setManualLocation} className="location-btn secondary">
                        🎯 경기광주로 설정
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="discovery-section">
          <h2>여행 메이트 발견하기</h2>

          <div className="mood-selector">
            <h4>현재 나의 여행 기분</h4>
            <div className="mood-options">
              {moods.map(mood => (
                <button
                  key={mood}
                  className={`mood-btn ${currentMood === mood ? 'active' : ''}`}
                  onClick={() => setCurrentMood(mood)}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div className="discovery-area">
            <div className={`radar-container ${isDiscovering ? 'active' : ''}`}>
              <div className="radar-circle">
                <div className="radar-sweep"></div>
                <div className="center-dot"></div>
              </div>
            </div>

            <button
              className={`discovery-btn ${isDiscovering ? 'discovering' : ''}`}
              onClick={discoverNearbyMates}
              disabled={isDiscovering}
            >
              {isDiscovering ? '탐색 중...' : '주변 메이트 발견하기'}
            </button>

            <p className="discovery-info">실시간 위치 기반으로 가까운 여행 메이트를 찾아드립니다</p>
          </div>
        </div>

        {nearbyUsers.length > 0 && (
          <div className="nearby-users-section">
            <h2>발견된 여행 메이트</h2>
            <div className="nearby-users">
              {nearbyUsers.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-profile">
                    {user.profileImage && (
                      <img src={user.profileImage} alt={user.name} className="profile-image" />
                    )}
                    <div className="user-info">
                      <div className="user-header">
                        <h4>{user.name}</h4>
                        <span className="user-age">{user.age}세</span>
                        <span className={`online-status ${user.isOnline ? 'online' : 'offline'}`}>
                          {user.isOnline ? '🟢' : '⚪'}
                        </span>
                      </div>
                      <p className="user-mood">{user.mood}</p>
                      <p className="user-details">
                        📍 {user.distance}km · {user.travelStyle}
                      </p>
                      <div className="user-interests">
                        {user.interests.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="interest-tag">
                            #{interest}
                          </span>
                        ))}
                      </div>
                      <p className="user-bio">{user.bio}</p>
                      <div className="match-score">
                        매칭도: <strong>{user.matchScore}%</strong>
                      </div>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button className="btn-small primary" onClick={() => startChat(user)}>
                      채팅 시작
                    </button>
                    <button className="btn-small secondary" onClick={() => sendGreeting(user)}>
                      인사하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quick-actions">
          <h2>빠른 액션</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => navigate('/groups/create')}>
              <div className="action-icon">🗺️</div>
              <div className="action-label">여행 그룹 만들기</div>
            </button>
            <button className="action-card" onClick={() => navigate('/groups')}>
              <div className="action-icon">🔎</div>
              <div className="action-label">그룹 찾기</div>
            </button>
            <button className="action-card" onClick={() => navigate('/chat')}>
              <div className="action-icon">💬</div>
              <div className="action-label">채팅방</div>
            </button>
            <button className="action-card" onClick={() => navigate('/profile')}>
              <div className="action-icon">👤</div>
              <div className="action-label">내 프로필</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
