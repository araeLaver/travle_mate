import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService, TravelGroup } from '../services/groupService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import './Groups.css';

// SVG Icons
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

const SparklesIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
    <path d="M19 12l.5 1.5L21 14l-1.5.5L19 16l-.5-1.5L17 14l1.5-.5L19 12z" />
  </svg>
);

const GlobeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

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

const StarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const WalletIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
  </svg>
);

const CrownIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" />
  </svg>
);

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

  const statusLabels = {
    recruiting: '모집중',
    full: '모집완료',
    active: '진행중',
    completed: '완료',
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

    // 검색어 필터링
    if (searchQuery.trim()) {
      try {
        filtered = await groupService.searchGroups(searchQuery.trim(), {
          destination: filters.destination || undefined,
          travelStyle:
            filters.travelStyle && filters.travelStyle !== '전체' ? filters.travelStyle : undefined,
          status: filters.status || undefined,
        });
      } catch (error) {
        // 에러 발생 시 로컬 필터링 사용
      }
    } else {
      // 추가 필터 적용 (검색어가 없을 때)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return '#28a745';
      case 'full':
        return '#fd7e14';
      case 'active':
        return '#007bff';
      case 'completed':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const isMyGroup = (group: TravelGroup) => {
    return group.members.some(member => member.id === groupService.getCurrentUserId());
  };

  if (isLoading) {
    return (
      <div className="groups-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true">
          <MapIcon />
        </div>
        <p>여행 그룹을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="groups-content">
        {/* 헤더 */}
        <header className="groups-header">
          <h1>Travel Groups</h1>
          <p>함께할 여행 메이트를 찾고 멋진 추억을 만들어보세요!</p>

          <button
            className="create-group-btn"
            onClick={() => navigate('/groups/create')}
            aria-label="새 여행 그룹 만들기"
          >
            <SparklesIcon /> 새 그룹 만들기
          </button>
        </header>

        {/* 탭 네비게이션 */}
        <nav className="groups-tabs" role="tablist" aria-label="그룹 카테고리">
          <button
            className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTab('all')}
            role="tab"
            id="tab-all"
            aria-selected={selectedTab === 'all'}
            aria-controls="tabpanel-groups"
            tabIndex={selectedTab === 'all' ? 0 : -1}
          >
            <GlobeIcon /> 전체 그룹
          </button>
          <button
            className={`tab-btn ${selectedTab === 'my' ? 'active' : ''}`}
            onClick={() => setSelectedTab('my')}
            role="tab"
            id="tab-my"
            aria-selected={selectedTab === 'my'}
            aria-controls="tabpanel-groups"
            tabIndex={selectedTab === 'my' ? 0 : -1}
          >
            <UsersIcon /> 내 그룹
          </button>
          <button
            className={`tab-btn ${selectedTab === 'recommended' ? 'active' : ''}`}
            onClick={() => setSelectedTab('recommended')}
            role="tab"
            id="tab-recommended"
            aria-selected={selectedTab === 'recommended'}
            aria-controls="tabpanel-groups"
            tabIndex={selectedTab === 'recommended' ? 0 : -1}
          >
            <StarIcon /> 추천 그룹
          </button>
        </nav>

        {/* 검색 및 필터 */}
        <search className="groups-filters" role="search" aria-label="그룹 검색 및 필터">
          <div className="search-bar">
            <label htmlFor="group-search" className="sr-only">
              그룹 검색
            </label>
            <input
              id="group-search"
              type="search"
              placeholder="그룹명, 목적지, 태그로 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              aria-describedby="search-hint"
            />
            <span className="search-icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <span id="search-hint" className="sr-only">
              엔터를 눌러 검색
            </span>
          </div>

          <div className="filter-row" role="group" aria-label="필터 옵션">
            <label htmlFor="filter-destination" className="sr-only">
              지역 필터
            </label>
            <select
              id="filter-destination"
              value={filters.destination}
              onChange={e => setFilters({ ...filters, destination: e.target.value })}
              className="filter-select"
              aria-label="지역 선택"
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

            <label htmlFor="filter-style" className="sr-only">
              여행 스타일 필터
            </label>
            <select
              id="filter-style"
              value={filters.travelStyle}
              onChange={e => setFilters({ ...filters, travelStyle: e.target.value })}
              className="filter-select"
              aria-label="여행 스타일 선택"
            >
              {travelStyles.map(style => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>

            <label htmlFor="filter-status" className="sr-only">
              상태 필터
            </label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="filter-select"
              aria-label="모집 상태 선택"
            >
              <option value="">전체 상태</option>
              <option value="recruiting">모집중</option>
              <option value="full">모집완료</option>
              <option value="active">진행중</option>
            </select>
          </div>
        </search>

        {/* 그룹 목록 */}
        <section
          id="tabpanel-groups"
          className="groups-list"
          role="tabpanel"
          aria-labelledby={`tab-${selectedTab}`}
          aria-label={`${selectedTab === 'all' ? '전체' : selectedTab === 'my' ? '내' : '추천'} 그룹 목록`}
        >
          {filteredGroups.length === 0 ? (
            <div className="empty-groups" role="status">
              <div className="empty-icon" aria-hidden="true">
                <MapIcon />
              </div>
              <h2>검색 결과가 없습니다</h2>
              <p>다른 검색어나 필터를 시도해보세요.</p>
            </div>
          ) : (
            <div className="groups-grid" role="list">
              {filteredGroups.map(group => (
                <article
                  key={group.id}
                  className="group-card"
                  role="listitem"
                  aria-label={`${group.name} - ${group.destination}, ${statusLabels[group.status]}`}
                >
                  {group.coverImage && (
                    <div className="group-image">
                      <img src={group.coverImage} alt={`${group.name} 그룹 커버 이미지`} />
                      <div
                        className="group-status"
                        style={{ backgroundColor: getStatusColor(group.status) }}
                        aria-label={`모집 상태: ${statusLabels[group.status]}`}
                      >
                        {statusLabels[group.status]}
                      </div>
                    </div>
                  )}

                  <div className="group-content">
                    <div className="group-header">
                      <h3 className="group-name">{group.name}</h3>
                      <div
                        className="group-members"
                        aria-label={`참여 인원 ${group.currentMembers}명 중 ${group.maxMembers}명`}
                      >
                        {group.currentMembers}/{group.maxMembers}명
                      </div>
                    </div>

                    <p className="group-destination">
                      <MapPinIcon /> {group.destination}
                    </p>
                    <p className="group-dates">
                      <CalendarIcon /> {formatDate(group.startDate)} - {formatDate(group.endDate)}
                    </p>
                    <p className="group-budget">
                      <WalletIcon /> {formatBudget(group.budget)}
                    </p>

                    <p className="group-description">{group.description}</p>

                    <div className="group-tags" aria-label="태그">
                      {group.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="group-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="group-leader">
                      <span className="leader-label">
                        <CrownIcon /> 리더:
                      </span>
                      <span className="leader-name">
                        {group.members.find(m => m.role === 'leader')?.name || '알 수 없음'}
                      </span>
                    </div>
                  </div>

                  <div className="group-actions">
                    {isMyGroup(group) ? (
                      <div className="my-group-actions">
                        <button
                          className="btn-small secondary"
                          onClick={() => navigate(`/groups/${group.id}`)}
                          aria-label={`${group.name} 그룹 보기`}
                        >
                          그룹 보기
                        </button>
                        {group.members.find(m => m.id === groupService.getCurrentUserId())?.role !==
                          'leader' && (
                          <button
                            className="btn-small danger"
                            onClick={() => handleLeaveGroup(group.id)}
                            disabled={actionLoading === `leave-${group.id}`}
                            aria-busy={actionLoading === `leave-${group.id}`}
                            aria-label={`${group.name} 그룹에서 탈퇴`}
                          >
                            {actionLoading === `leave-${group.id}` ? '처리중...' : '탈퇴하기'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="join-group-actions">
                        <button
                          className="btn-small secondary"
                          onClick={() => navigate(`/groups/${group.id}`)}
                          aria-label={`${group.name} 그룹 상세보기`}
                        >
                          상세보기
                        </button>
                        {group.status === 'recruiting' && (
                          <button
                            className="btn-small primary"
                            onClick={() => handleJoinGroup(group.id)}
                            disabled={actionLoading === `join-${group.id}`}
                            aria-busy={actionLoading === `join-${group.id}`}
                            aria-label={`${group.name} 그룹 가입하기`}
                          >
                            {actionLoading === `join-${group.id}` ? '가입중...' : '가입하기'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Groups;
