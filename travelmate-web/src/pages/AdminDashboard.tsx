import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useToast } from '../components/Toast';
import { AdminOverview, UserManagement } from '../components/admin';
import {
  CollectibleLocationAdminResponse,
  LocationStatsResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  Rarity,
  LocationCategory,
  PaginatedResponse,
} from '../types';
import './AdminDashboard.css';

type TabType = 'overview' | 'users' | 'locations';
type FilterRarity = Rarity | 'ALL';
type FilterCategory = LocationCategory | 'ALL';
type FilterStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';

interface LocationFormData {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  collectRadius: string;
  category: LocationCategory;
  rarity: Rarity;
  country: string;
  city: string;
  region: string;
  imageUrl: string;
  nftImageUrl: string;
  pointReward: string;
  isSeasonalEvent: boolean;
  eventStartAt: string;
  eventEndAt: string;
}

const initialFormData: LocationFormData = {
  name: '',
  description: '',
  latitude: '',
  longitude: '',
  collectRadius: '50',
  category: 'LANDMARK',
  rarity: 'COMMON',
  country: '',
  city: '',
  region: '',
  imageUrl: '',
  nftImageUrl: '',
  pointReward: '100',
  isSeasonalEvent: false,
  eventStartAt: '',
  eventEndAt: '',
};

const RARITY_OPTIONS: Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const CATEGORY_OPTIONS: LocationCategory[] = [
  'LANDMARK', 'MUSEUM', 'PARK', 'TEMPLE', 'BEACH',
  'MOUNTAIN', 'HISTORIC', 'CULTURAL', 'ENTERTAINMENT',
  'FOOD', 'SHOPPING', 'NATURE', 'HIDDEN_GEM'
];

const RARITY_COLORS: Record<Rarity, string> = {
  COMMON: '#9ca3af',
  RARE: '#3b82f6',
  EPIC: '#a855f7',
  LEGENDARY: '#f59e0b',
};

const RARITY_LABELS: Record<Rarity, string> = {
  COMMON: '일반',
  RARE: '레어',
  EPIC: '에픽',
  LEGENDARY: '전설',
};

