import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { locationService, TravelMate, Location } from '../services/locationService';
import { chatRestService } from '../services/chatRestService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import AdBanner from '../components/ads/AdBanner';
import { MatchCardSkeleton, ListItemSkeleton, SkeletonList } from '../components/SkeletonLoader';
import PageBackground from '../components/PageBackground';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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

  // 풀투리프레시를 위한 컨테이너 ref
  const mainContainerRef = useRef<HTMLDivElement>(null);

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

  // 풀투리프레시: 주변 메이트 재탐색
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(mainContainerRef, {
    onRefresh: discoverNearbyMates,
    threshold: 60,
  });

  const startChat = async (mate: TravelMate) => {
    const participantId = Number(mate.id);
    if (!Number.isFinite(participantId)) {
      toast.error('실제 사용자 정보가 있는 메이트와만 채팅을 시작할 수 있습니다.');
      return;
    }

    try {
      const room = await chatRestService.createChatRoom({
        roomName: mate.name,
        roomType: 'PRIVATE',
        participantIds: [mate.id],
      });
      navigate(`/chat/${room.id}`);
    } catch (error) {
      logError('Dashboard.startChat', error);
      toast.error(getErrorMessage(error));
    }
  };

  const sendGreeting = (mate: TravelMate) => {
    toast.success(`${mate.name}님에게 인사를 보냈습니다!`);
  };

  const requestLocationPermission = async () => {
    await initializeLocation();
  };

  const setManualLocation = async () => {
    try {
      const gwangjuLocation = await locationService.setManualLocation({
        latitude: 37.4138,
        longitude: 127.2557,
        address: '경기도 광주시 (수동 설정)',
      });

      setCurrentLocation(gwangjuLocation);
      setIsLocationEnabled(true);
    } catch (error) {
      logError('Dashboard.setManualLocation', error);
      toast.error(getErrorMessage(error));
    }
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
          className="rounded-full object-cover border-3 border-white shadow-[0_4px_12px_rgba(16,16,20,0.12)]"
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
        className="flex items-center justify-center rounded-full bg-primary-500 border-3 border-white shadow-[0_4px_12px_rgba(16,16,20,0.12)] text-white font-bold"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-label={`${name}의 프로필`}
      >
        {initials}
      </div>
    );
  };

  // 틴트 아이콘 타일 (디자인 시스템: #ECEBFF / #FDF3E4 / #F1EAFC / success 틴트)
  const quickActions = [
    {
      label: '그룹 만들기',
      icon: '🗺️',
      path: '/groups/create',
      tint: 'bg-primary-100',
    },
    { label: '그룹 찾기', icon: '🔍', path: '/groups', tint: 'bg-[#EAF5EE]' },
    { label: '채팅방', icon: '💬', path: '/chat', tint: 'bg-[#F1EAFC]' },
    { label: '내 프로필', icon: '👤', path: '/profile', tint: 'bg-[#FDF3E4]' },
    { label: '매칭', icon: '🤝', path: '/matching', tint: 'bg-primary-100' },
    { label: 'AI 추천', icon: '🤖', path: '/ai', tint: 'bg-[#F1EAFC]' },
    { label: '리더보드', icon: '🏆', path: '/leaderboard', tint: 'bg-[#FDF3E4]' },
    {
      label: '알림 설정',
      icon: '🔔',
      path: '/settings/notifications',
      tint: 'bg-primary-100',
    },
  ];

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] relative overflow-hidden">
      <PageBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl px-6 py-3 border border-sand-300 dark:border-gray-800 shadow-[0_10px_30px_rgba(16,16,20,0.06)]">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Logo size="md" />
              <span className="font-extrabold tracking-tight text-ink dark:text-white">Fryndo</span>
            </button>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main ref={mainContainerRef} className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Pull-to-refresh 인디케이터 */}
        {(isPulling || isRefreshing) && (
          <div
            className="flex items-center justify-center py-3 transition-all duration-200"
            style={{ height: isPulling ? Math.min(pullDistance, 60) : 48, overflow: 'hidden' }}
            aria-live="polite"
          >
            <div
              className={`flex items-center gap-2 text-sm text-primary-500 dark:text-primary-400 font-semibold ${isRefreshing ? 'animate-pulse' : ''}`}
            >
              <svg
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                style={{
                  transform:
                    isPulling && !isRefreshing
                      ? `rotate(${Math.min(pullDistance * 3, 180)}deg)`
                      : undefined,
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>
                {isRefreshing
                  ? '새로고침 중...'
                  : pullDistance >= 30
                    ? '놓으면 새로고침'
                    : '당겨서 새로고침'}
              </span>
            </div>
          </div>
        )}
        {/* Header */}
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold text-[#8A8A95] dark:text-gray-400 mb-2">
            {getTimeGreeting()},
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-primary-500">{userName}</span>
            <span className="text-ink dark:text-white">님!</span>
          </h1>
          <p className="text-[#74747F] dark:text-gray-400">오늘도 멋진 여행을 만들어보세요</p>
        </motion.header>

        {/* Stats Grid */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          aria-label="통계 요약"
        >
          {[
            {
              label: '발견된 메이트',
              value: nearbyUsers.length,
              icon: '👥',
              tint: 'bg-primary-100',
            },
            {
              label: '온라인',
              value: nearbyUsers.filter(u => u.isOnline).length,
              icon: '🟢',
              tint: 'bg-[#EAF5EE]',
            },
            { label: '탐색 횟수', value: discoveryCount, icon: '🧭', tint: 'bg-[#FDF3E4]' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-[18px] p-5 dark:border dark:border-gray-800 shadow-[0_10px_30px_rgba(16,16,20,0.06)] hover:shadow-[0_10px_30px_rgba(16,16,20,0.1)] transition-all duration-300 hover:-translate-y-1"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl ${stat.tint} dark:bg-gray-800 flex items-center justify-center text-2xl`}
                >
                  {stat.icon}
                </div>
                <div>
                  <div className="font-display text-[34px] leading-none font-bold text-ink dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-[#8A8A95] dark:text-gray-400 mt-1.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Location Card */}
        <motion.section className="mb-8" {...fadeInUp} transition={{ delay: 0.2 }}>
          {isInitialLoading ? (
            <ListItemSkeleton />
          ) : (
            currentLocation && (
              <div className="bg-white dark:bg-gray-900 rounded-[18px] p-6 dark:border dark:border-gray-800 shadow-[0_10px_30px_rgba(16,16,20,0.06)]">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#FDF3E4] dark:bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                    📍
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-bold mb-1 ${isLocationEnabled ? 'text-success' : 'text-rarity-legendary'}`}
                    >
                      {isLocationEnabled ? '실제 GPS 위치' : '기본 위치 사용 중'}
                    </div>
                    <div className="text-ink dark:text-white font-semibold mb-2">
                      {currentLocation.address ||
                        `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
                    </div>
                    <div className="text-xs text-[#9A9AA4] dark:text-gray-500 font-mono mb-3">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <label
                        htmlFor="radius-select"
                        className="text-sm font-semibold text-[#4A4A55] dark:text-gray-400"
                      >
                        검색 반경:
                      </label>
                      <select
                        id="radius-select"
                        value={searchRadius}
                        onChange={e => setSearchRadius(Number(e.target.value))}
                        className="px-4 py-2 bg-sand-100 dark:bg-gray-800 border-0 dark:border dark:border-gray-700 rounded-[13px] text-sm font-semibold text-ink dark:text-white focus:outline-none focus:bg-white focus:ring-[1.5px] focus:ring-primary-500"
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
                        <p className="text-sm text-[#74747F] dark:text-gray-400 mb-3">
                          더 정확한 위치를 원하시면 브라우저에서 위치 권한을 허용해주세요
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={requestLocationPermission}
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"
                          >
                            📍 위치 권한 요청
                          </button>
                          <button
                            onClick={setManualLocation}
                            className="px-4 py-2 bg-sand-200 hover:bg-sand-400 text-ink dark:bg-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold transition-all duration-300"
                          >
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
        </motion.section>

        {/* Discovery Section */}
        <motion.section
          className="bg-white dark:bg-gray-900 rounded-[20px] p-8 dark:border dark:border-gray-800 shadow-[0_10px_30px_rgba(16,16,20,0.06)] mb-8"
          {...fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-center text-ink dark:text-white mb-8">
            여행 메이트 발견하기
          </h2>

          {/* Mood Selector */}
          <fieldset className="mb-8">
            <legend className="text-center text-[#74747F] dark:text-gray-400 font-semibold mb-4">
              현재 나의 여행 기분
            </legend>
            <div
              className="flex flex-wrap justify-center gap-3"
              role="radiogroup"
              aria-label="여행 기분 선택"
            >
              {moods.map(mood => (
                <button
                  key={mood}
                  className={`h-9 px-4 rounded-[10px] text-sm font-bold transition-all duration-300 ${
                    currentMood === mood
                      ? 'bg-ink text-white dark:bg-white dark:text-ink'
                      : 'bg-sand-100 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-400 hover:bg-sand-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setCurrentMood(mood)}
                  role="radio"
                  aria-checked={currentMood === mood}
                >
                  {mood}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Radar Animation */}
          <div className="flex flex-col items-center">
            <div className={`relative w-44 h-44 mb-8 ${isDiscovering ? 'animate-pulse' : ''}`}>
              <div className="absolute inset-0 rounded-full border-2 border-primary-100 dark:border-primary-500/30" />
              <div className="absolute inset-4 rounded-full border-2 border-primary-200 dark:border-primary-500/40" />
              <div className="absolute inset-8 rounded-full border-2 border-primary-300 dark:border-primary-500/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`w-6 h-6 rounded-full bg-primary-500 shadow-[0_8px_22px_rgba(74,58,255,0.3)] ${isDiscovering ? 'animate-ping' : ''}`}
                />
              </div>
              {isDiscovering && (
                <div
                  className="absolute top-1/2 left-1/2 w-1 h-1/2 bg-gradient-to-b from-primary-500 to-transparent origin-bottom"
                  style={{ animation: 'spin 2s linear infinite' }}
                />
              )}
            </div>

            <button
              className={`discovery-btn px-10 py-4 rounded-[15px] font-extrabold text-white text-lg transition-all duration-300 flex items-center gap-3 ${
                isDiscovering
                  ? 'bg-primary-400'
                  : 'bg-primary-500 hover:bg-primary-700 shadow-[0_8px_22px_rgba(74,58,255,0.3)] hover:-translate-y-1'
              }`}
              onClick={discoverNearbyMates}
              disabled={isDiscovering}
              aria-busy={isDiscovering}
            >
              {isDiscovering ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>탐색 중...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🔄</span>
                  <span>주변 메이트 발견하기</span>
                </>
              )}
            </button>

            <p className="text-[#74747F] dark:text-gray-400 text-sm mt-4">
              실시간 위치 기반으로 가까운 여행 메이트를 찾아드립니다
            </p>
          </div>
        </motion.section>

        {/* Nearby Users - Discovering skeleton */}
        {isDiscovering && nearbyUsers.length === 0 && (
          <motion.section className="mb-8" {...fadeInUp} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white">
                여행 메이트 탐색 중...
              </h2>
            </div>
            <SkeletonList
              count={4}
              skeleton={<MatchCardSkeleton />}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            />
          </motion.section>
        )}

        {/* Nearby Users */}
        {nearbyUsers.length > 0 ? (
          <motion.section
            className="mb-8"
            {...fadeInUp}
            transition={{ delay: 0.4 }}
            aria-label="발견된 여행 메이트 목록"
          >
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white">
                발견된 여행 메이트
              </h2>
              <span className="px-3 py-1 bg-primary-500 text-white text-sm font-extrabold rounded-[9px]">
                {nearbyUsers.length}명
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="list">
              {nearbyUsers.map(user => (
                <motion.article
                  key={user.id}
                  className="bg-white dark:bg-gray-900 rounded-[18px] p-6 dark:border dark:border-gray-800 shadow-[0_10px_30px_rgba(16,16,20,0.06)] hover:shadow-[0_10px_30px_rgba(16,16,20,0.1)] transition-all duration-300 hover:-translate-y-2"
                  role="listitem"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex gap-4 mb-4">
                    <Avatar name={user.name} image={user.profileImage} size={72} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-extrabold text-ink dark:text-white">
                          {user.name}
                        </h4>
                        <span className="text-sm text-[#8A8A95] dark:text-gray-400">
                          {user.age}세
                        </span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ml-auto ${user.isOnline ? 'bg-success shadow-[0_0_8px_rgba(63,143,95,0.5)]' : 'bg-sand-400 dark:bg-gray-600'}`}
                          aria-label={user.isOnline ? '온라인' : '오프라인'}
                        />
                      </div>
                      <p className="text-primary-500 dark:text-primary-400 font-bold mb-1">
                        {user.mood}
                      </p>
                      <p className="text-sm text-[#74747F] dark:text-gray-400 flex items-center gap-1">
                        📍 {user.distance}km · {user.travelStyle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {user.interests.slice(0, 3).map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-500 dark:text-primary-400 text-xs font-bold rounded-[8px]"
                      >
                        #{interest}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-[#74747F] dark:text-gray-400 mb-4">{user.bio}</p>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-[#4A4A55] dark:text-gray-400">
                        매칭도
                      </span>
                      <span className="text-primary-500 dark:text-primary-400 font-extrabold">
                        {user.matchScore}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#EDECE8] dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${user.matchScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="flex-1 py-3 bg-primary-500 hover:bg-primary-700 text-white rounded-xl font-bold shadow-[0_8px_22px_rgba(74,58,255,0.2)] transition-all duration-300 flex items-center justify-center gap-2"
                      onClick={() => void startChat(user)}
                      aria-label={`${user.name}님과 채팅 시작`}
                    >
                      💬 채팅 시작
                    </button>
                    <button
                      className="flex-1 py-3 bg-sand-200 dark:bg-gray-800 text-ink dark:text-gray-300 rounded-xl font-bold hover:bg-sand-400 dark:hover:bg-gray-700 transition-all duration-300"
                      onClick={() => sendGreeting(user)}
                      aria-label={`${user.name}님에게 인사하기`}
                    >
                      인사하기
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.section>
        ) : discoveryCount > 0 && !isDiscovering ? (
          <motion.div
            className="text-center py-16 bg-white dark:bg-gray-900 rounded-[18px] dark:border dark:border-gray-800 shadow-[0_10px_30px_rgba(16,16,20,0.06)] mb-8"
            {...fadeInUp}
            transition={{ delay: 0.4 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-4xl">
              👥
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-2">
              주변에 여행 메이트가 없어요
            </h3>
            <p className="text-[#74747F] dark:text-gray-400 mb-6">
              검색 반경을 넓히거나 다른 시간에 다시 시도해보세요
            </p>
            <button
              className="px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white rounded-[15px] font-bold shadow-[0_8px_22px_rgba(74,58,255,0.3)] transition-all duration-300 flex items-center gap-2 mx-auto"
              onClick={discoverNearbyMates}
            >
              🔄 다시 검색하기
            </button>
          </motion.div>
        ) : null}

        {/* Ad Banner */}
        <div className="mb-8">
          <AdBanner adSlot="DASHBOARD_BOTTOM" adFormat="horizontal" />
        </div>

        {/* Quick Actions */}
        <motion.nav
          className="bg-white dark:bg-gray-900 rounded-[20px] p-8 dark:border dark:border-gray-800 shadow-[0_10px_30px_rgba(16,16,20,0.06)]"
          {...fadeInUp}
          transition={{ delay: 0.5 }}
          aria-label="빠른 액션"
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-center text-ink dark:text-white mb-8">
            빠른 액션
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <motion.button
                key={idx}
                className="group p-6 bg-sand-100 dark:bg-gray-800/50 rounded-2xl hover:bg-sand-200 dark:hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(action.path)}
                whileHover={{ scale: 1.02 }}
                aria-label={action.label}
              >
                <div
                  className={`w-12 h-12 mx-auto mb-3 rounded-[14px] ${action.tint} dark:bg-gray-700 flex items-center justify-center text-2xl`}
                >
                  {action.icon}
                </div>
                <div className="text-sm font-bold text-[#4A4A55] dark:text-gray-300 group-hover:text-ink dark:group-hover:text-white transition-colors">
                  {action.label}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.nav>
      </main>
    </div>
  );
};

export default Dashboard;
