/**
 * Admin Dashboard Page
 * 관리자 대시보드 페이지
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/adminService';
import { useToast } from '../components/Toast';
import { AdminOverview, UserManagement } from '../components/admin';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import {
  CollectibleLocationAdminResponse,
  LocationStatsResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  Rarity,
  LocationCategory,
  PaginatedResponse,
} from '../types';

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

const RARITY_CONFIG: Record<Rarity, { color: string; label: string; emoji: string }> = {
  COMMON: { color: '#9ca3af', label: '일반', emoji: '⚪' },
  RARE: { color: '#3b82f6', label: '레어', emoji: '🔵' },
  EPIC: { color: '#a855f7', label: '에픽', emoji: '🟣' },
  LEGENDARY: { color: '#f59e0b', label: '전설', emoji: '🟡' },
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: '개요', icon: '📊' },
    { id: 'users', label: '사용자 관리', icon: '👥' },
    { id: 'locations', label: '장소 관리', icon: '📍' },
  ];

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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error('Failed to delete location:', error);
      showToast('장소 삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite' }}
      />
      <div
        className="absolute top-40 right-10 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 2s' }}
      />
      <div
        className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 4s' }}
      />

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <Logo size="sm" />
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">⚙️</span>
            관리자 대시보드
          </h1>
          <p className="mt-2 text-indigo-100">시스템 관리 및 모니터링</p>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div key="overview" {...fadeInUp}>
              <AdminOverview />
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div key="users" {...fadeInUp}>
              <UserManagement />
            </motion.div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <motion.div key="locations" {...fadeInUp} className="space-y-6">
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-3xl">📍</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalLocations}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">전체 장소</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="text-3xl">✅</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeLocations}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">활성 장소</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span className="text-3xl">⭐</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.seasonalEvents}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">시즌 이벤트</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rarity Distribution */}
              {stats && (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">희귀도별 분포</h3>
                  <div className="space-y-3">
                    {RARITY_OPTIONS.map((rarity) => {
                      const count = stats[`${rarity.toLowerCase()}Count` as keyof LocationStatsResponse] as number;
                      const maxCount = Math.max(stats.commonCount, stats.rareCount, stats.epicCount, stats.legendaryCount);
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                      return (
                        <div key={rarity}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <span>{RARITY_CONFIG[rarity].emoji}</span>
                              <span style={{ color: RARITY_CONFIG[rarity].color }}>{RARITY_CONFIG[rarity].label}</span>
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%`, backgroundColor: RARITY_CONFIG[rarity].color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={handleCreate}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                >
                  <span>➕</span>
                  장소 추가
                </button>

                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="장소 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value as FilterRarity)}
                  className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">모든 희귀도</option>
                  {RARITY_OPTIONS.map((r) => (
                    <option key={r} value={r}>{RARITY_CONFIG[r].emoji} {RARITY_CONFIG[r].label}</option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                  className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">모든 카테고리</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">모든 상태</option>
                  <option value="ACTIVE">✅ 활성</option>
                  <option value="INACTIVE">⛔ 비활성</option>
                </select>
              </div>

              {/* Locations Table */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-12 border border-gray-200/50 dark:border-gray-700/50 text-center">
                  <span className="text-6xl mb-4 block">📍</span>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">장소가 없습니다</h3>
                  <p className="text-gray-500 dark:text-gray-400">새 장소를 추가해주세요.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">이름</th>
                            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">카테고리</th>
                            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">희귀도</th>
                            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">위치</th>
                            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">포인트</th>
                            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">상태</th>
                            <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">액션</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLocations.map((loc, index) => (
                            <motion.tr
                              key={loc.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${!loc.isActive ? 'opacity-60' : ''}`}
                            >
                              <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{loc.id}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  {loc.imageUrl && (
                                    <img src={loc.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{loc.name}</p>
                                    {loc.isSeasonalEvent && (
                                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                        ⭐ 이벤트
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{CATEGORY_LABELS[loc.category]}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: RARITY_CONFIG[loc.rarity].color }}
                                >
                                  {RARITY_CONFIG[loc.rarity].emoji} {RARITY_CONFIG[loc.rarity].label}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{loc.city || loc.country || '-'}</td>
                              <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">{loc.pointReward}P</td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleToggleActive(loc.id)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    loc.isActive
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                  }`}
                                >
                                  {loc.isActive ? '✅ 활성' : '⛔ 비활성'}
                                </button>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEdit(loc)}
                                    className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                    title="수정"
                                  >
                                    ✏️
                                  </button>
                                  {deleteConfirm === loc.id ? (
                                    <>
                                      <button
                                        onClick={() => handleDelete(loc.id)}
                                        className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                                        title="확인"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                                        title="취소"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirm(loc.id)}
                                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                      title="삭제"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4">
                      <button
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                      >
                        ← 이전
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {page + 1} / {totalPages} ({totalElements}개)
                      </span>
                      <button
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(page + 1)}
                        className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                      >
                        다음 →
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingLocation ? '장소 수정' : '새 장소 추가'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">장소명 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">위도 *</label>
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      step="any"
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">경도 *</label>
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      step="any"
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">수집 반경 (m)</label>
                    <input
                      type="number"
                      name="collectRadius"
                      value={formData.collectRadius}
                      onChange={handleInputChange}
                      min="10"
                      max="1000"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">포인트 보상</label>
                    <input
                      type="number"
                      name="pointReward"
                      value={formData.pointReward}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">카테고리 *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">희귀도 *</label>
                    <select
                      name="rarity"
                      value={formData.rarity}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {RARITY_OPTIONS.map((r) => (
                        <option key={r} value={r}>{RARITY_CONFIG[r].emoji} {RARITY_CONFIG[r].label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">국가</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">도시</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">지역</label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이미지 URL</label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NFT 이미지 URL</label>
                    <input
                      type="url"
                      name="nftImageUrl"
                      value={formData.nftImageUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isSeasonalEvent"
                        checked={formData.isSeasonalEvent}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">시즌 이벤트 장소</span>
                    </label>
                  </div>

                  {formData.isSeasonalEvent && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이벤트 시작일</label>
                        <input
                          type="date"
                          name="eventStartAt"
                          value={formData.eventStartAt}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이벤트 종료일</label>
                        <input
                          type="date"
                          name="eventEndAt"
                          value={formData.eventEndAt}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? '저장 중...' : editingLocation ? '수정' : '생성'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