const CATEGORY_LABELS: Record<LocationCategory, string> = {
  LANDMARK: '랜드마크',
  MUSEUM: '박물관',
  PARK: '공원',
  TEMPLE: '사찰',
  BEACH: '해변',
  MOUNTAIN: '산',
  HISTORIC: '역사',
  CULTURAL: '문화',
  ENTERTAINMENT: '엔터테인먼트',
  FOOD: '맛집',
  SHOPPING: '쇼핑',
  NATURE: '자연',
  HIDDEN_GEM: '숨겨진 명소',
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = searchParams.get('tab');
    return (tab as TabType) || 'overview';
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // State
  const [stats, setStats] = useState<LocationStatsResponse | null>(null);
  const [locations, setLocations] = useState<CollectibleLocationAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('ALL');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CollectibleLocationAdminResponse | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getLocationStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Load locations
  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data: PaginatedResponse<CollectibleLocationAdminResponse> =
        await adminService.getAllLocations(page, 20);
      setLocations(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('Failed to load locations:', error);
      showToast('장소 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    loadStats();
    loadLocations();
  }, [loadStats, loadLocations]);

  // Filter locations
  const filteredLocations = locations.filter((loc) => {
    if (filterRarity !== 'ALL' && loc.rarity !== filterRarity) return false;
    if (filterCategory !== 'ALL' && loc.category !== filterCategory) return false;
    if (filterStatus === 'ACTIVE' && !loc.isActive) return false;
    if (filterStatus === 'INACTIVE' && loc.isActive) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        loc.name.toLowerCase().includes(query) ||
        loc.city?.toLowerCase().includes(query) ||
        loc.country?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Open create modal
  const handleCreate = () => {
    setEditingLocation(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (location: CollectibleLocationAdminResponse) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      collectRadius: location.collectRadius.toString(),
      category: location.category,
      rarity: location.rarity,
      country: location.country || '',
      city: location.city || '',
      region: location.region || '',
      imageUrl: location.imageUrl || '',
      nftImageUrl: location.nftImageUrl || '',
      pointReward: location.pointReward.toString(),
      isSeasonalEvent: location.isSeasonalEvent,
      eventStartAt: location.eventStartAt?.split('T')[0] || '',
      eventEndAt: location.eventEndAt?.split('T')[0] || '',
    });
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const requestData: CreateLocationRequest | UpdateLocationRequest = {
        name: formData.name,
        description: formData.description || undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        collectRadius: parseInt(formData.collectRadius),
        category: formData.category,
        rarity: formData.rarity,
        country: formData.country || undefined,
        city: formData.city || undefined,
        region: formData.region || undefined,
        imageUrl: formData.imageUrl || undefined,
        nftImageUrl: formData.nftImageUrl || undefined,
        pointReward: parseInt(formData.pointReward),
        isSeasonalEvent: formData.isSeasonalEvent,
        eventStartAt: formData.eventStartAt ? `${formData.eventStartAt}T00:00:00` : undefined,
        eventEndAt: formData.eventEndAt ? `${formData.eventEndAt}T23:59:59` : undefined,
      };

      if (editingLocation) {
        await adminService.updateLocation(editingLocation.id, requestData);
        showToast('장소가 수정되었습니다.', 'success');
      } else {
        await adminService.createLocation(requestData as CreateLocationRequest);
        showToast('장소가 생성되었습니다.', 'success');
      }

      setShowModal(false);
      loadLocations();
      loadStats();
    } catch (error) {
      console.error('Failed to save location:', error);
      showToast('장소 저장에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: number) => {
    try {
      await adminService.toggleLocationActive(id);
      showToast('상태가 변경되었습니다.', 'success');
      loadLocations();
      loadStats();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      showToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  // Delete location
  const handleDelete = async (id: number) => {
    try {
      await adminService.deleteLocation(id);
      showToast('장소가 삭제되었습니다.', 'success');
      setDeleteConfirm(null);
      loadLocations();
      loadStats();
    } catch (error) {
      console.error('Failed to delete location:', error);
      showToast('장소 삭제에 실패했습니다.', 'error');
    }
  };

  // Render location management content
  const renderLocationManagement = () => (
    <>
      {/* Stats Cards */}
      {stats && (
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalLocations}</span>
                <span className="stat-label">전체 장소</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon active">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.activeLocations}</span>
                <span className="stat-label">활성 장소</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon event">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.seasonalEvents}</span>
                <span className="stat-label">시즌 이벤트</span>
              </div>
            </div>
          </div>

          {/* Rarity Distribution */}
          <div className="rarity-distribution">
            <h3>희귀도별 분포</h3>
            <div className="rarity-bars">
              {(['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as Rarity[]).map((rarity) => {
                const count = stats[`${rarity.toLowerCase()}Count` as keyof LocationStatsResponse] as number;
                const maxCount = Math.max(stats.commonCount, stats.rareCount, stats.epicCount, stats.legendaryCount);
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div key={rarity} className="rarity-bar-item">
                    <div className="rarity-bar-label">
                      <span className="rarity-name" style={{ color: RARITY_COLORS[rarity] }}>
                        {RARITY_LABELS[rarity]}
                      </span>
                      <span className="rarity-count">{count}</span>
                    </div>
                    <div className="rarity-bar-bg">
                      <div
                        className="rarity-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: RARITY_COLORS[rarity],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Controls */}
      <section className="controls-section">
        <div className="controls-row">
          <button className="btn-create" onClick={handleCreate}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            장소 추가
          </button>

          <div className="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="장소 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-row">
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as FilterRarity)}
          >
            <option value="ALL">모든 희귀도</option>
            {RARITY_OPTIONS.map((r) => (
              <option key={r} value={r}>{RARITY_LABELS[r]}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
          >
            <option value="ALL">모든 카테고리</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          >
            <option value="ALL">모든 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="INACTIVE">비활성</option>
          </select>
        </div>
      </section>

      {/* Locations Table */}
      <section className="table-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>장소가 없습니다</h3>
            <p>새 장소를 추가해주세요.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="locations-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이름</th>
                    <th>카테고리</th>
                    <th>희귀도</th>
                    <th>위치</th>
                    <th>포인트</th>
                    <th>상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((loc) => (
                    <tr key={loc.id} className={!loc.isActive ? 'inactive' : ''}>
                      <td className="id-cell">{loc.id}</td>
                      <td className="name-cell">
                        <div className="name-content">
                          {loc.imageUrl && (
                            <img src={loc.imageUrl} alt="" className="location-thumb" />
                          )}
                          <div>
                            <span className="location-name">{loc.name}</span>
                            {loc.isSeasonalEvent && (
                              <span className="event-badge">이벤트</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">
                          {CATEGORY_LABELS[loc.category]}
                        </span>
                      </td>
                      <td>
                        <span
                          className="rarity-badge"
                          style={{ backgroundColor: RARITY_COLORS[loc.rarity] }}
                        >
                          {RARITY_LABELS[loc.rarity]}
                        </span>
                      </td>
                      <td className="location-cell">
                        {loc.city || loc.country || '-'}
                      </td>
                      <td className="points-cell">{loc.pointReward}P</td>
                      <td>
                        <button
                          className={`status-toggle ${loc.isActive ? 'active' : ''}`}
                          onClick={() => handleToggleActive(loc.id)}
                        >
                          {loc.isActive ? '활성' : '비활성'}
                        </button>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-action edit"
                          onClick={() => handleEdit(loc)}
                          title="수정"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {deleteConfirm === loc.id ? (
                          <>
                            <button
                              className="btn-action confirm"
                              onClick={() => handleDelete(loc.id)}
                              title="확인"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                            <button
                              className="btn-action cancel"
                              onClick={() => setDeleteConfirm(null)}
                              title="취소"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-action delete"
                            onClick={() => setDeleteConfirm(loc.id)}
                            title="삭제"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  이전
                </button>
                <span className="page-info">
                  {page + 1} / {totalPages} ({totalElements}개)
                </span>
                <button
                  className="page-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>관리자 대시보드</h1>
        <div className="header-spacer" />
      </header>

      {/* Tab Navigation */}
      <nav className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9"/>
            <rect x="14" y="3" width="7" height="5"/>
            <rect x="14" y="12" width="7" height="9"/>
            <rect x="3" y="16" width="7" height="5"/>
          </svg>
          개요
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          사용자 관리
        </button>
        <button
          className={`admin-tab ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => handleTabChange('locations')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          장소 관리
        </button>
      </nav>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'locations' && renderLocationManagement()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLocation ? '장소 수정' : '새 장소 추가'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="location-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>장소명 *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>설명</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>위도 *</label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="any"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>경도 *</label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="any"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>수집 반경 (m)</label>
                  <input
                    type="number"
                    name="collectRadius"
                    value={formData.collectRadius}
                    onChange={handleInputChange}
                    min="10"
                    max="1000"
                  />
                </div>

                <div className="form-group">
                  <label>포인트 보상</label>
                  <input
                    type="number"
                    name="pointReward"
                    value={formData.pointReward}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>카테고리 *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>희귀도 *</label>
                  <select
                    name="rarity"
                    value={formData.rarity}
                    onChange={handleInputChange}
                    required
                  >
                    {RARITY_OPTIONS.map((r) => (
                      <option key={r} value={r}>{RARITY_LABELS[r]}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>국가</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>도시</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>지역</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>이미지 URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>NFT 이미지 URL</label>
                  <input
                    type="url"
                    name="nftImageUrl"
                    value={formData.nftImageUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isSeasonalEvent"
                      checked={formData.isSeasonalEvent}
                      onChange={handleInputChange}
                    />
                    시즌 이벤트 장소
                  </label>
                </div>

                {formData.isSeasonalEvent && (
                  <>
                    <div className="form-group">
                      <label>이벤트 시작일</label>
                      <input
                        type="date"
                        name="eventStartAt"
                        value={formData.eventStartAt}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>이벤트 종료일</label>
                      <input
                        type="date"
                        name="eventEndAt"
                        value={formData.eventEndAt}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? '저장 중...' : editingLocation ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
