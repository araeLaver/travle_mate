import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import { useParams, useNavigate } from 'react-router-dom';
import { profileService, UserProfile, UpdateProfileRequest } from '../services/profileService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import { useFollowStats, useFollowStatus, useFollowToggle } from '../hooks/useFollow';
import { authService } from '../services/authService';
import FollowerList from '../components/social/FollowerList';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({});
  const [activeTab, setActiveTab] = useState<'info' | 'travel' | 'preferences'>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showFollowerList, setShowFollowerList] = useState<'followers' | 'following' | null>(null);

  const currentUser = authService.getUser();
  const viewedUserId = userId ? parseInt(userId) : currentUser?.id;
  const isOwnProfile = !userId || (currentUser !== null && parseInt(userId) === currentUser.id);

  const { data: followStats, refetch: refetchFollowStats } = useFollowStats(viewedUserId || 0);
  const { data: followStatus } = useFollowStatus(
    viewedUserId || 0,
    !isOwnProfile && !!viewedUserId
  );
  const { toggle: toggleFollow, isLoading: isFollowLoading } = useFollowToggle();

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const userProfile = await profileService.getProfile(userId);
      if (!userProfile) {
        const tempProfile = profileService.createTempProfile('여행러');
        setProfile(tempProfile);
      } else {
        setProfile(userProfile);
      }
    } catch {
      const tempProfile = profileService.createTempProfile('여행러');
      setProfile(tempProfile);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollowToggle = async () => {
    if (!viewedUserId || isOwnProfile) return;

    try {
      await toggleFollow(viewedUserId, followStatus?.isFollowing || false);
      refetchFollowStats();
      toast.success(followStatus?.isFollowing ? '팔로우를 취소했습니다.' : '팔로우했습니다!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEditStart = () => {
    if (!profile) return;

    setEditForm({
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      bio: profile.bio,
      location: profile.location,
      interests: [...profile.interests],
      languages: [...profile.languages],
      travelStyle: profile.travelStyle,
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setEditForm({});
    setIsEditing(false);
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    try {
      const updatedProfile = await profileService.updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      setEditForm({});
      toast.success('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      logError('Profile.handleEditSave', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdateProfileRequest,
    value: UpdateProfileRequest[keyof UpdateProfileRequest]
  ) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    const current = editForm.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    handleInputChange('interests', updated);
  };

  const handleLanguageToggle = (language: string) => {
    const current = editForm.languages || [];
    const updated = current.includes(language)
      ? current.filter(l => l !== language)
      : [...current, language];
    handleInputChange('languages', updated);
  };

  const addTravelHistory = () => {
    const destination = window.prompt('목적지를 입력하세요:');
    if (!destination) return;

    const description = window.prompt('여행 설명을 입력하세요:');
    if (!description) return;

    profileService.addTravelHistory({
      destination,
      startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000),
      description,
      tags: ['여행', destination],
    });

    loadProfile();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const tabs = [
    { id: 'info', label: '기본 정보', icon: '📋' },
    { id: 'travel', label: '여행 기록', icon: '✈️' },
    { id: 'preferences', label: '선호도', icon: '⚙️' },
  ] as const;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 animate-spin mb-4 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            프로필을 불러올 수 없습니다
          </h2>
          <button
            onClick={loadProfile}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      <SEOHead
        title="내 프로필"
        description="나의 여행 스타일과 선호를 설정하고 최적의 여행 동반자를 찾아보세요."
        canonical="https://fryndo.com/profile"
      />
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
        <div className="max-w-4xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl px-6 py-3 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
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
      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* Profile Header */}
        <motion.div
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 relative">
            {profile.coverImage && (
              <img src={profile.coverImage} alt="" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.name}
                  </h1>
                  {profile.age && (
                    <span className="text-gray-500 dark:text-gray-400">{profile.age}세</span>
                  )}
                </div>
                {profile.location && (
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                    📍 {profile.location.city}, {profile.location.country}
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-300 mt-2">{profile.bio}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  !isEditing ? (
                    <button
                      onClick={handleEditStart}
                      className="edit-btn px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      ✏️ 편집
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {isSaving ? '저장중...' : '💾 저장'}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold border border-gray-200 dark:border-gray-700"
                      >
                        취소
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                      followStatus?.isFollowing
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                        : 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {followStatus?.isFollowing ? '✓ 팔로잉' : '➕ 팔로우'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          {...fadeInUp}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => setShowFollowerList('followers')}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {followStats?.followerCount || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">팔로워</div>
          </button>
          <button
            onClick={() => setShowFollowerList('following')}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {followStats?.followingCount || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">팔로잉</div>
          </button>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.stats.totalTrips}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">여행 횟수</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.stats.totalCountries}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">방문 국가</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg text-center col-span-2 md:col-span-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.stats.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">평균 평점</div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.nav
          className="flex justify-center gap-2 mb-6"
          {...fadeInUp}
          transition={{ delay: 0.2 }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/80 dark:bg-gray-900/80 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-800/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.nav>

        {/* Tab Content */}
        <motion.div
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-xl"
          {...fadeInUp}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'info' && (
            <div>
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      이름
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        나이
                      </label>
                      <input
                        type="number"
                        value={editForm.age || ''}
                        onChange={e =>
                          handleInputChange('age', parseInt(e.target.value) || undefined)
                        }
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        min="18"
                        max="99"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        성별
                      </label>
                      <select
                        value={editForm.gender || ''}
                        onChange={e =>
                          handleInputChange('gender', e.target.value as 'male' | 'female' | 'other')
                        }
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="">선택 안함</option>
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                        <option value="other">기타</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      자기소개
                    </label>
                    <textarea
                      value={editForm.bio || ''}
                      onChange={e => handleInputChange('bio', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                      rows={4}
                      placeholder="자신에 대해 소개해주세요..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      여행 스타일
                    </label>
                    <select
                      value={editForm.travelStyle || ''}
                      onChange={e => handleInputChange('travelStyle', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {profileService.getAvailableTravelStyles().map(style => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      관심사
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {profileService.getAvailableInterests().map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            (editForm.interests || []).includes(interest)
                              ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      언어
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {profileService.getAvailableLanguages().map(language => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => handleLanguageToggle(language)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            (editForm.languages || []).includes(language)
                              ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      🎯 여행 스타일
                    </h3>
                    <span className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full font-medium">
                      {profile.travelStyle}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      ✨ 관심사
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-sm font-medium"
                        >
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      💬 구사 언어
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((language, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'travel' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  ✈️ 여행 기록
                </h3>
                {isOwnProfile && (
                  <button
                    onClick={addTravelHistory}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
                  >
                    + 여행 추가
                  </button>
                )}
              </div>

              {profile.travelHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-400/20 to-pink-400/20 dark:from-violet-500/30 dark:to-pink-500/30 flex items-center justify-center text-3xl">
                    🌍
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    아직 여행 기록이 없습니다
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">첫 번째 여행을 추가해보세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.travelHistory.map(travel => (
                    <div
                      key={travel.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        📍 {travel.destination}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        📅 {formatDate(travel.startDate)} - {formatDate(travel.endDate)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{travel.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {travel.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  💰 예산 선호도
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {(profile.preferences.budget.min / 10000).toFixed(0)}만원 -{' '}
                  {(profile.preferences.budget.max / 10000).toFixed(0)}만원
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  🏨 숙박 선호도
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.accommodationType.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  🚗 교통 선호도
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.transportPreference.map((transport, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium"
                    >
                      {transport}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  👥 그룹 크기
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {profile.preferences.groupSize.min}명 - {profile.preferences.groupSize.max}명
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  ⚡ 여행 스타일
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  여행 페이스:{' '}
                  <span className="font-medium text-violet-600 dark:text-violet-400">
                    {profile.preferences.travelPace}
                  </span>
                  {' | '}
                  활동 레벨:{' '}
                  <span className="font-medium text-violet-600 dark:text-violet-400">
                    {profile.preferences.activityLevel}
                  </span>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Follower/Following Modal */}
      <AnimatePresence>
        {showFollowerList && viewedUserId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFollowerList(null)}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <FollowerList
                userId={viewedUserId}
                type={showFollowerList}
                isOwnProfile={isOwnProfile}
                onClose={() => setShowFollowerList(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default Profile;
