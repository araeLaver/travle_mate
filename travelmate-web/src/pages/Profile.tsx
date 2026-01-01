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
      <div className="profile-loading">
        <div className="loading-spinner">👤</div>
        <p>프로필을 불러오는 중...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h3>프로필을 불러올 수 없습니다</h3>
        <button onClick={loadProfile} className="btn-primary">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* 프로필 헤더 */}
        <div className="profile-header">
          <div className="cover-section">
            {profile.coverImage && (
              <img src={profile.coverImage} alt="커버" className="cover-image" />
            )}
            <div className="cover-overlay"></div>
          </div>

          <div className="profile-main">
            <div className="profile-avatar">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>

            <div className="profile-info">
              <h1 className="profile-name">{profile.name}</h1>
              {profile.age && <span className="profile-age">{profile.age}세</span>}
              {profile.location && (
                <p className="profile-location">
                  📍 {profile.location.city}, {profile.location.country}
                </p>
              )}
              <p className="profile-bio">{profile.bio}</p>
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <button className="edit-btn" onClick={handleEditStart}>
                  ✏️ 편집
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleEditSave} disabled={isSaving}>
                    {isSaving ? '저장 중...' : '💾 저장'}
                  </button>
                  <button className="cancel-btn" onClick={handleEditCancel} disabled={isSaving}>
                    ❌ 취소
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-number">{profile.stats.totalTrips}</div>
            <div className="stat-label">여행 횟수</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{profile.stats.totalCountries}</div>
            <div className="stat-label">방문 국가</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{profile.stats.totalCities}</div>
            <div className="stat-label">방문 도시</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{profile.stats.averageRating.toFixed(1)}</div>
            <div className="stat-label">평균 평점</div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 기본 정보
          </button>
          <button
            className={`tab-btn ${activeTab === 'travel' ? 'active' : ''}`}
            onClick={() => setActiveTab('travel')}
          >
            ✈️ 여행 기록
          </button>
          <button
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ 선호도
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="tab-content">
          {activeTab === 'info' && (
            <div className="info-tab">
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>이름</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>나이</label>
                    <input
                      type="number"
                      value={editForm.age || ''}
                      onChange={e =>
                        handleInputChange('age', parseInt(e.target.value) || undefined)
                      }
                      className="form-input"
                      min="18"
                      max="99"
                    />
                  </div>

                  <div className="form-group">
                    <label>성별</label>
                    <select
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
                    <label>자기소개</label>
                    <textarea
                      value={editForm.bio || ''}
                      onChange={e => handleInputChange('bio', e.target.value)}
                      className="form-textarea"
                      rows={4}
                      placeholder="자신에 대해 소개해주세요..."
                    />
                  </div>

                  <div className="form-group">
                    <label>여행 스타일</label>
                    <select
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

                  <div className="form-group">
                    <label>관심사</label>
                    <div className="interest-grid">
                      {profileService.getAvailableInterests().map(interest => (
                        <button
                          key={interest}
                          type="button"
                          className={`interest-btn ${(editForm.interests || []).includes(interest) ? 'selected' : ''}`}
                          onClick={() => handleInterestToggle(interest)}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>언어</label>
                    <div className="language-grid">
                      {profileService.getAvailableLanguages().map(language => (
                        <button
                          key={language}
                          type="button"
                          className={`language-btn ${(editForm.languages || []).includes(language) ? 'selected' : ''}`}
                          onClick={() => handleLanguageToggle(language)}
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="info-display">
                  <div className="info-section">
                    <h3>🎯 여행 스타일</h3>
                    <div className="travel-style">{profile.travelStyle}</div>
                  </div>

                  <div className="info-section">
                    <h3>💫 관심사</h3>
                    <div className="interests">
                      {profile.interests.map((interest, index) => (
                        <span key={index} className="interest-tag">
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="info-section">
                    <h3>🗣️ 구사 언어</h3>
                    <div className="languages">
                      {profile.languages.map((language, index) => (
                        <span key={index} className="language-tag">
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
            <div className="travel-tab">
              <div className="travel-header">
                <h3>✈️ 여행 기록</h3>
                <button className="add-travel-btn" onClick={addTravelHistory}>
                  + 여행 추가
                </button>
              </div>

              {profile.travelHistory.length === 0 ? (
                <div className="empty-travel">
                  <div className="empty-icon">🌍</div>
                  <h4>아직 여행 기록이 없습니다</h4>
                  <p>첫 번째 여행을 추가해보세요!</p>
                </div>
              ) : (
                <div className="travel-list">
                  {profile.travelHistory.map(travel => (
                    <div key={travel.id} className="travel-card">
                      <div className="travel-info">
                        <h4 className="travel-destination">📍 {travel.destination}</h4>
                        <p className="travel-dates">
                          {formatDate(travel.startDate)} - {formatDate(travel.endDate)}
                        </p>
                        <p className="travel-description">{travel.description}</p>
                        <div className="travel-tags">
                          {travel.tags.map((tag, index) => (
                            <span key={index} className="travel-tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="preferences-tab">
              <div className="pref-section">
                <h3>💰 예산 선호도</h3>
                <p>
                  {(profile.preferences.budget.min / 10000).toFixed(0)}만원 -{' '}
                  {(profile.preferences.budget.max / 10000).toFixed(0)}만원
                </p>
              </div>

              <div className="pref-section">
                <h3>🏠 숙박 선호도</h3>
                <div className="pref-tags">
                  {profile.preferences.accommodationType.map((type, index) => (
                    <span key={index} className="pref-tag">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pref-section">
                <h3>🚗 교통 선호도</h3>
                <div className="pref-tags">
                  {profile.preferences.transportPreference.map((transport, index) => (
                    <span key={index} className="pref-tag">
                      {transport}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pref-section">
                <h3>👥 그룹 크기</h3>
                <p>
                  {profile.preferences.groupSize.min}명 - {profile.preferences.groupSize.max}명
                </p>
              </div>

              <div className="pref-section">
                <h3>⚡ 여행 스타일</h3>
                <p>
                  여행 페이스: <span className="pref-value">{profile.preferences.travelPace}</span>{' '}
                  | 활동 레벨:{' '}
                  <span className="pref-value">{profile.preferences.activityLevel}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
