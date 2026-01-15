import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { pointService } from '../services/pointService';
import {
  PointBalanceResponse,
  PointTransactionResponse,
  PointTransactionType,
} from '../types';
import './PointShop.css';

// SVG Icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);

const ShopIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// 상점 아이템 (향후 확장용)
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  category: string;
  available: boolean;
}

const shopItems: ShopItem[] = [
  {
    id: 'border-gold',
    name: '골드 테두리',
    description: '프로필에 골드 테두리가 적용됩니다',
    price: 500,
    icon: <StarIcon />,
    category: 'profile',
    available: false,
  },
  {
    id: 'nickname-color',
    name: '닉네임 컬러',
    description: '닉네임에 특별한 색상을 적용합니다',
    price: 1000,
    icon: <UserIcon />,
    category: 'profile',
    available: false,
  },
  {
    id: 'premium-badge',
    name: '프리미엄 배지',
    description: '프로필에 프리미엄 배지가 표시됩니다',
    price: 2000,
    icon: <TrophyIcon />,
    category: 'badge',
    available: false,
  },
  {
    id: 'event-ticket',
    name: '시즌 이벤트 입장권',
    description: '시즌 특별 이벤트에 참여할 수 있습니다',
    price: 5000,
    icon: <GiftIcon />,
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

  // 필터
  const [selectedType, setSelectedType] = useState<PointTransactionType | 'ALL'>('ALL');

  // 전송 폼
  const [receiverId, setReceiverId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // 포인트 잔액 조회
  const loadBalance = useCallback(async () => {
    try {
      const res = await pointService.getBalance();
      setBalance(res);
    } catch {
      toast.error('잔액 조회에 실패했습니다.');
    }
  }, [toast]);

  // 거래 내역 조회
  const loadTransactions = useCallback(async (reset = false) => {
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
  }, [page, selectedType, toast]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadTransactions(true);
    }
  }, [activeTab, selectedType, loadTransactions]);

  // 포인트 전송
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

  // 더 보기
  const loadMore = () => {
    setPage(prev => prev + 1);
    loadTransactions();
  };

  // 거래 타입 아이콘 및 색상
  const getTransactionStyle = (type: PointTransactionType) => {
    switch (type) {
      case 'EARN':
        return { icon: <ArrowUpIcon />, color: '#22c55e', label: '획득' };
      case 'SPEND':
        return { icon: <ArrowDownIcon />, color: '#ef4444', label: '사용' };
      case 'TRANSFER_IN':
        return { icon: <ArrowUpIcon />, color: '#3b82f6', label: '받음' };
      case 'TRANSFER_OUT':
        return { icon: <ArrowDownIcon />, color: '#f59e0b', label: '보냄' };
      default:
        return { icon: <CoinIcon />, color: '#94a3b8', label: type };
    }
  };

  // 날짜 포맷
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

  return (
    <div className="point-shop">
      {/* 헤더 */}
      <header className="shop-header">
        <button className="btn-back" onClick={() => navigate(-1)} aria-label="뒤로 가기">
          <BackIcon />
        </button>
        <h1>포인트 상점</h1>
        <div />
      </header>

      {/* 포인트 잔액 카드 */}
      <div className="balance-card">
        <div className="balance-main">
          <CoinIcon />
          <span className="balance-amount">{balance?.totalPoints?.toLocaleString() || 0}</span>
          <span className="balance-unit">P</span>
        </div>
        <div className="balance-stats">
          <div className="stat-item">
            <span className="stat-label">누적 획득</span>
            <span className="stat-value earn">{balance?.lifetimeEarned?.toLocaleString() || 0}P</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-label">누적 사용</span>
            <span className="stat-value spend">{balance?.lifetimeSpent?.toLocaleString() || 0}P</span>
          </div>
        </div>
        <div className="balance-extra">
          <div className="extra-item">
            <span>시즌 포인트</span>
            <span>{balance?.seasonPoints?.toLocaleString() || 0}P</span>
          </div>
          <div className="extra-item">
            <span>현재 순위</span>
            <span>#{balance?.currentRank || '-'}</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          <ShopIcon />
          상점
        </button>
        <button
          className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <HistoryIcon />
          거래 내역
        </button>
        <button
          className={`tab-item ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          <SendIcon />
          전송
        </button>
      </div>

      {/* 상점 탭 */}
      {activeTab === 'shop' && (
        <div className="tab-content">
          <div className="coming-soon-banner">
            <GiftIcon />
            <h3>상점 준비 중</h3>
            <p>다양한 아이템이 곧 출시됩니다!</p>
          </div>

          <div className="shop-items">
            {shopItems.map(item => (
              <article key={item.id} className={`shop-item ${!item.available ? 'disabled' : ''}`}>
                <div className="item-icon">{item.icon}</div>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="item-price">
                  <CoinIcon />
                  <span>{item.price.toLocaleString()}P</span>
                </div>
                {!item.available && <span className="coming-soon-badge">준비 중</span>}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 거래 내역 탭 */}
      {activeTab === 'history' && (
        <div className="tab-content">
          {/* 필터 */}
          <div className="filter-bar">
            <button
              className={`filter-btn ${selectedType === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedType('ALL')}
            >
              전체
            </button>
            <button
              className={`filter-btn ${selectedType === 'EARN' ? 'active' : ''}`}
              onClick={() => setSelectedType('EARN')}
            >
              획득
            </button>
            <button
              className={`filter-btn ${selectedType === 'SPEND' ? 'active' : ''}`}
              onClick={() => setSelectedType('SPEND')}
            >
              사용
            </button>
            <button
              className={`filter-btn ${selectedType === 'TRANSFER_IN' ? 'active' : ''}`}
              onClick={() => setSelectedType('TRANSFER_IN')}
            >
              받음
            </button>
            <button
              className={`filter-btn ${selectedType === 'TRANSFER_OUT' ? 'active' : ''}`}
              onClick={() => setSelectedType('TRANSFER_OUT')}
            >
              보냄
            </button>
          </div>

          {transactions.length === 0 && !isLoading ? (
            <div className="empty-state">
              <HistoryIcon />
              <h3>거래 내역이 없습니다</h3>
              <p>NFT를 수집하거나 활동하여 포인트를 획득해보세요!</p>
            </div>
          ) : (
            <div className="transaction-list">
              {transactions.map(tx => {
                const style = getTransactionStyle(tx.type);
                return (
                  <article key={tx.id} className="transaction-item">
                    <div className="tx-icon" style={{ backgroundColor: `${style.color}20`, color: style.color }}>
                      {style.icon}
                    </div>
                    <div className="tx-info">
                      <h4>{tx.description}</h4>
                      <span className="tx-time">{formatDate(tx.createdAt)}</span>
                    </div>
                    <div className="tx-amount" style={{ color: style.color }}>
                      {tx.type === 'EARN' || tx.type === 'TRANSFER_IN' ? '+' : '-'}
                      {tx.amount.toLocaleString()}P
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {hasMore && !isLoading && (
            <button className="btn-load-more" onClick={loadMore}>
              더 보기
            </button>
          )}

          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          )}
        </div>
      )}

      {/* 전송 탭 */}
      {activeTab === 'transfer' && (
        <div className="tab-content">
          <form className="transfer-form" onSubmit={handleTransfer}>
            <div className="form-group">
              <label htmlFor="receiverId">수신자 ID</label>
              <input
                id="receiverId"
                type="number"
                placeholder="포인트를 받을 사용자 ID"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="transferAmount">전송 금액</label>
              <div className="amount-input-wrapper">
                <CoinIcon />
                <input
                  id="transferAmount"
                  type="number"
                  placeholder="전송할 포인트"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  min="1"
                  max={balance?.totalPoints || 0}
                  required
                />
                <span>P</span>
              </div>
              <p className="input-hint">사용 가능: {balance?.totalPoints?.toLocaleString() || 0}P</p>
            </div>

            <div className="form-group">
              <label htmlFor="transferMessage">메시지 (선택)</label>
              <input
                id="transferMessage"
                type="text"
                placeholder="함께 전달할 메시지"
                value={transferMessage}
                onChange={(e) => setTransferMessage(e.target.value)}
                maxLength={100}
              />
            </div>

            <button
              type="submit"
              className="btn-transfer"
              disabled={isTransferring || !balance || balance.totalPoints < parseInt(transferAmount || '0')}
            >
              <SendIcon />
              {isTransferring ? '전송 중...' : '포인트 전송'}
            </button>
          </form>

          <div className="transfer-info">
            <h4>포인트 전송 안내</h4>
            <ul>
              <li>전송된 포인트는 취소할 수 없습니다.</li>
              <li>최소 전송 금액은 1P입니다.</li>
              <li>자기 자신에게는 전송할 수 없습니다.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointShop;
