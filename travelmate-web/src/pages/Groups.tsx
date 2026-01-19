import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { groupService, TravelGroup } from '../services/groupService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

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

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<TravelGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'my' | 'recommended'>('all');
  const [filters, setFilters] = useState({
    destination: '',
    travelStyle: '',
    status: 'recruiting',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const travelStyles = [
    '전체',
    '자연관광',
    '문화탐방',
    '미식투어',
    '모험가',
    '힐링여행',
    '사진가',
    '배낭여행',
    '럭셔리 여행',
    '등산/트레킹',
  ];

  const statusLabels: Record<string, string> = {
    recruiting: '모집중',
    full: '모집완료',
    active: '진행중',
    completed: '완료',
  };

  const statusColors: Record<string, string> = {
    recruiting: 'bg-emerald-500',
    full: 'bg-amber-500',
    active: 'bg-blue-500',
    completed: 'bg-gray-500',
  };

  useEffect(() => {
    loadGroups();
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterGroups();
  }, [groups, searchQuery, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGroups = async () => {
    setIsLoading(true);

    try {
      let loadedGroups: TravelGroup[] = [];

      switch (selectedTab) {
        case 'all':
          loadedGroups = await groupService.getAllGroups();
          break;
        case 'my':
          loadedGroups = await groupService.getMyGroups();
          break;
        case 'recommended':
          loadedGroups = await groupService.getRecommendedGroups();
          break;
      }

      setGroups(loadedGroups);
    } catch (error) {
      logError('Groups.loadGroups', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const filterGroups = async () => {
    let filtered = [...groups];

    if (searchQuery.trim()) {
      try {
        filtered = await groupService.searchGroups(searchQuery.trim(), {
          destination: filters.destination || undefined,
          travelStyle:
            filters.travelStyle && filters.travelStyle !== '전체' ? filters.travelStyle : undefined,
          status: filters.status || undefined,
        });
      } catch {
        // 에러 발생 시 로컬 필터링 사용
      }
    } else {
      if (filters.destination) {
        filtered = filtered.filter(group =>
          group.destination.toLowerCase().includes(filters.destination.toLowerCase())
        );
      }

      if (filters.travelStyle && filters.travelStyle !== '전체') {
        filtered = filtered.filter(group => group.travelStyle === filters.travelStyle);
      }

      if (filters.status) {
        filtered = filtered.filter(group => group.status === filters.status);
      }
    }

    setFilteredGroups(filtered);
  };

  const handleJoinGroup = async (groupId: string) => {
    setActionLoading(`join-${groupId}`);
    try {
      const success = await groupService.joinGroup(groupId);
      if (success) {
        toast.success('그룹에 성공적으로 가입했습니다!');
        await loadGroups();
      }
    } catch (error) {
      logError('Groups.handleJoinGroup', error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!window.confirm('정말 그룹에서 탈퇴하시겠습니까?')) return;

    setActionLoading(`leave-${groupId}`);
    try {
      const success = await groupService.leaveGroup(groupId);
      if (success) {
        toast.info('그룹에서 탈퇴했습니다.');
        await loadGroups();
      }
    } catch (error) {
      logError('Groups.handleLeaveGroup', error);
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatBudget = (budget?: { min: number; max: number; currency: string }) => {
    if (!budget) return '예산 미정';
    const min = (budget.min / 10000).toFixed(0);
    const max = (budget.max / 10000).toFixed(0);
    return `${min}~${max}만원`;
  };

  const isMyGroup = (group: TravelGroup) => {
    return group.members.some(member => member.id === groupService.getCurrentUserId());
  };

  const tabs = [
    { id: 'all', label: '전체 그룹', icon: '🌍' },
    { id: 'my', label: '내 그룹', icon: '👥' },
    { id: 'recommended', label: '추천 그룹', icon: '⭐' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute top-20 left-10 w-72 h-72 bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite' }}
      />
      <div
        className="absolute top-40 right-10 w-96 h-96 bg-pink-400/20 dark:bg-pink-600/15 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 2s' }}
      />
      <div
        className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/15 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 4s' }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl px-6 py-3 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Logo size="md" />
              <span className="font-bold text-gray-900 dark:text-white">Fryndo</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                대시보드
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Travel Groups
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            함께할 여행 메이트를 찾고 멋진 추억을 만들어보세요!
          </p>
          <motion.button
            onClick={() => navigate('/groups/create')}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full font-semibold text-lg shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-xl">✨</span>새 그룹 만들기
          </motion.button>
        </motion.header>

        {/* Tabs */}
        <motion.nav
          className="flex justify-center gap-2 mb-8"
          {...fadeInUp}
          transition={{ delay: 0.1 }}
          role="tablist"
          aria-label="그룹 카테고리"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/80 dark:bg-gray-900/80 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-800/50'
              }`}
              role="tab"
              aria-selected={selectedTab === tab.id}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.nav>

        {/* Search and Filters */}
        <motion.div
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg mb-8"
          {...fadeInUp}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="search"
                placeholder="그룹명, 목적지, 태그로 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.destination}
                onChange={e => setFilters({ ...filters, destination: e.target.value })}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">전체 지역</option>
                <option value="서울">서울</option>
                <option value="부산">부산</option>
                <option value="제주">제주</option>
                <option value="경주">경주</option>
                <option value="강릉">강릉</option>
                <option value="여수">여수</option>
                <option value="전주">전주</option>
              </select>

              <select
                value={filters.travelStyle}
                onChange={e => setFilters({ ...filters, travelStyle: e.target.value })}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {travelStyles.map(style => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">전체 상태</option>
                <option value="recruiting">모집중</option>
                <option value="full">모집완료</option>
                <option value="active">진행중</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Groups List */}
        {isLoading ? (
          <motion.div className="flex flex-col items-center justify-center py-20" {...fadeInUp}>
            <div className="w-16 h-16 rounded-full border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">여행 그룹을 불러오는 중...</p>
          </motion.div>
        ) : filteredGroups.length === 0 ? (
          <motion.div
            className="text-center py-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg"
            {...fadeInUp}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-400/20 to-pink-400/20 dark:from-violet-500/30 dark:to-pink-500/30 flex items-center justify-center text-4xl">
              🗺️
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              검색 결과가 없습니다
            </h2>
            <p className="text-gray-500 dark:text-gray-400">다른 검색어나 필터를 시도해보세요.</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            role="list"
          >
            {filteredGroups.map(group => (
              <motion.article
                key={group.id}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                variants={fadeInUp}
                role="listitem"
                whileHover={{ scale: 1.02 }}
              >
                {/* Cover Image */}
                {group.coverImage && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={group.coverImage}
                      alt={`${group.name} 그룹 커버`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span
                      className={`absolute top-3 right-3 px-3 py-1 ${statusColors[group.status]} text-white text-xs font-semibold rounded-full`}
                    >
                      {statusLabels[group.status]}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                      {group.name}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      👥 {group.currentMembers}/{group.maxMembers}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2">📍 {group.destination}</p>
                    <p className="flex items-center gap-2">
                      📅 {formatDate(group.startDate)} - {formatDate(group.endDate)}
                    </p>
                    <p className="flex items-center gap-2">💰 {formatBudget(group.budget)}</p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {group.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {group.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Leader */}
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <span className="text-amber-500">👑</span>
                    <span className="text-gray-600 dark:text-gray-400">리더:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {group.members.find(m => m.role === 'leader')?.name || '알 수 없음'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {isMyGroup(group) ? (
                      <>
                        <button
                          onClick={() => navigate(`/groups/${group.id}`)}
                          className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                          그룹 보기
                        </button>
                        {group.members.find(m => m.id === groupService.getCurrentUserId())?.role !==
                          'leader' && (
                          <button
                            onClick={() => handleLeaveGroup(group.id)}
                            disabled={actionLoading === `leave-${group.id}`}
                            className="px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all disabled:opacity-50"
                          >
                            {actionLoading === `leave-${group.id}` ? '...' : '탈퇴'}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/groups/${group.id}`)}
                          className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                          상세보기
                        </button>
                        {group.status === 'recruiting' && (
                          <button
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={actionLoading === `join-${group.id}`}
                            className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50"
                          >
                            {actionLoading === `join-${group.id}` ? '가입중...' : '가입하기'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </main>

      {/* Blob animation keyframes */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default Groups;
