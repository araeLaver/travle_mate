import React, { useState, useEffect } from 'react';
import MatchCard from '../components/MatchCard';
import MatchRequestList from '../components/MatchRequestList';
import MatchScoreBreakdown from '../components/MatchScoreBreakdown';
import {
  trackEvent,
  trackMatchRequestSent,
  trackMatchRecommendationViewed,
} from '../utils/analytics';
import {
  useMatchRecommendations,
  useSendMatchRequest,
  useRespondToMatchRequest,
  useCancelMatchRequest,
  useReceivedMatchRequests,
  useSentMatchRequests,
  useMatchHistory,
  usePendingMatchCount,
} from '../hooks/useMatching';
import './Matching.css';
import { MatchCardSkeleton, ListItemSkeleton, SkeletonList } from '../components/SkeletonLoader';

type TabType = 'recommendations' | 'requests' | 'history';

const Matching: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('recommendations');
  const [receivedPage, setReceivedPage] = useState(0);
  const [sentPage, setSentPage] = useState(0);

  // Queries
  const { data: recommendations, isLoading: loadingRecs } = useMatchRecommendations(10);
  const { data: receivedRequests, isLoading: loadingReceived } =
    useReceivedMatchRequests(receivedPage);
  const { data: sentRequests, isLoading: loadingSent } = useSentMatchRequests(sentPage);
  const { data: history, isLoading: loadingHistory } = useMatchHistory();
  const { data: pendingCount } = usePendingMatchCount();

  // Mutations
  const sendRequest = useSendMatchRequest();
  const respondRequest = useRespondToMatchRequest();
  const cancelRequest = useCancelMatchRequest();

  // 추천 목록 로드 완료 시 GA4 이벤트 전송
  useEffect(() => {
    if (!loadingRecs && recommendations && recommendations.length > 0) {
      trackMatchRecommendationViewed(recommendations.length);
    }
  }, [loadingRecs, recommendations]);

  const handleSendRequest = (receiverId: number, message?: string) => {
    trackEvent('match_initiated', { receiverId });
    trackMatchRequestSent(String(receiverId));
    sendRequest.mutate({ receiverId, message });
  };

  const handleAccept = (requestId: number) => {
    respondRequest.mutate({ requestId, accept: true });
  };

  const handleReject = (requestId: number) => {
    respondRequest.mutate({ requestId, accept: false });
  };

  const handleCancel = (requestId: number) => {
    cancelRequest.mutate(requestId);
  };

  const pendingBadge = pendingCount?.count ? pendingCount.count : 0;

  return (
    <div className="matching-page">
      <div className="matching-page-bg" />
      <div className="matching-content">
        <header className="matching-header">
          <h1>동반자 매칭</h1>
          <p>나와 잘 맞는 여행 동반자를 찾아보세요</p>
        </header>

        <div className="matching-tabs">
          <button
            className={`matching-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            추천
          </button>
          <button
            className={`matching-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            요청 관리
            {pendingBadge > 0 && <span className="matching-badge">{pendingBadge}</span>}
          </button>
          <button
            className={`matching-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            히스토리
          </button>
        </div>

        <div className="matching-tab-content">
          {/* 추천 탭 */}
          {activeTab === 'recommendations' && (
            <div className="matching-recommendations">
              {loadingRecs ? (
                <SkeletonList
                  count={6}
                  skeleton={<MatchCardSkeleton />}
                  className="match-card-grid"
                />
              ) : recommendations && recommendations.length > 0 ? (
                <div className="match-card-grid">
                  {recommendations.map(rec => (
                    <MatchCard
                      key={rec.user.id}
                      recommendation={rec}
                      onSendRequest={handleSendRequest}
                      isSending={sendRequest.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="matching-empty">
                  <h3>추천 동반자가 없습니다</h3>
                  <p>프로필의 매칭 설정을 확인하거나 나중에 다시 시도해보세요.</p>
                </div>
              )}
            </div>
          )}

          {/* 요청 관리 탭 */}
          {activeTab === 'requests' && (
            <div className="matching-requests">
              <section className="matching-section">
                <h2>받은 요청</h2>
                {loadingReceived ? (
                  <SkeletonList count={3} skeleton={<ListItemSkeleton />} />
                ) : (
                  <>
                    <MatchRequestList
                      requests={receivedRequests?.content || []}
                      type="received"
                      onAccept={handleAccept}
                      onReject={handleReject}
                      isResponding={respondRequest.isPending}
                    />
                    {receivedRequests && receivedRequests.totalPages > 1 && (
                      <div className="matching-pagination">
                        <button
                          disabled={receivedPage === 0}
                          onClick={() => setReceivedPage(p => p - 1)}
                        >
                          이전
                        </button>
                        <span>
                          {receivedPage + 1} / {receivedRequests.totalPages}
                        </span>
                        <button
                          disabled={receivedRequests.last}
                          onClick={() => setReceivedPage(p => p + 1)}
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="matching-section">
                <h2>보낸 요청</h2>
                {loadingSent ? (
                  <SkeletonList count={3} skeleton={<ListItemSkeleton />} />
                ) : (
                  <>
                    <MatchRequestList
                      requests={sentRequests?.content || []}
                      type="sent"
                      onCancel={handleCancel}
                      isResponding={cancelRequest.isPending}
                    />
                    {sentRequests && sentRequests.totalPages > 1 && (
                      <div className="matching-pagination">
                        <button disabled={sentPage === 0} onClick={() => setSentPage(p => p - 1)}>
                          이전
                        </button>
                        <span>
                          {sentPage + 1} / {sentRequests.totalPages}
                        </span>
                        <button
                          disabled={sentRequests.last}
                          onClick={() => setSentPage(p => p + 1)}
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}

          {/* 히스토리 탭 */}
          {activeTab === 'history' && (
            <div className="matching-history">
              {loadingHistory ? (
                <div className="matching-loading">
                  <div className="matching-spinner" />
                </div>
              ) : history && history.length > 0 ? (
                <div className="match-history-list">
                  {history.map(item => (
                    <div key={item.matchRequestId} className="match-history-item">
                      <div className="match-history-header">
                        <div className="match-history-user">
                          <div className="match-history-avatar">
                            {item.partner.profileImageUrl ? (
                              <img src={item.partner.profileImageUrl} alt={item.partner.nickname} />
                            ) : (
                              <div className="match-history-avatar-placeholder">
                                {item.partner.nickname.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3>{item.partner.nickname}</h3>
                            {item.partner.age && <span>{item.partner.age}세</span>}
                          </div>
                        </div>
                        <div className="match-history-score">
                          <span>{Math.round(item.totalScore)}점</span>
                        </div>
                      </div>
                      <div className="match-history-date">
                        매칭일: {new Date(item.matchedAt).toLocaleDateString('ko-KR')}
                      </div>
                      <MatchScoreBreakdown breakdown={item.scoreBreakdown} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="matching-empty">
                  <h3>매칭 히스토리가 없습니다</h3>
                  <p>동반자 매칭이 성사되면 여기에 표시됩니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matching;
