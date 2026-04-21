import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  const tabs: { id: TabType; label: string; badge?: number }[] = [
    { id: 'recommendations', label: '추천' },
    { id: 'requests', label: '요청 관리', badge: pendingBadge },
    { id: 'history', label: '히스토리' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-[20%] left-[20%] w-72 h-72 bg-violet-400/20 dark:bg-violet-500/30 rounded-full blur-3xl"
          style={{ animation: 'blob 7s infinite' }}
        />
        <div
          className="absolute top-[20%] right-[20%] w-72 h-72 bg-pink-400/15 dark:bg-pink-500/25 rounded-full blur-3xl"
          style={{ animation: 'blob 7s infinite 2s' }}
        />
        <div
          className="absolute bottom-[30%] left-[40%] w-80 h-80 bg-blue-400/15 dark:bg-blue-500/25 rounded-full blur-3xl"
          style={{ animation: 'blob 7s infinite 4s' }}
        />
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
      `}</style>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8 md:py-10">
        {/* Header */}
        <motion.header
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-violet-300 bg-clip-text text-transparent mb-2">
            동반자 매칭
          </h1>
          <p className="text-gray-500 dark:text-white/70">나와 잘 맞는 여행 동반자를 찾아보세요</p>
        </motion.header>

        {/* Tabs */}
        <motion.div
          className="flex justify-center gap-2 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-violet-100 dark:bg-violet-500/30 border border-violet-300 dark:border-violet-500/60 text-violet-700 dark:text-white'
                  : 'bg-white/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/15 text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[0.65rem] font-bold rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div>
              {loadingRecs ? (
                <SkeletonList
                  count={6}
                  skeleton={<MatchCardSkeleton />}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                />
              ) : recommendations && recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="text-center py-12 text-gray-400 dark:text-white/50">
                  <h3 className="text-lg font-semibold text-gray-500 dark:text-white/70 mb-2">
                    추천 동반자가 없습니다
                  </h3>
                  <p>프로필의 매칭 설정을 확인하거나 나중에 다시 시도해보세요.</p>
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-gray-900 dark:text-white text-xl font-bold mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
                  받은 요청
                </h2>
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
                      <div className="flex justify-center items-center gap-4 mt-5">
                        <button
                          disabled={receivedPage === 0}
                          onClick={() => setReceivedPage(p => p - 1)}
                          className="px-4 py-2 bg-white/60 dark:bg-white/10 text-gray-600 dark:text-white/70 border border-gray-200/50 dark:border-white/15 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          이전
                        </button>
                        <span className="text-gray-500 dark:text-white/60 text-sm">
                          {receivedPage + 1} / {receivedRequests.totalPages}
                        </span>
                        <button
                          disabled={receivedRequests.last}
                          onClick={() => setReceivedPage(p => p + 1)}
                          className="px-4 py-2 bg-white/60 dark:bg-white/10 text-gray-600 dark:text-white/70 border border-gray-200/50 dark:border-white/15 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section>
                <h2 className="text-gray-900 dark:text-white text-xl font-bold mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
                  보낸 요청
                </h2>
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
                      <div className="flex justify-center items-center gap-4 mt-5">
                        <button
                          disabled={sentPage === 0}
                          onClick={() => setSentPage(p => p - 1)}
                          className="px-4 py-2 bg-white/60 dark:bg-white/10 text-gray-600 dark:text-white/70 border border-gray-200/50 dark:border-white/15 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          이전
                        </button>
                        <span className="text-gray-500 dark:text-white/60 text-sm">
                          {sentPage + 1} / {sentRequests.totalPages}
                        </span>
                        <button
                          disabled={sentRequests.last}
                          onClick={() => setSentPage(p => p + 1)}
                          className="px-4 py-2 bg-white/60 dark:bg-white/10 text-gray-600 dark:text-white/70 border border-gray-200/50 dark:border-white/15 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/15 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              {loadingHistory ? (
                <div className="flex flex-col items-center py-12">
                  <div className="w-10 h-10 border-3 border-gray-200 dark:border-white/10 border-t-violet-500 rounded-full animate-spin mb-3" />
                </div>
              ) : history && history.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {history.map(item => (
                    <div
                      key={item.matchRequestId}
                      className="bg-white/80 dark:bg-white/[0.08] backdrop-blur-xl border border-gray-200/50 dark:border-white/[0.12] rounded-2xl p-5"
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <div className="flex items-center gap-3">
                          <div>
                            {item.partner.profileImageUrl ? (
                              <img
                                src={item.partner.profileImageUrl}
                                alt={item.partner.nickname}
                                className="w-11 h-11 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center font-bold text-white">
                                {item.partner.nickname.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-gray-900 dark:text-white font-bold">
                              {item.partner.nickname}
                            </h3>
                            {item.partner.age && (
                              <span className="text-gray-400 dark:text-white/50 text-sm">
                                {item.partner.age}세
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-3.5 py-1.5 rounded-xl font-bold">
                          <span>{Math.round(item.totalScore)}점</span>
                        </div>
                      </div>
                      <div className="text-gray-400 dark:text-white/40 text-sm mb-3">
                        매칭일: {new Date(item.matchedAt).toLocaleDateString('ko-KR')}
                      </div>
                      <MatchScoreBreakdown breakdown={item.scoreBreakdown} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-white/50">
                  <h3 className="text-lg font-semibold text-gray-500 dark:text-white/70 mb-2">
                    매칭 히스토리가 없습니다
                  </h3>
                  <p>동반자 매칭이 성사되면 여기에 표시됩니다.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Matching;
