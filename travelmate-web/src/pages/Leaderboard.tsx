import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { pointService } from '../services/pointService';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import AdBanner from '../components/ads/AdBanner';
import {
  PointBalanceResponse,
  PointTransactionResponse,
  LeaderboardEntry,
  PointTransactionType,
} from '../types';
import PageBackground from '../components/PageBackground';

const transactionTypeLabels: Record<
  PointTransactionType,
  { label: string; color: string; darkColor: string }
> = {
  EARN: { label: '획득', color: '#3F8F5F', darkColor: '#3F8F5F' },
  SPEND: { label: '사용', color: '#B4453B', darkColor: '#B4453B' },
  TRANSFER_IN: { label: '수신', color: '#4A3AFF', darkColor: '#8E7BFF' },
  TRANSFER_OUT: { label: '전송', color: '#E0952A', darkColor: '#E0952A' },
};

type TabType = 'leaderboard' | 'history' | 'transfer';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [balance, setBalance] = useState<PointBalanceResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [seasonLeaderboard, setSeasonLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [transactions, setTransactions] = useState<PointTransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSeason, setShowSeason] = useState(false);

  // 전송 폼
  const [transferReceiverId, setTransferReceiverId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 포인트 잔액 조회
  const loadBalance = useCallback(async () => {
    try {
      const response = await pointService.getBalance();
      setBalance(response);
    } catch {
      // 조용히 처리
    }
  }, []);

  // 리더보드 조회
  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [total, season] = await Promise.all([
        pointService.getLeaderboard(50),
        pointService.getSeasonLeaderboard(50),
      ]);
      setLeaderboard(total);
      setSeasonLeaderboard(season);
    } catch {
      toast.error('리더보드를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 거래 내역 조회
  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await pointService.getTransactions(0, 50);
      setTransactions(response.content);
    } catch {
      toast.error('거래 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBalance();
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    } else if (activeTab === 'history') {
      loadTransactions();
    }
  }, [activeTab, loadBalance, loadLeaderboard, loadTransactions]);

  // 포인트 전송
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transferReceiverId || !transferAmount) {
      toast.error('받는 사람 ID와 금액을 입력해주세요.');
      return;
    }

    const amount = parseInt(transferAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }

    if (balance && amount > balance.totalPoints) {
      toast.error('잔액이 부족합니다.');
      return;
    }

    setIsSending(true);
    try {
      await pointService.transferPoints({
        receiverId: parseInt(transferReceiverId, 10),
        amount,
        message: transferMessage || undefined,
      });

      toast.success('포인트가 전송되었습니다!');
      setTransferReceiverId('');
      setTransferAmount('');
      setTransferMessage('');
      loadBalance();
    } catch {
      toast.error('포인트 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // 현재 리더보드
  const currentLeaderboard = showSeason ? seasonLeaderboard : leaderboard;

  // 순위 뱃지 색상
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-ink text-rarity-legendary';
    if (rank === 2) return 'bg-sand-400 text-ink';
    if (rank === 3) return 'bg-rarity-legendary text-white';
    return 'bg-sand-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  };

  const tabs = [
    { id: 'leaderboard' as TabType, label: '랭킹', icon: '🏆' },
    { id: 'history' as TabType, label: '내역', icon: '📋' },
    { id: 'transfer' as TabType, label: '전송', icon: '📤' },
  ];

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] relative overflow-hidden">
      <PageBackground />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <Logo size="sm" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">포인트</h1>
          <ThemeToggle />
        </div>
      </motion.nav>

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* 잔액 카드 */}
        {balance && (
          <motion.div
            {...fadeInUp}
            className="bg-ink rounded-2xl p-6 mb-6 text-white shadow-[0_10px_30px_rgba(16,16,20,0.1)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">💰</span>
              <div>
                <span className="text-3xl font-bold font-display">
                  {balance.totalPoints.toLocaleString()}
                </span>
                <span className="text-xl ml-1 text-[#A0A0AC]">P</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-sm text-[#A0A0AC]">총 획득</p>
                <p className="font-bold text-white">{balance.lifetimeEarned.toLocaleString()}P</p>
              </div>
              <div>
                <p className="text-sm text-[#A0A0AC]">총 사용</p>
                <p className="font-bold text-[#A0A0AC]">
                  {balance.lifetimeSpent.toLocaleString()}P
                </p>
              </div>
              <div>
                <p className="text-sm text-[#A0A0AC]">현재 순위</p>
                <p className="font-bold text-rarity-legendary">#{balance.currentRank}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 탭 */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.1 }}
          className="flex gap-2 p-1 bg-sand-200 dark:bg-gray-800 rounded-xl mb-6"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* 탭 콘텐츠 */}
        <AnimatePresence mode="wait">
          {/* 리더보드 탭 */}
          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" {...fadeInUp}>
              {/* 시즌 토글 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowSeason(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !showSeason
                      ? 'bg-ink text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setShowSeason(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    showSeason
                      ? 'bg-ink text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  시즌
                </button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-3"
                >
                  {currentLeaderboard.map(entry => (
                    <motion.div
                      key={entry.userId}
                      variants={fadeInUp}
                      className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 border border-transparent dark:border-gray-700/50 flex items-center gap-4 ${
                        entry.rank <= 3 ? 'ring-2 ring-rarity-legendary/50' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankStyle(
                          entry.rank
                        )}`}
                      >
                        {entry.rank <= 3 ? '🏆' : entry.rank}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold overflow-hidden">
                        {entry.profileImageUrl ? (
                          <img
                            src={entry.profileImageUrl}
                            alt={entry.nickname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          entry.nickname.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {entry.nickname}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {entry.totalNftsCollected} NFTs
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-rarity-legendary">
                        <span className="text-lg">💰</span>
                        <span className="font-bold">{entry.totalPoints.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 거래 내역 탭 */}
          {activeTab === 'history' && (
            <motion.div key="history" {...fadeInUp}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-6xl mb-4">📭</span>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    거래 내역이 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    NFT를 수집하여 포인트를 획득해보세요!
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-3"
                >
                  {transactions.map(tx => {
                    const typeInfo = transactionTypeLabels[tx.type];
                    const isPositive = tx.type === 'EARN' || tx.type === 'TRANSFER_IN';

                    return (
                      <motion.div
                        key={tx.id}
                        variants={fadeInUp}
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 border border-transparent dark:border-gray-700/50 flex items-center gap-4"
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${typeInfo.color}20` }}
                        >
                          {isPositive ? '📈' : '📉'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <span style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`font-bold text-lg ${
                            isPositive ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {tx.amount.toLocaleString()}P
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 전송 탭 */}
          {activeTab === 'transfer' && (
            <motion.div key="transfer" {...fadeInUp}>
              <form
                onSubmit={handleTransfer}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-transparent dark:border-gray-700/50"
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    받는 사람 ID
                  </label>
                  <input
                    type="number"
                    value={transferReceiverId}
                    onChange={e => setTransferReceiverId(e.target.value)}
                    placeholder="사용자 ID를 입력하세요"
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 transition-all"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    전송 금액
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                      placeholder="0"
                      required
                      min="1"
                      className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 pr-12 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                      P
                    </span>
                  </div>
                  {balance && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      보유: {balance.totalPoints.toLocaleString()}P
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    메시지 (선택)
                  </label>
                  <input
                    type="text"
                    value={transferMessage}
                    onChange={e => setTransferMessage(e.target.value)}
                    placeholder="전송 메시지를 입력하세요"
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-4 bg-primary-500 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      포인트 전송
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ad Banner */}
        <div className="mt-8">
          <AdBanner adSlot="LEADERBOARD_BOTTOM" adFormat="horizontal" />
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
