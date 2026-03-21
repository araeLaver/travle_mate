import React, { useState } from 'react';
import { useGroupRecommendations, useTravelMateRecommendations } from '../hooks/useRecommendations';
import { GroupRecommendationCard, UserRecommendationCard } from './RecommendationCard';
import './RecommendationList.css';

type RecommendationType = 'groups' | 'users';

const RecommendationList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RecommendationType>('groups');
  const [limit] = useState(10);

  const {
    data: groupRecommendations,
    isLoading: groupsLoading,
    error: groupsError,
  } = useGroupRecommendations(limit);

  const {
    data: userRecommendations,
    isLoading: usersLoading,
    error: usersError,
  } = useTravelMateRecommendations(limit);

  const isLoading = activeTab === 'groups' ? groupsLoading : usersLoading;
  const error = activeTab === 'groups' ? groupsError : usersError;

  return (
    <div className="recommendation-list-container">
      <div className="recommendation-header">
        <h1>맞춤 추천</h1>
        <p>회원님을 위한 특별한 여행 그룹과 동행자를 추천해드립니다</p>
      </div>

      <div className="recommendation-tabs" role="tablist" aria-label="추천 유형 선택">
        <button
          className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
          role="tab"
          id="tab-groups"
          aria-selected={activeTab === 'groups'}
          aria-controls="tabpanel-groups"
          tabIndex={activeTab === 'groups' ? 0 : -1}
        >
          <span className="tab-icon" aria-hidden="true">
            🏞️
          </span>
          <span>그룹 추천</span>
          {groupRecommendations && (
            <span className="tab-count" aria-label={`${groupRecommendations.length}개`}>
              {groupRecommendations.length}
            </span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          role="tab"
          id="tab-users"
          aria-selected={activeTab === 'users'}
          aria-controls="tabpanel-users"
          tabIndex={activeTab === 'users' ? 0 : -1}
        >
          <span className="tab-icon" aria-hidden="true">
            👥
          </span>
          <span>동행자 추천</span>
          {userRecommendations && (
            <span className="tab-count" aria-label={`${userRecommendations.length}개`}>
              {userRecommendations.length}
            </span>
          )}
        </button>
      </div>

      <div className="recommendation-content">
        {isLoading && (
          <div className="loading-state" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <p>추천 목록을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="error-state" role="alert">
            <p>추천 목록을 불러오는데 실패했습니다.</p>
            <button onClick={() => window.location.reload()}>다시 시도</button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div
              id="tabpanel-groups"
              role="tabpanel"
              aria-labelledby="tab-groups"
              hidden={activeTab !== 'groups'}
            >
              {activeTab === 'groups' && (
                <section className="recommendations-grid" aria-label="그룹 추천 목록">
                  {groupRecommendations && groupRecommendations.length > 0 ? (
                    groupRecommendations.map(recommendation => (
                      <GroupRecommendationCard
                        key={recommendation.groupId}
                        recommendation={recommendation}
                      />
                    ))
                  ) : (
                    <div className="empty-state" role="status">
                      <p>아직 추천할 그룹이 없습니다.</p>
                      <p className="empty-state-hint">
                        프로필을 완성하고 관심사를 추가하면 더 나은 추천을 받을 수 있습니다.
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>

            <div
              id="tabpanel-users"
              role="tabpanel"
              aria-labelledby="tab-users"
              hidden={activeTab !== 'users'}
            >
              {activeTab === 'users' && (
                <section className="recommendations-grid" aria-label="동행자 추천 목록">
                  {userRecommendations && userRecommendations.length > 0 ? (
                    userRecommendations.map(recommendation => (
                      <UserRecommendationCard
                        key={recommendation.userId}
                        recommendation={recommendation}
                      />
                    ))
                  ) : (
                    <div className="empty-state" role="status">
                      <p>아직 추천할 동행자가 없습니다.</p>
                      <p className="empty-state-hint">
                        프로필을 완성하고 활동을 시작하면 더 많은 추천을 받을 수 있습니다.
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </>
        )}
      </div>

      <div className="recommendation-info">
        <div className="info-card">
          <h3>추천 알고리즘</h3>
          <p>
            Fryndo는 고급 추천 알고리즘을 사용하여 회원님에게 가장 적합한 그룹과 동행자를
            찾아드립니다.
          </p>
          <ul>
            <li>여행 스타일 및 관심사 분석</li>
            <li>지역 선호도 및 예산 고려</li>
            <li>협업 필터링으로 유사한 사용자 패턴 분석</li>
            <li>실시간 활동 기반 추천</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>추천 점수란?</h3>
          <div className="score-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#28a745' }}></div>
              <span>80점 이상: 매우 추천</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#17a2b8' }}></div>
              <span>60-79점: 추천</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
              <span>40-59점: 관심있을만함</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#dc3545' }}></div>
              <span>40점 미만: 기타</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationList;
