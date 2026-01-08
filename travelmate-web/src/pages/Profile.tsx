import React, { useState, useEffect } from 'react';
import { profileService, UserProfile, UpdateProfileRequest } from '../services/profileService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import './Profile.css';

// SVG Icons
const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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

const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SaveIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ClipboardIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const PlaneIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const TargetIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
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
    <path d="M12 3l1.912 5.813L20 10l-6.088 1.187L12 17l-1.912-5.813L4 10l6.088-1.187L12 3z" />
    <path d="M5 3v4M3 5h4M6 17v4M4 19h4M18 14v4M16 16h4" />
  </svg>
);

const MessageCircleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
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

const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
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

const ZapIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const Profile: React.FC = () => {
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({});
  const [activeTab, setActiveTab] = useState<'info' | 'travel' | 'preferences'>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userProfile = await profileService.getProfile();
      if (!userProfile) {
        // 프로필이 없으면 임시 프로필 생성
        const tempProfile = profileService.createTempProfile('여행러');
        setProfile(tempProfile);
      } else {
        setProfile(userProfile);
      }
    } catch (error) {
      const tempProfile = profileService.createTempProfile('여행러');
      setProfile(tempProfile);
    } finally {
      setIsLoading(false);
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
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
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

  if (isLoading) {
    return (
      <div className="profile-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true">
          <UserIcon />
        </div>
        <p>프로필을 불러오는 중...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error" role="alert">
        <h2>프로필을 불러올 수 없습니다</h2>
        <button onClick={loadProfile} className="btn-primary" aria-label="프로필 다시 불러오기">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* 프로필 헤더 */}
        <header className="profile-header">
          <div className="cover-section">
            {profile.coverImage && (
              <img src={profile.coverImage} alt="" className="cover-image" aria-hidden="true" />
            )}
            <div className="cover-overlay" aria-hidden="true"></div>
          </div>

          <div className="profile-main">
            <div className="profile-avatar">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={`${profile.name}의 프로필 사진`} />
              ) : (
                <div className="avatar-placeholder" aria-label="기본 프로필 이미지">
                  <UserIcon />
                </div>
              )}
            </div>

            <div className="profile-info">
              <h1 className="profile-name">{profile.name}</h1>
              {profile.age && (
                <span className="profile-age" aria-label={`나이 ${profile.age}세`}>
                  {profile.age}세
                </span>
              )}
              {profile.location && (
                <p className="profile-location">
                  <span className="location-icon" aria-hidden="true">
                    <MapPinIcon />
                  </span>{' '}
                  {profile.location.city}, {profile.location.country}
                </p>
              )}
              <p className="profile-bio">{profile.bio}</p>
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <button
                  className="edit-btn"
                  onClick={handleEditStart}
                  aria-label="프로필 편집 시작"
                >
                  <span className="btn-icon" aria-hidden="true">
                    <EditIcon />
                  </span>{' '}
                  편집
                </button>
              ) : (
                <div className="edit-actions" role="group" aria-label="편집 액션">
                  <button
                    className="save-btn"
                    onClick={handleEditSave}
                    disabled={isSaving}
                    aria-busy={isSaving}
                    aria-label="프로필 저장"
                  >
                    {isSaving ? (
                      '저장 중...'
                    ) : (
                      <>
                        <span className="btn-icon" aria-hidden="true">
                          <SaveIcon />
                        </span>{' '}
                        저장
                      </>
                    )}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={handleEditCancel}
                    disabled={isSaving}
                    aria-label="편집 취소"
                  >
                    <span className="btn-icon" aria-hidden="true">
                      <XIcon />
                    </span>{' '}
                    취소
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 통계 카드 */}
        <section className="profile-stats" aria-label="프로필 통계">
          <div className="stat-card" role="group" aria-label="여행 횟수">
            <div className="stat-number" aria-hidden="true">
              {profile.stats.totalTrips}
            </div>
            <div className="stat-label">여행 횟수</div>
            <span className="sr-only">{profile.stats.totalTrips}회</span>
          </div>
          <div className="stat-card" role="group" aria-label="방문 국가">
            <div className="stat-number" aria-hidden="true">
              {profile.stats.totalCountries}
            </div>
            <div className="stat-label">방문 국가</div>
            <span className="sr-only">{profile.stats.totalCountries}개국</span>
          </div>
          <div className="stat-card" role="group" aria-label="방문 도시">
            <div className="stat-number" aria-hidden="true">
              {profile.stats.totalCities}
            </div>
            <div className="stat-label">방문 도시</div>
            <span className="sr-only">{profile.stats.totalCities}개 도시</span>
          </div>
          <div className="stat-card" role="group" aria-label="평균 평점">
            <div className="stat-number" aria-hidden="true">
              {profile.stats.averageRating.toFixed(1)}
            </div>
            <div className="stat-label">평균 평점</div>
            <span className="sr-only">{profile.stats.averageRating.toFixed(1)}점</span>
          </div>
        </section>

        {/* 탭 네비게이션 */}
        <nav className="profile-tabs" role="tablist" aria-label="프로필 정보 탭">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
            role="tab"
            id="tab-info"
            aria-selected={activeTab === 'info'}
            aria-controls="tabpanel-info"
            tabIndex={activeTab === 'info' ? 0 : -1}
          >
            <span className="tab-icon" aria-hidden="true">
              <ClipboardIcon />
            </span>{' '}
            기본 정보
          </button>
          <button
            className={`tab-btn ${activeTab === 'travel' ? 'active' : ''}`}
            onClick={() => setActiveTab('travel')}
            role="tab"
            id="tab-travel"
            aria-selected={activeTab === 'travel'}
            aria-controls="tabpanel-travel"
            tabIndex={activeTab === 'travel' ? 0 : -1}
          >
            <span className="tab-icon" aria-hidden="true">
              <PlaneIcon />
            </span>{' '}
            여행 기록
          </button>
          <button
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
            role="tab"
            id="tab-preferences"
            aria-selected={activeTab === 'preferences'}
            aria-controls="tabpanel-preferences"
            tabIndex={activeTab === 'preferences' ? 0 : -1}
          >
            <span className="tab-icon" aria-hidden="true">
              <SettingsIcon />
            </span>{' '}
            선호도
          </button>
        </nav>

        {/* 탭 컨텐츠 */}
        <div className="tab-content">
          {activeTab === 'info' && (
            <section
              id="tabpanel-info"
              className="info-tab"
              role="tabpanel"
              aria-labelledby="tab-info"
            >
              {isEditing ? (
                <form
                  className="edit-form"
                  onSubmit={e => {
                    e.preventDefault();
                    handleEditSave();
                  }}
                >
                  <div className="form-group">
                    <label htmlFor="edit-name">이름</label>
                    <input
                      id="edit-name"
                      type="text"
                      value={editForm.name || ''}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className="form-input"
                      aria-required="true"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-age">나이</label>
                    <input
                      id="edit-age"
                      type="number"
                      value={editForm.age || ''}
                      onChange={e =>
                        handleInputChange('age', parseInt(e.target.value) || undefined)
                      }
                      className="form-input"
                      min="18"
                      max="99"
                      aria-describedby="age-hint"
                    />
                    <span id="age-hint" className="sr-only">
                      18세에서 99세 사이
                    </span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-gender">성별</label>
                    <select
                      id="edit-gender"
                      value={editForm.gender || ''}
                      onChange={e =>
                        handleInputChange('gender', e.target.value as 'male' | 'female' | 'other')
                      }
                      className="form-select"
                    >
                      <option value="">선택 안함</option>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                      <option value="other">기타</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-bio">자기소개</label>
                    <textarea
                      id="edit-bio"
                      value={editForm.bio || ''}
                      onChange={e => handleInputChange('bio', e.target.value)}
                      className="form-textarea"
                      rows={4}
                      placeholder="자신에 대해 소개해주세요..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-style">여행 스타일</label>
                    <select
                      id="edit-style"
                      value={editForm.travelStyle || ''}
                      onChange={e => handleInputChange('travelStyle', e.target.value)}
                      className="form-select"
                    >
                      {profileService.getAvailableTravelStyles().map(style => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      ))}
                    </select>
                  </div>

                  <fieldset className="form-group">
                    <legend>관심사</legend>
                    <div className="interest-grid" role="group" aria-label="관심사 선택">
                      {profileService.getAvailableInterests().map(interest => (
                        <button
                          key={interest}
                          type="button"
                          className={`interest-btn ${(editForm.interests || []).includes(interest) ? 'selected' : ''}`}
                          onClick={() => handleInterestToggle(interest)}
                          aria-pressed={(editForm.interests || []).includes(interest)}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="form-group">
                    <legend>언어</legend>
                    <div className="language-grid" role="group" aria-label="구사 언어 선택">
                      {profileService.getAvailableLanguages().map(language => (
                        <button
                          key={language}
                          type="button"
                          className={`language-btn ${(editForm.languages || []).includes(language) ? 'selected' : ''}`}
                          onClick={() => handleLanguageToggle(language)}
                          aria-pressed={(editForm.languages || []).includes(language)}
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </form>
              ) : (
                <div className="info-display">
                  <section className="info-section">
                    <h2>
                      <span className="section-icon" aria-hidden="true">
                        <TargetIcon />
                      </span>{' '}
                      여행 스타일
                    </h2>
                    <div className="travel-style">{profile.travelStyle}</div>
                  </section>

                  <section className="info-section">
                    <h2>
                      <span className="section-icon" aria-hidden="true">
                        <SparklesIcon />
                      </span>{' '}
                      관심사
                    </h2>
                    <div className="interests" role="list" aria-label="관심사 목록">
                      {profile.interests.map((interest, index) => (
                        <span key={index} className="interest-tag" role="listitem">
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="info-section">
                    <h2>
                      <span className="section-icon" aria-hidden="true">
                        <MessageCircleIcon />
                      </span>{' '}
                      구사 언어
                    </h2>
                    <div className="languages" role="list" aria-label="구사 언어 목록">
                      {profile.languages.map((language, index) => (
                        <span key={index} className="language-tag" role="listitem">
                          {language}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </section>
          )}

          {activeTab === 'travel' && (
            <section
              id="tabpanel-travel"
              className="travel-tab"
              role="tabpanel"
              aria-labelledby="tab-travel"
            >
              <div className="travel-header">
                <h2>
                  <span className="section-icon" aria-hidden="true">
                    <PlaneIcon />
                  </span>{' '}
                  여행 기록
                </h2>
                <button
                  className="add-travel-btn"
                  onClick={addTravelHistory}
                  aria-label="새 여행 기록 추가"
                >
                  + 여행 추가
                </button>
              </div>

              {profile.travelHistory.length === 0 ? (
                <div className="empty-travel" role="status">
                  <div className="empty-icon" aria-hidden="true">
                    <GlobeIcon />
                  </div>
                  <h3>아직 여행 기록이 없습니다</h3>
                  <p>첫 번째 여행을 추가해보세요!</p>
                </div>
              ) : (
                <div className="travel-list" role="list" aria-label="여행 기록 목록">
                  {profile.travelHistory.map(travel => (
                    <article key={travel.id} className="travel-card" role="listitem">
                      <div className="travel-info">
                        <h3 className="travel-destination">
                          <span className="dest-icon" aria-hidden="true">
                            <MapPinIcon />
                          </span>{' '}
                          {travel.destination}
                        </h3>
                        <p className="travel-dates">
                          <time dateTime={travel.startDate.toISOString()}>
                            {formatDate(travel.startDate)}
                          </time>
                          {' - '}
                          <time dateTime={travel.endDate.toISOString()}>
                            {formatDate(travel.endDate)}
                          </time>
                        </p>
                        <p className="travel-description">{travel.description}</p>
                        <div className="travel-tags" aria-label="여행 태그">
                          {travel.tags.map((tag, index) => (
                            <span key={index} className="travel-tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'preferences' && (
            <section
              id="tabpanel-preferences"
              className="preferences-tab"
              role="tabpanel"
              aria-labelledby="tab-preferences"
            >
              <div className="pref-section">
                <h2>
                  <span className="pref-icon" aria-hidden="true">
                    <WalletIcon />
                  </span>{' '}
                  예산 선호도
                </h2>
                <p
                  aria-label={`예산 범위 ${(profile.preferences.budget.min / 10000).toFixed(0)}만원에서 ${(profile.preferences.budget.max / 10000).toFixed(0)}만원`}
                >
                  {(profile.preferences.budget.min / 10000).toFixed(0)}만원 -{' '}
                  {(profile.preferences.budget.max / 10000).toFixed(0)}만원
                </p>
              </div>

              <div className="pref-section">
                <h2>
                  <span className="pref-icon" aria-hidden="true">
                    <HomeIcon />
                  </span>{' '}
                  숙박 선호도
                </h2>
                <div className="pref-tags" role="list" aria-label="선호 숙박 유형">
                  {profile.preferences.accommodationType.map((type, index) => (
                    <span key={index} className="pref-tag" role="listitem">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pref-section">
                <h2>
                  <span className="pref-icon" aria-hidden="true">
                    <CarIcon />
                  </span>{' '}
                  교통 선호도
                </h2>
                <div className="pref-tags" role="list" aria-label="선호 교통수단">
                  {profile.preferences.transportPreference.map((transport, index) => (
                    <span key={index} className="pref-tag" role="listitem">
                      {transport}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pref-section">
                <h2>
                  <span className="pref-icon" aria-hidden="true">
                    <UsersIcon />
                  </span>{' '}
                  그룹 크기
                </h2>
                <p
                  aria-label={`선호 그룹 크기 ${profile.preferences.groupSize.min}명에서 ${profile.preferences.groupSize.max}명`}
                >
                  {profile.preferences.groupSize.min}명 - {profile.preferences.groupSize.max}명
                </p>
              </div>

              <div className="pref-section">
                <h2>
                  <span className="pref-icon" aria-hidden="true">
                    <ZapIcon />
                  </span>{' '}
                  여행 스타일
                </h2>
                <p>
                  여행 페이스: <span className="pref-value">{profile.preferences.travelPace}</span>{' '}
                  | 활동 레벨:{' '}
                  <span className="pref-value">{profile.preferences.activityLevel}</span>
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
