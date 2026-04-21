import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { pointService } from '../services/pointService';
import { PointBalanceResponse, PointTransactionResponse, PointTransactionType } from '../types';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import PageBackground from '../components/PageBackground';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
  available: boolean;
}

const shopItems: ShopItem[] = [
  {
    id: 'border-gold',
    name: '골드 테두리',
    description: '프로필에 골드 테두리가 적용됩니다',
    price: 500,
    icon: '⭐',
    category: 'profile',
    available: false,
  },
  {
    id: 'nickname-color',
    name: '닉네임 컬러',
    description: '닉네임에 특별한 색상을 적용합니다',
    price: 1000,
    icon: '🎨',
    category: 'profile',
    available: false,
  },
  {
    id: 'premium-badge',
    name: '프리미엄 배지',
    description: '프로필에 프리미엄 배지가 표시됩니다',
    price: 2000,
    icon: '🏆',
    category: 'badge',
    available: false,
  },
  {
    id: 'event-ticket',
    name: '시즌 이벤트 입장권',
    description: '시즌 특별 이벤트에 참여할 수 있습니다',
    price: 5000,
    icon: '🎁',
    category: 'event',
    available: false,
  },
];

type TabType = 'shop' | 'history' | 'transfer';

const PointShop: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('shop');
  const [balance, setBalance] = useState<PointBalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<PointTransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedType, setSelectedType] = useState<PointTransactionType | 'ALL'>('ALL');
  const [receiverId, setReceiverId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const loadBalance = useCallback(async () => {
    try {
      const res = await pointService.getBalance();
      setBalance(res);
    } catch {
      toast.error('잔액 조회에 실패했습니다.');
    }
  }, [toast]);

  const loadTransactions = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 0 : page;
      setIsLoading(true);
      try {
        let response;
        if (selectedType !== 'ALL') {
          response = await pointService.getTransactionsByType(selectedType, currentPage, 20);
        } else {
          response = await pointService.getTransactions(currentPage, 20);
        }

        if (reset) {
          setTransactions(response.content);
        } else {
          setTransactions(prev => [...prev, ...response.content]);
        }
        setHasMore(!response.last);
        setPage(currentPage);
      } catch {
        toast.error('거래 내역을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [page, selectedType, toast]
  );

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadTransactions(true);
    }
  }, [activeTab, selectedType, loadTransactions]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverId || !transferAmount) {
      toast.error('수신자 ID와 금액을 입력해주세요.');
      return;
    }

    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }

    if (!balance || balance.totalPoints < amount) {
      toast.error('포인트가 부족합니다.');
      return;
    }

    setIsTransferring(true);
    try {
      await pointService.transferPoints({
        receiverId: parseInt(receiverId),
        amount,
        message: transferMessage || undefined,
      });
      toast.success('포인트 전송이 완료되었습니다!');
      setReceiverId('');
      setTransferAmount('');
      setTransferMessage('');
      loadBalance();
    } catch {
      toast.error('포인트 전송에 실패했습니다.');
    } finally {
      setIsTransferring(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadTransactions();
  };

  const getTransactionStyle = (type: PointTransactionType) => {
    switch (type) {
      case 'EARN':
        return {
          icon: '📈',
          color: 'text-green-500',
          bg: 'bg-green-100 dark:bg-green-900/30',
          label: '획득',
        };
      case 'SPEND':
        return {
          icon: '📉',
          color: 'text-red-500',
          bg: 'bg-red-100 dark:bg-red-900/30',
          label: '사용',
        };
      case 'TRANSFER_IN':
        return {
          icon: '📥',
          color: 'text-blue-500',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          label: '받음',
        };
      case 'TRANSFER_OUT':
        return {
          icon: '📤',
          color: 'text-orange-500',
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          label: '보냄',
        };
      default:
        return {
          icon: '💰',
          color: 'text-gray-500',
          bg: 'bg-gray-100 dark:bg-gray-800',
          label: type,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
  };

  const tabs = [
    { id: 'shop' as TabType, label: '상점', icon: '🏪' },
    { id: 'history' as TabType, label: '거래 내역', icon: '📜' },
    { id: 'transfer' as TabType, label: '전송', icon: '📤' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      <PageBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl px-6 py-3 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="뒤로 가기"
              >
                <span className="text-lg">←</span>
              </button>
              <Logo />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.header className="text-center mb-6" {...fadeInUp}>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 mb-4">
              <span className="text-2xl">💰</span>
              <span className="text-gray-600 dark:text-gray-300 font-medium">포인트 상점</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              포인트 상점
            </h1>
          </motion.header>

          {/* Balance Card */}
          <motion.div
            className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 mb-6 text-white shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl">💎</span>
              <span className="text-4xl font-bold">
                {balance?.totalPoints?.toLocaleString() || 0}
              </span>
              <span className="text-2xl font-medium">P</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-sm opacity-80">누적 획득</p>
                <p className="text-lg font-bold">
                  {balance?.lifetimeEarned?.toLocaleString() || 0}P
                </p>
              </div>
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-sm opacity-80">누적 사용</p>
                <p className="text-lg font-bold">
                  {balance?.lifetimeSpent?.toLocaleString() || 0}P
                </p>
              </div>
            </div>

            <div className="flex justify-between text-sm opacity-80">
              <span>시즌 포인트: {balance?.seasonPoints?.toLocaleString() || 0}P</span>
              <span>현재 순위: #{balance?.currentRank || '-'}</span>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="flex gap-2 mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-2 border border-gray-200/50 dark:border-gray-800/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'shop' && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Coming Soon Hero */}
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-center text-white shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      개발 진행 중
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-3">포인트 상점 곧 오픈</h3>
                    <p className="text-white/80 max-w-md mx-auto">
                      포인트로 프로필 꾸미기, 배지, 이벤트 참여 등 다양한 아이템을 만나보세요
                    </p>
                  </div>
                </div>

                {/* Preview Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shopItems.map(item => (
                    <div
                      key={item.id}
                      className="relative group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/40 dark:to-pink-900/40 flex items-center justify-center text-2xl shrink-0">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-bold text-lg">
                              <span>💰</span>
                              <span>{item.price.toLocaleString()}P</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Blur overlay */}
                      <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/50 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-violet-500/25">
                          곧 오픈 예정
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { id: 'ALL' as const, label: '전체' },
                    { id: 'EARN' as PointTransactionType, label: '획득' },
                    { id: 'SPEND' as PointTransactionType, label: '사용' },
                    { id: 'TRANSFER_IN' as PointTransactionType, label: '받음' },
                    { id: 'TRANSFER_OUT' as PointTransactionType, label: '보냄' },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedType(filter.id)}
                      className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                        selectedType === filter.id
                          ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                          : 'bg-white/80 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {transactions.length === 0 && !isLoading ? (
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 text-center">
                    <span className="text-4xl mb-4 block">📜</span>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                      거래 내역이 없습니다
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      NFT를 수집하거나 활동하여 포인트를 획득해보세요!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(tx => {
                      const style = getTransactionStyle(tx.type);
                      return (
                        <div
                          key={tx.id}
                          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center text-xl`}
                            >
                              {style.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 dark:text-white">
                                {tx.description}
                              </h4>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(tx.createdAt)}
                              </span>
                            </div>
                            <div className={`font-bold ${style.color}`}>
                              {tx.type === 'EARN' || tx.type === 'TRANSFER_IN' ? '+' : '-'}
                              {tx.amount.toLocaleString()}P
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hasMore && !isLoading && (
                  <button
                    onClick={loadMore}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    더 보기
                  </button>
                )}

                {isLoading && (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'transfer' && (
              <motion.div
                key="transfer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <form
                  onSubmit={handleTransfer}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg space-y-4"
                >
                  <div>
                    <label
                      htmlFor="receiverId"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      수신자 ID
                    </label>
                    <input
                      id="receiverId"
                      type="number"
                      placeholder="포인트를 받을 사용자 ID"
                      value={receiverId}
                      onChange={e => setReceiverId(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="transferAmount"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      전송 금액
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2">💰</span>
                      <input
                        id="transferAmount"
                        type="number"
                        placeholder="전송할 포인트"
                        value={transferAmount}
                        onChange={e => setTransferAmount(e.target.value)}
                        min="1"
                        max={balance?.totalPoints || 0}
                        className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 pl-12 pr-8 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 transition-all"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        P
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      사용 가능: {balance?.totalPoints?.toLocaleString() || 0}P
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="transferMessage"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      메시지 (선택)
                    </label>
                    <input
                      id="transferMessage"
                      type="text"
                      placeholder="함께 전달할 메시지"
                      value={transferMessage}
                      onChange={e => setTransferMessage(e.target.value)}
                      maxLength={100}
                      className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isTransferring ||
                      !balance ||
                      balance.totalPoints < parseInt(transferAmount || '0')
                    }
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-2"
                  >
                    <span>📤</span>
                    {isTransferring ? '전송 중...' : '포인트 전송'}
                  </button>
                </form>

                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-4 border border-violet-200/50 dark:border-violet-800/50">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">포인트 전송 안내</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 전송된 포인트는 취소할 수 없습니다.</li>
                    <li>• 최소 전송 금액은 1P입니다.</li>
                    <li>• 자기 자신에게는 전송할 수 없습니다.</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PointShop;
