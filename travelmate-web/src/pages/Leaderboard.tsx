import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { pointService } from '../services/pointService';
import {
  PointBalanceResponse,
  PointTransactionResponse,
  LeaderboardEntry,
  PointTransactionType,
} from '../types';
import './Leaderboard.css';

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
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const transactionTypeLabels: Record<PointTransactionType, { label: string; color: string }> = {
  EARN: { label: '획득', color: '#22c55e' },
  SPEND: { label: '사용', color: '#ef4444' },
  TRANSFER_IN: { label: '수신', color: '#3b82f6' },
  TRANSFER_OUT: { label: '전송', color: '#f59e0b' },
};

type TabType = 'leaderboard' | 'history' | 'transfer';

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
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return '#64748b';
  };

  return (
    <div className="leaderboard-page">
      {/* 헤더 */}
      <header className="leaderboard-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <BackIcon />
        </button>
        <h1>포인트</h1>
        <div />
      </header>

      {/* 잔액 카드 */}
      {balance && (
        <div className="balance-card">
          <div className="balance-main">
            <CoinIcon />
            <span className="balance-amount">{balance.totalPoints.toLocaleString()}</span>
            <span className="balance-unit">P</span>
          </div>
          <div className="balance-details">
            <div className="balance-item">
              <span className="balance-label">총 획득</span>
              <span className="balance-value earn">{balance.lifetimeEarned.toLocaleString()}P</span>
            </div>
            <div className="balance-item">
              <span className="balance-label">총 사용</span>
              <span className="balance-value spend">{balance.lifetimeSpent.toLocaleString()}P</span>
            </div>
            <div className="balance-item">
              <span className="balance-label">현재 순위</span>
              <span className="balance-value rank">#{balance.currentRank}</span>
            </div>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <TrophyIcon />
          랭킹
        </button>
        <button
          className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <CoinIcon />
          내역
        </button>
        <button
          className={`tab-item ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          <SendIcon />
          전송
        </button>
      </div>

      {/* 리더보드 탭 */}
      {activeTab === 'leaderboard' && (
        <div className="tab-content">
          {/* 시즌 토글 */}
          <div className="leaderboard-toggle">
            <button
              className={`toggle-btn ${!showSeason ? 'active' : ''}`}
              onClick={() => setShowSeason(false)}
            >
              전체
            </button>
            <button
              className={`toggle-btn ${showSeason ? 'active' : ''}`}
              onClick={() => setShowSeason(true)}
            >
              시즌
            </button>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="leaderboard-list">
              {currentLeaderboard.map(entry => (
                <div
                  key={entry.userId}
                  className={`leaderboard-item ${entry.rank <= 3 ? 'top-rank' : ''}`}
                >
                  <div className="rank-badge" style={{ backgroundColor: getRankColor(entry.rank) }}>
                    {entry.rank <= 3 ? <TrophyIcon /> : entry.rank}
                  </div>
                  <div className="user-avatar">
                    {entry.profileImageUrl ? (
                      <img src={entry.profileImageUrl} alt={entry.nickname} />
                    ) : (
                      <span>{entry.nickname.charAt(0)}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{entry.nickname}</span>
                    <span className="user-nfts">{entry.totalNftsCollected} NFTs</span>
                  </div>
                  <div className="user-points">
                    <CoinIcon />
                    <span>{entry.totalPoints.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 거래 내역 탭 */}
      {activeTab === 'history' && (
        <div className="tab-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <CoinIcon />
              <h3>거래 내역이 없습니다</h3>
              <p>NFT를 수집하여 포인트를 획득해보세요!</p>
            </div>
          ) : (
            <div className="transactions-list">
              {transactions.map(tx => {
                const typeInfo = transactionTypeLabels[tx.type];
                const isPositive = tx.type === 'EARN' || tx.type === 'TRANSFER_IN';

                return (
                  <div key={tx.id} className="transaction-item">
                    <div className="tx-icon" style={{ backgroundColor: `${typeInfo.color}20` }}>
                      {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    </div>
                    <div className="tx-info">
                      <span className="tx-description">{tx.description}</span>
                      <span className="tx-meta">
                        <span className="tx-type" style={{ color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                        <span className="tx-date">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                    <div className={`tx-amount ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : '-'}
                      {tx.amount.toLocaleString()}P
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 전송 탭 */}
      {activeTab === 'transfer' && (
        <div className="tab-content">
          <form className="transfer-form" onSubmit={handleTransfer}>
            <div className="form-group">
              <label>받는 사람 ID</label>
              <input
                type="number"
                value={transferReceiverId}
                onChange={e => setTransferReceiverId(e.target.value)}
                placeholder="사용자 ID를 입력하세요"
                required
              />
            </div>
            <div className="form-group">
              <label>전송 금액</label>
              <div className="amount-input">
                <input
                  type="number"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0"
                  required
                  min="1"
                />
                <span className="unit">P</span>
              </div>
              {balance && (
                <span className="balance-hint">보유: {balance.totalPoints.toLocaleString()}P</span>
              )}
            </div>
            <div className="form-group">
              <label>메시지 (선택)</label>
              <input
                type="text"
                value={transferMessage}
                onChange={e => setTransferMessage(e.target.value)}
                placeholder="전송 메시지를 입력하세요"
              />
            </div>
            <button type="submit" className="btn-send" disabled={isSending}>
              {isSending ? (
                <>
                  <span className="spinner" />
                  전송 중...
                </>
              ) : (
                <>
                  <SendIcon />
                  포인트 전송
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
