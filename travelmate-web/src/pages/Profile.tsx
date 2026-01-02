import React, { useState, useEffect } from 'react';
import { profileService, UserProfile, UpdateProfileRequest } from '../services/profileService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import './Profile.css';

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
          👤
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
                  👤
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
                  <span aria-hidden="true">📍</span> {profile.location.city},{' '}
                  {profile.location.country}
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
                  <span aria-hidden="true">✏️</span> 편집
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
                    {isSaving ? '저장 중...' : '💾 저장'}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={handleEditCancel}
                    disabled={isSaving}
                    aria-label="편집 취소"
                  >
                    <span aria-hidden="true">❌</span> 취소
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
            <span aria-hidden="true">📋</span> 기본 정보
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
            <span aria-hidden="true">✈️</span> 여행 기록
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
            <span aria-hidden="true">⚙️</span> 선호도
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
                      <span aria-hidden="true">🎯</span> 여행 스타일
                    </h2>
                    <div className="travel-style">{profile.travelStyle}</div>
                  </section>

                  <section className="info-section">
                    <h2>
                      <span aria-hidden="true">💫</span> 관심사
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
                      <span aria-hidden="true">🗣️</span> 구사 언어
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
                  <span aria-hidden="true">✈️</span> 여행 기록
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
                    🌍
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
                          <span aria-hidden="true">📍</span> {travel.destination}
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
                  <span aria-hidden="true">💰</span> 예산 선호도
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
                  <span aria-hidden="true">🏠</span> 숙박 선호도
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
                  <span aria-hidden="true">🚗</span> 교통 선호도
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
                  <span aria-hidden="true">👥</span> 그룹 크기
                </h2>
                <p
                  aria-label={`선호 그룹 크기 ${profile.preferences.groupSize.min}명에서 ${profile.preferences.groupSize.max}명`}
                >
                  {profile.preferences.groupSize.min}명 - {profile.preferences.groupSize.max}명
                </p>
              </div>

              <div className="pref-section">
                <h2>
                  <span aria-hidden="true">⚡</span> 여행 스타일
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
