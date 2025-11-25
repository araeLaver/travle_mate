import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService, TravelGroup } from '../services/groupService';
import './Groups.css';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<TravelGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'my' | 'recommended'>('all');
  const [filters, setFilters] = useState({
    destination: '',
    travelStyle: '',
    status: 'recruiting'
  });
  const [isLoading, setIsLoading] = useState(false);

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
      alert('그룹 목록을 불러오는데 실패했습니다.');
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
          travelStyle: filters.travelStyle && filters.travelStyle !== '전체' ? filters.travelStyle : undefined,
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
    try {
      const success = await groupService.joinGroup(groupId);
      if (success) {
        alert('그룹에 성공적으로 가입했습니다! 🎉');
        await loadGroups(); // 목록 새로고침
      }
    } catch (error) {
      alert(`가입 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!window.confirm('정말 그룹에서 탈퇴하시겠습니까?')) return;

    try {
      const success = await groupService.leaveGroup(groupId);
      if (success) {
        alert('그룹에서 탈퇴했습니다.');
        await loadGroups();
      }
    } catch (error) {
      alert(`탈퇴 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric'
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
      case 'recruiting': return '#28a745';
      case 'full': return '#fd7e14';
      case 'active': return '#007bff';
      case 'completed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const isMyGroup = (group: TravelGroup) => {
    return group.members.some(member => member.id === groupService.getCurrentUserId());
  };

  if (isLoading) {
    return (
      <div className="groups-loading">
        <div className="loading-spinner">🗺️</div>
        <p>여행 그룹을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="groups-container">
      {/* 헤더 */}
      <div className="groups-header">
        <h1>🗺️ 여행 그룹</h1>
        <p>함께할 여행 메이트를 찾고 멋진 추억을 만들어보세요!</p>
        
        <button 
          className="create-group-btn"
          onClick={() => navigate('/groups/create')}
        >
          ✨ 새 그룹 만들기
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="groups-tabs">
        <button 
          className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          🌐 전체 그룹
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'my' ? 'active' : ''}`}
          onClick={() => setSelectedTab('my')}
        >
          👥 내 그룹
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'recommended' ? 'active' : ''}`}
          onClick={() => setSelectedTab('recommended')}
        >
          ⭐ 추천 그룹
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="groups-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="그룹명, 목적지, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-row">
          <select
            value={filters.destination}
            onChange={(e) => setFilters({...filters, destination: e.target.value})}
            className="filter-select"
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
            onChange={(e) => setFilters({...filters, travelStyle: e.target.value})}
            className="filter-select"
          >
            {travelStyles.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="filter-select"
          >
            <option value="">전체 상태</option>
            <option value="recruiting">모집중</option>
            <option value="full">모집완료</option>
            <option value="active">진행중</option>
          </select>
        </div>
      </div>

      {/* 그룹 목록 */}
      <div className="groups-list">
        {filteredGroups.length === 0 ? (
          <div className="empty-groups">
            <div className="empty-icon">🗺️</div>
            <h3>검색 결과가 없습니다</h3>
            <p>다른 검색어나 필터를 시도해보세요.</p>
          </div>
        ) : (
          <div className="groups-grid">
            {filteredGroups.map(group => (
              <div key={group.id} className="group-card">
                {group.coverImage && (
                  <div className="group-image">
                    <img src={group.coverImage} alt={group.name} />
                    <div 
                      className="group-status"
                      style={{ backgroundColor: getStatusColor(group.status) }}
                    >
                      {statusLabels[group.status]}
                    </div>
                  </div>
                )}
                
                <div className="group-content">
                  <div className="group-header">
                    <h3 className="group-name">{group.name}</h3>
                    <div className="group-members">
                      {group.currentMembers}/{group.maxMembers}명
                    </div>
                  </div>
                  
                  <p className="group-destination">📍 {group.destination}</p>
                  <p className="group-dates">
                    🗓️ {formatDate(group.startDate)} - {formatDate(group.endDate)}
                  </p>
                  <p className="group-budget">💰 {formatBudget(group.budget)}</p>
                  
                  <p className="group-description">{group.description}</p>
                  
                  <div className="group-tags">
                    {group.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="group-tag">#{tag}</span>
                    ))}
                  </div>
                  
                  <div className="group-leader">
                    <span className="leader-label">👑 리더:</span>
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
                      >
                        그룹 보기
                      </button>
                      {group.members.find(m => m.id === groupService.getCurrentUserId())?.role !== 'leader' && (
                        <button 
                          className="btn-small danger"
                          onClick={() => handleLeaveGroup(group.id)}
                        >
                          탈퇴하기
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="join-group-actions">
                      <button 
                        className="btn-small secondary"
                        onClick={() => navigate(`/groups/${group.id}`)}
                      >
                        상세보기
                      </button>
                      {group.status === 'recruiting' && (
                        <button 
                          className="btn-small primary"
                          onClick={() => handleJoinGroup(group.id)}
                        >
                          가입하기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;