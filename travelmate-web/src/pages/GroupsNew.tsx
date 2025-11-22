import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TravelGroup } from '../services/groupService';
import { useGroups, useMyGroups, useRecommendedGroups, useJoinGroup, useLeaveGroup } from '../hooks/useGroups';
import './Groups.css';

const GroupsNew: React.FC = () => {
  const navigate = useNavigate();
  const [filteredGroups, setFilteredGroups] = useState<TravelGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'my' | 'recommended'>('all');
  const [filters, setFilters] = useState({
    destination: '',
    travelStyle: '',
    status: 'recruiting'
  });

  // React Query hooks
  const { data: allGroups, isLoading: isLoadingAll } = useGroups();
  const { data: myGroups, isLoading: isLoadingMy } = useMyGroups();
  const { data: recommendedGroups, isLoading: isLoadingRecommended } = useRecommendedGroups();
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();

  const travelStyles = [
    '전체', '자연관광', '문화탐방', '미식투어', '모험가', '힐링여행',
    '사진가', '배낭여행', '럭셔리 여행', '등산/트레킹'
  ];

  const statusLabels = {
    'recruiting': '모집중',
    'full': '모집완료',
    'active': '진행중',
    'completed': '완료'
  };

  // 현재 탭의 그룹 데이터 선택
  const currentGroups = selectedTab === 'all'
    ? allGroups
    : selectedTab === 'my'
    ? myGroups
    : recommendedGroups;

  const isLoading = selectedTab === 'all'
    ? isLoadingAll
    : selectedTab === 'my'
    ? isLoadingMy
    : isLoadingRecommended;

  useEffect(() => {
    filterGroups();
  }, [currentGroups, searchQuery, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterGroups = () => {
    if (!currentGroups) {
      setFilteredGroups([]);
      return;
    }

    let filtered = [...currentGroups];

    // 검색어 필터링
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchTerm) ||
        group.description.toLowerCase().includes(searchTerm) ||
        group.destination.toLowerCase().includes(searchTerm) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // 추가 필터 적용
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

    setFilteredGroups(filtered);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinGroupMutation.mutateAsync(groupId);
      alert('그룹에 성공적으로 가입했습니다! 🎉');
    } catch (error) {
      alert(`가입 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!window.confirm('정말 그룹에서 탈퇴하시겠습니까?')) return;

    try {
      await leaveGroupMutation.mutateAsync(groupId);
      alert('그룹에서 탈퇴했습니다.');
    } catch (error) {
      alert(`탈퇴 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatBudget = (budget?: { min: number; max: number; currency: string }) => {
    if (!budget) return '협의';
    const min = (budget.min / 10000).toFixed(0);
    const max = (budget.max / 10000).toFixed(0);
    return `${min}~${max}만원`;
  };

  const isMyGroup = (group: TravelGroup) => {
    return group.members.some(member => member.role === 'leader' || member.status === 'active');
  };

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>여행 그룹</h1>
        <button className="create-group-btn" onClick={() => navigate('/groups/create')}>
          + 새 그룹 만들기
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="groups-tabs">
        <button
          className={selectedTab === 'all' ? 'active' : ''}
          onClick={() => setSelectedTab('all')}
        >
          전체 그룹 {allGroups && `(${allGroups.length})`}
        </button>
        <button
          className={selectedTab === 'my' ? 'active' : ''}
          onClick={() => setSelectedTab('my')}
        >
          내 그룹 {myGroups && `(${myGroups.length})`}
        </button>
        <button
          className={selectedTab === 'recommended' ? 'active' : ''}
          onClick={() => setSelectedTab('recommended')}
        >
          추천 그룹
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="groups-search">
        <input
          type="text"
          placeholder="그룹명, 목적지, 태그로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select
          value={filters.destination}
          onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
          className="filter-select"
        >
          <option value="">모든 지역</option>
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
          onChange={(e) => setFilters({ ...filters, travelStyle: e.target.value })}
          className="filter-select"
        >
          {travelStyles.map(style => (
            <option key={style} value={style === '전체' ? '' : style}>
              {style}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">모든 상태</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>그룹 목록을 불러오는 중...</p>
        </div>
      )}

      {/* 그룹 목록 */}
      {!isLoading && filteredGroups.length === 0 && (
        <div className="no-groups">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}

      <div className="groups-grid">
        {filteredGroups.map(group => (
          <div key={group.id} className="group-card">
            {group.coverImage && (
              <div className="group-card-image"
                style={{ backgroundImage: `url(${group.coverImage})` }}>
                <span className={`status-badge ${group.status}`}>
                  {statusLabels[group.status]}
                </span>
              </div>
            )}

            <div className="group-card-content">
              <h3>{group.name}</h3>
              <p className="group-destination">{group.destination}</p>
              <p className="group-description">{group.description}</p>

              <div className="group-details">
                <div className="detail-item">
                  <span className="label">기간:</span>
                  <span>{formatDate(group.startDate)} ~ {formatDate(group.endDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">예산:</span>
                  <span>{formatBudget(group.budget)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">인원:</span>
                  <span>{group.currentMembers}/{group.maxMembers}명</span>
                </div>
                <div className="detail-item">
                  <span className="label">스타일:</span>
                  <span>{group.travelStyle}</span>
                </div>
              </div>

              <div className="group-tags">
                {group.tags.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>

              <div className="group-leader">
                <img
                  src={group.members.find(m => m.role === 'leader')?.profileImage || 'https://picsum.photos/40/40'}
                  alt="리더"
                  className="leader-avatar"
                />
                <span>리더: {group.members.find(m => m.role === 'leader')?.name || '알 수 없음'}</span>
              </div>

              <div className="group-actions">
                {isMyGroup(group) ? (
                  <>
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      그룹 보기
                    </button>
                    {group.members.find(m => m.role === 'leader')?.role !== 'leader' && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleLeaveGroup(group.id)}
                        disabled={leaveGroupMutation.isPending}
                      >
                        {leaveGroupMutation.isPending ? '처리 중...' : '탈퇴하기'}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      상세보기
                    </button>
                    {group.status === 'recruiting' && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={joinGroupMutation.isPending}
                      >
                        {joinGroupMutation.isPending ? '가입 중...' : '가입하기'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupsNew;
