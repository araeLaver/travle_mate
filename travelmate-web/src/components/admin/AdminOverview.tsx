/**
 * Admin Overview Component
 *
 * Dashboard overview with statistics and charts
 */

import React, { useState, useEffect } from 'react';
import { adminService, DashboardStats, SystemHealth } from '../../services/adminService';

// Chart colors
const RARITY_COLORS: Record<string, string> = {
  COMMON: '#9ca3af',
  RARE: '#3b82f6',
  EPIC: '#a855f7',
  LEGENDARY: '#f59e0b',
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = '#6366f1' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
          </p>
        )}
      </div>
      <div
        className="p-3 rounded-full"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
  </div>
);

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title: string;
}

const SimpleBarChart: React.FC<BarChartProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium text-gray-900">{item.value}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#6366f1',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LineChartProps {
  data: { date: string; value1: number; value2?: number }[];
  title: string;
  label1: string;
  label2?: string;
}

const SimpleLineChart: React.FC<LineChartProps> = ({ data, title, label1, label2 }) => {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.value1, d.value2 || 0)),
    1
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-sm text-gray-600">{label1}</span>
        </div>
        {label2 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-600">{label2}</span>
          </div>
        )}
      </div>
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox={`0 0 ${data.length * 30} 100`} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={100 - y}
              x2={data.length * 30}
              y2={100 - y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          {/* Line 1 */}
          <path
            d={`M ${data.map((d, i) => `${i * 30 + 15},${100 - (d.value1 / maxValue) * 90}`).join(' L ')}`}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
          />
          {/* Line 2 */}
          {label2 && (
            <path
              d={`M ${data.map((d, i) => `${i * 30 + 15},${100 - ((d.value2 || 0) / maxValue) * 90}`).join(' L ')}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        {data.filter((_, i) => i % 5 === 0).map((d, i) => (
          <span key={i}>{new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
        ))}
      </div>
    </div>
  );
};

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, healthData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getSystemHealth(),
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare chart data
  const rarityData = Object.entries(stats.nftsByRarity).map(([key, value]) => ({
    label: key === 'COMMON' ? '일반' : key === 'RARE' ? '레어' : key === 'EPIC' ? '에픽' : '전설',
    value,
    color: RARITY_COLORS[key],
  }));

  const dailyChartData = stats.dailyStats.slice(-14).map(d => ({
    date: d.date,
    value1: d.newUsers,
    value2: d.nftCollections,
  }));

  const formatUptime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}일 ${hours}시간`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 사용자"
          value={stats.totalUsers.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V21" />
            </svg>
          }
          trend={{ value: stats.newUsersToday, label: '오늘' }}
          color="#6366f1"
        />
        <StatCard
          title="전체 NFT"
          value={stats.totalNfts.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          trend={{ value: stats.collectionsToday, label: '오늘 수집' }}
          color="#10b981"
        />
        <StatCard
          title="활성 그룹"
          value={stats.activeGroups.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="#f59e0b"
        />
        <StatCard
          title="평균 평점"
          value={stats.averageRating.toFixed(1)}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          color="#ec4899"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleLineChart
          data={dailyChartData}
          title="일별 활동 추이 (최근 14일)"
          label1="신규 사용자"
          label2="NFT 수집"
        />
        <SimpleBarChart
          data={rarityData}
          title="희귀도별 NFT 분포"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="민팅된 NFT"
          value={stats.mintedNfts.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="#8b5cf6"
        />
        <StatCard
          title="주간 신규 사용자"
          value={stats.newUsersThisWeek.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="#06b6d4"
        />
        <StatCard
          title="전체 리뷰"
          value={stats.totalReviews.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          color="#f97316"
        />
      </div>

      {/* System Health */}
      {health && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${health.status === 'UP' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-sm text-gray-500">상태</p>
                <p className="font-medium">{health.status === 'UP' ? '정상' : '이상'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">가동 시간</p>
              <p className="font-medium">{formatUptime(health.uptime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">메모리 사용량</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${health.memoryUsage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{health.memoryUsage.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(health.services).map(([key, service]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${service.status === 'UP' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-gray-900">{service.name}</span>
                </div>
                <span className="text-sm text-gray-500">{service.responseTime}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
