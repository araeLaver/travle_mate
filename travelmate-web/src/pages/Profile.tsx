import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { profileService, UserProfile, UpdateProfileRequest } from '../services/profileService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import { useFollowStats, useFollowStatus, useFollowToggle } from '../hooks/useFollow';
import { authService } from '../services/authService';
import FollowerList from '../components/social/FollowerList';
import PhoneVerification from '../components/PhoneVerification';
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
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  const currentUser = authService.getUser();
  const viewedUserId = userId ? parseInt(userId) : currentUser?.id;
  const isOwnProfile = !userId || (currentUser !== null && parseInt(userId) === currentUser.id);
  const canAddTravelHistory = isOwnProfile && profileService.isMockMode();

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
        setProfile(null);
      } else {
        setProfile(userProfile);
      }
    } catch (error) {
      logError('Profile.loadProfile', error);
      toast.error(getErrorMessage(error));
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast, userId]);

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
    if (!profileService.isMockMode()) {
      return;
    }

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
      <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary-100 dark:border-primary-900 border-t-primary-500 animate-spin mb-4 mx-auto" />
          <p className="text-[#74747F] dark:text-gray-400">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-4">
            프로필을 불러올 수 없습니다
          </h2>
          <button
            onClick={loadProfile}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white dark:bg-gray-900 border-b border-[#F2F1ED] dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Logo size="md" />
              <span className="font-extrabold tracking-tight text-ink dark:text-white">Fryndo</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-semibold text-[#4A4A55] dark:text-gray-400 hover:text-ink dark:hover:text-white transition-colors"
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
          className="bg-white dark:bg-gray-900 rounded-[18px] shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 overflow-hidden mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Cover */}
          <div className="h-40 bg-ink bg-[linear-gradient(135deg,#2A1BC7_0%,#4A3AFF_60%,#101014_140%)] relative">
            {profile.coverImage && (
              <img src={profile.coverImage} alt="" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="w-[104px] h-[104px] rounded-full border-[5px] border-white dark:border-gray-900 bg-primary-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-[0_10px_30px_rgba(16,16,20,0.1)] overflow-hidden">
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
                  <h1 className="text-[26px] font-extrabold tracking-tight text-ink dark:text-white">
                    {profile.name}
                  </h1>
                  {profile.age && (
                    <span className="text-[#74747F] dark:text-gray-400">{profile.age}세</span>
                  )}
                </div>
                {profile.location && (
                  <p className="text-[#74747F] dark:text-gray-400 flex items-center gap-1 mt-1">
                    📍 {profile.location.city}, {profile.location.country}
                  </p>
                )}
                <p className="text-[#4A4A55] dark:text-gray-300 mt-2">{profile.bio}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  !isEditing ? (
                    <button
                      onClick={handleEditStart}
                      className="edit-btn px-5 py-2.5 bg-primary-500 hover:bg-primary-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      ✏️ 편집
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-success hover:bg-[#357A50] text-white rounded-xl font-bold transition-all disabled:opacity-50"
                      >
                        {isSaving ? '저장중...' : '💾 저장'}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-sand-200 hover:bg-sand-300 dark:bg-gray-800 text-ink dark:text-gray-300 rounded-xl font-bold transition-colors dark:border dark:border-gray-700"
                      >
                        취소
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                      followStatus?.isFollowing
                        ? 'bg-sand-200 hover:bg-sand-300 dark:bg-gray-800 text-ink dark:text-gray-300 dark:border dark:border-gray-700'
                        : 'bg-primary-500 hover:bg-primary-700 text-white'
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
            className="bg-white dark:bg-gray-900 rounded-[18px] p-5 shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 hover:-translate-y-1 transition-all text-center"
          >
            <div className="font-display text-[28px] leading-tight text-ink dark:text-white">
              {followStats?.followerCount || 0}
            </div>
            <div className="text-xs font-bold text-[#8A8A95] dark:text-gray-400 mt-1">팔로워</div>
          </button>
          <button
            onClick={() => setShowFollowerList('following')}
            className="bg-white dark:bg-gray-900 rounded-[18px] p-5 shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 hover:-translate-y-1 transition-all text-center"
          >
            <div className="font-display text-[28px] leading-tight text-ink dark:text-white">
              {followStats?.followingCount || 0}
            </div>
            <div className="text-xs font-bold text-[#8A8A95] dark:text-gray-400 mt-1">팔로잉</div>
          </button>
          <div className="bg-white dark:bg-gray-900 rounded-[18px] p-5 shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 text-center">
            <div className="font-display text-[28px] leading-tight text-ink dark:text-white">
              {profile.stats.totalTrips}
            </div>
            <div className="text-xs font-bold text-[#8A8A95] dark:text-gray-400 mt-1">
              여행 횟수
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-[18px] p-5 shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 text-center">
            <div className="font-display text-[28px] leading-tight text-ink dark:text-white">
              {profile.stats.totalCountries}
            </div>
            <div className="text-xs font-bold text-[#8A8A95] dark:text-gray-400 mt-1">
              방문 국가
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-[18px] p-5 shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800 text-center col-span-2 md:col-span-1">
            <div className="font-display text-[28px] leading-tight text-ink dark:text-white">
              {profile.stats.averageRating.toFixed(1)}
            </div>
            <div className="text-xs font-bold text-[#8A8A95] dark:text-gray-400 mt-1">
              평균 평점
            </div>
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
              className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-ink text-white'
                  : 'bg-white dark:bg-gray-900 text-[#4A4A55] dark:text-gray-400 hover:bg-sand-200 dark:hover:bg-gray-800 dark:border dark:border-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.nav>

        {/* Tab Content */}
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-[18px] p-6 shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800"
          {...fadeInUp}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'info' && (
            <div>
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-2">
                      이름
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-sand-100 dark:bg-gray-800 border-[1.5px] border-transparent dark:border-gray-700 rounded-[13px] text-ink dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-2">
                        나이
                      </label>
                      <input
                        type="number"
                        value={editForm.age || ''}
                        onChange={e =>
                          handleInputChange('age', parseInt(e.target.value) || undefined)
                        }
                        className="w-full px-4 py-3 bg-sand-100 dark:bg-gray-800 border-[1.5px] border-transparent dark:border-gray-700 rounded-[13px] text-ink dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 transition-all"
                        min="18"
                        max="99"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-2">
                        성별
                      </label>
                      <select
                        value={editForm.gender || ''}
                        onChange={e =>
                          handleInputChange('gender', e.target.value as 'male' | 'female' | 'other')
                        }
                        className="w-full px-4 py-3 bg-sand-100 dark:bg-gray-800 border-[1.5px] border-transparent dark:border-gray-700 rounded-[13px] text-ink dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 transition-all"
                      >
                        <option value="">선택 안함</option>
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                        <option value="other">기타</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-2">
                      자기소개
                    </label>
                    <textarea
                      value={editForm.bio || ''}
                      onChange={e => handleInputChange('bio', e.target.value)}
                      className="w-full px-4 py-3 bg-sand-100 dark:bg-gray-800 border-[1.5px] border-transparent dark:border-gray-700 rounded-[13px] text-ink dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 transition-all resize-none"
                      rows={4}
                      placeholder="자신에 대해 소개해주세요..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-2">
                      여행 스타일
                    </label>
                    <select
                      value={editForm.travelStyle || ''}
                      onChange={e => handleInputChange('travelStyle', e.target.value)}
                      className="w-full px-4 py-3 bg-sand-100 dark:bg-gray-800 border-[1.5px] border-transparent dark:border-gray-700 rounded-[13px] text-ink dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 transition-all"
                    >
                      {profileService.getAvailableTravelStyles().map(style => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-3">
                      관심사
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {profileService.getAvailableInterests().map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all ${
                            (editForm.interests || []).includes(interest)
                              ? 'bg-ink text-white'
                              : 'bg-sand-200 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-400 hover:bg-sand-300 dark:border dark:border-gray-700'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-3">
                      언어
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {profileService.getAvailableLanguages().map(language => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => handleLanguageToggle(language)}
                          className={`px-4 py-2 rounded-[10px] text-sm font-bold transition-all ${
                            (editForm.languages || []).includes(language)
                              ? 'bg-ink text-white'
                              : 'bg-sand-200 dark:bg-gray-800 text-[#4A4A55] dark:text-gray-400 hover:bg-sand-300 dark:border dark:border-gray-700'
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
                    <h3 className="text-lg font-extrabold tracking-tight text-ink dark:text-white mb-3 flex items-center gap-2">
                      🎯 여행 스타일
                    </h3>
                    <span className="px-4 py-2 bg-ink text-white rounded-[10px] font-bold">
                      {profileService.getTravelStyleLabel(profile.travelStyle)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-ink dark:text-white mb-3 flex items-center gap-2">
                      ✨ 관심사
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-500 dark:text-primary-300 rounded-[10px] text-sm font-bold"
                        >
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-ink dark:text-white mb-3 flex items-center gap-2">
                      💬 구사 언어
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((language, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-500 dark:text-primary-300 rounded-[10px] text-sm font-bold"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 본인 인증 상태 */}
                  {isOwnProfile && (
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight text-ink dark:text-white mb-3 flex items-center gap-2">
                        🔒 본인 인증
                      </h3>
                      {profile.phoneVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-success/10 dark:bg-green-900/30 text-success dark:text-green-400 rounded-[10px] text-sm font-bold">
                          <span>&#10003;</span> 인증 완료
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowPhoneVerification(true)}
                          className="px-4 py-2 bg-primary-500 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors"
                        >
                          휴대폰 본인 인증하기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'travel' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2">
                  ✈️ 여행 기록
                </h3>
                {canAddTravelHistory && (
                  <button
                    onClick={addTravelHistory}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all"
                  >
                    + 여행 추가
                  </button>
                )}
              </div>

              {profile.travelHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-3xl">
                    🌍
                  </div>
                  <h4 className="text-lg font-extrabold tracking-tight text-ink dark:text-white mb-2">
                    아직 여행 기록이 없습니다
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">첫 번째 여행을 추가해보세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.travelHistory.map(travel => (
                    <div
                      key={travel.id}
                      className="p-4 bg-sand-50 dark:bg-gray-800/50 rounded-2xl border border-[#EFEEEA] dark:border-gray-700/50"
                    >
                      <h4 className="font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2 mb-2">
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
                            className="px-2 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-500 dark:text-primary-300 rounded-[8px] text-xs font-bold"
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
              <div className="p-4 bg-sand-50 dark:bg-gray-800/50 rounded-2xl border border-[#EFEEEA] dark:border-transparent">
                <h4 className="font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2 mb-2">
                  💰 예산 선호도
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {(profile.preferences.budget.min / 10000).toFixed(0)}만원 -{' '}
                  {(profile.preferences.budget.max / 10000).toFixed(0)}만원
                </p>
              </div>

              <div className="p-4 bg-sand-50 dark:bg-gray-800/50 rounded-2xl border border-[#EFEEEA] dark:border-transparent">
                <h4 className="font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2 mb-3">
                  🏨 숙박 선호도
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.accommodationType.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-success/10 dark:bg-emerald-900/30 text-success dark:text-emerald-400 rounded-[10px] text-sm font-bold"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-sand-50 dark:bg-gray-800/50 rounded-2xl border border-[#EFEEEA] dark:border-transparent">
                <h4 className="font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2 mb-3">
                  🚗 교통 선호도
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.transportPreference.map((transport, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-500 dark:text-primary-300 rounded-[10px] text-sm font-bold"
                    >
                      {transport}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-sand-50 dark:bg-gray-800/50 rounded-2xl border border-[#EFEEEA] dark:border-transparent">
                <h4 className="font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2 mb-2">
                  👥 그룹 크기
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {profile.preferences.groupSize.min}명 - {profile.preferences.groupSize.max}명
                </p>
              </div>

              <div className="p-4 bg-sand-50 dark:bg-gray-800/50 rounded-2xl border border-[#EFEEEA] dark:border-transparent">
                <h4 className="font-extrabold tracking-tight text-ink dark:text-white flex items-center gap-2 mb-2">
                  ⚡ 여행 스타일
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  여행 페이스:{' '}
                  <span className="font-bold text-primary-500 dark:text-primary-300">
                    {profile.preferences.travelPace}
                  </span>
                  {' | '}
                  활동 레벨:{' '}
                  <span className="font-bold text-primary-500 dark:text-primary-300">
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

      {/* Phone Verification Modal */}
      <PhoneVerification
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onVerified={() => {
          loadProfile();
          setShowPhoneVerification(false);
        }}
      />
    </div>
  );
};

export default Profile;
