import React, { useState, useEffect, useCallback } from 'react';
import { mintingService, MintingStatusResponse, MintStatus } from '../../services/mintingService';
import { useWallet } from '../../hooks/useWallet';
import './MintingModal.css';

// SVG Icons
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
  </svg>
);

interface MintingModalProps {
  collectionId: number;
  locationName: string;
  nftImageUrl?: string | null;
  rarity: string;
  currentMintStatus: MintStatus;
  onClose: () => void;
  onMintingComplete?: () => void;
}

const STEP_LABELS = ['지갑 연결', '민팅 요청', '블록체인 처리', '완료'];

const MintingModal: React.FC<MintingModalProps> = ({
  collectionId,
  locationName,
  nftImageUrl,
  rarity,
  currentMintStatus,
  onClose,
  onMintingComplete,
}) => {
  const { isConnected, walletAddress, connect, isConnecting } = useWallet();
  const [mintStatus, setMintStatus] = useState<MintingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // 현재 단계 계산
  const calculateStep = useCallback(
    (status: MintStatus): number => {
      switch (status) {
        case 'PENDING':
          return isConnected ? 1 : 0;
        case 'MINTING':
          return 2;
        case 'CONFIRMING':
          return 2;
        case 'MINTED':
          return 3;
        case 'FAILED':
          return 2;
        default:
          return 0;
      }
    },
    [isConnected]
  );

  // 민팅 상태 조회
  const fetchMintingStatus = useCallback(async () => {
    try {
      const status = await mintingService.getMintingStatus(collectionId);
      setMintStatus(status);
      setCurrentStep(calculateStep(status.mintStatus));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('민팅 상태 조회 실패:', err);
    }
  }, [collectionId, calculateStep]);

  // 초기 상태 설정 및 폴링
  useEffect(() => {
    fetchMintingStatus();

    // MINTING 또는 CONFIRMING 상태일 때 폴링
    const shouldPoll = currentMintStatus === 'MINTING' || currentMintStatus === 'CONFIRMING';

    let pollInterval: NodeJS.Timeout | null = null;
    if (shouldPoll) {
      pollInterval = setInterval(fetchMintingStatus, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchMintingStatus, currentMintStatus]);

  // 지갑 연결 변경 감지
  useEffect(() => {
    if (mintStatus) {
      setCurrentStep(calculateStep(mintStatus.mintStatus));
    }
  }, [isConnected, mintStatus, calculateStep]);

  // 민팅 요청
  const handleMint = async () => {
    if (!walletAddress) {
      setError('지갑을 먼저 연결해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await mintingService.requestMinting(collectionId, walletAddress);

      // 상태 폴링 시작
      const pollInterval = setInterval(async () => {
        const status = await mintingService.getMintingStatus(collectionId);
        setMintStatus(status);
        setCurrentStep(calculateStep(status.mintStatus));

        if (status.mintStatus === 'MINTED' || status.mintStatus === 'FAILED') {
          clearInterval(pollInterval);
          if (status.mintStatus === 'MINTED' && onMintingComplete) {
            onMintingComplete();
          }
        }
      }, 3000);

      // 초기 상태 업데이트
      await fetchMintingStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '민팅 요청에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 민팅 재시도
  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await mintingService.retryMinting(collectionId);
      await fetchMintingStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '민팅 재시도에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 지갑 연결
  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : '지갑 연결에 실패했습니다.');
    }
  };

  const getRarityColor = (rarityName: string): string => {
    switch (rarityName.toUpperCase()) {
      case 'COMMON':
        return '#9ca3af';
      case 'RARE':
        return '#3b82f6';
      case 'EPIC':
        return '#8b5cf6';
      case 'LEGENDARY':
        return '#f59e0b';
      default:
        return '#9ca3af';
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const status = mintStatus?.mintStatus || currentMintStatus;

  return (
    <div
      className="minting-modal-overlay"
      onClick={onClose}
      data-testid="minting-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="NFT 민팅"
    >
      <div className="minting-modal" onClick={e => e.stopPropagation()} data-testid="minting-modal">
        <div className="minting-modal-header">
          <h2>NFT 민팅</h2>
          <button
            className="close-btn"
            onClick={onClose}
            data-testid="minting-close-btn"
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="minting-modal-content">
          {/* NFT 프리뷰 */}
          <div className="nft-preview">
            {nftImageUrl ? (
              <img src={nftImageUrl} alt={locationName} />
            ) : (
              <div className="nft-placeholder" data-testid="nft-placeholder">
                <WalletIcon />
              </div>
            )}
            <div
              className="rarity-badge"
              style={{ backgroundColor: getRarityColor(rarity) }}
              data-testid="rarity-badge"
            >
              {rarity}
            </div>
          </div>

          <h3 className="nft-name">{locationName}</h3>

          {/* 진행 단계 */}
          <div className="minting-steps" data-testid="minting-steps">
            {STEP_LABELS.map((label, index) => (
              <div
                key={label}
                className={`step ${index < currentStep ? 'completed' : ''} ${
                  index === currentStep ? 'active' : ''
                }`}
                data-testid={`minting-step-${index}`}
              >
                <div className="step-indicator">
                  {index < currentStep ? <CheckCircleIcon /> : <span>{index + 1}</span>}
                </div>
                <span className="step-label" data-testid={`step-label-${index}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* 상태 표시 */}
          <div className={`status-card ${status.toLowerCase()}`}>
            {status === 'MINTING' || status === 'CONFIRMING' ? (
              <>
                <div className="loading-spinner" />
                <p>
                  {status === 'MINTING'
                    ? '블록체인에 NFT를 기록하고 있습니다...'
                    : '트랜잭션 확인 중입니다...'}
                </p>
              </>
            ) : status === 'MINTED' ? (
              <>
                <div className="success-icon">
                  <CheckCircleIcon />
                </div>
                <p>민팅이 완료되었습니다!</p>
                {mintStatus?.tokenId && (
                  <span className="token-id">Token ID: {mintStatus.tokenId}</span>
                )}
              </>
            ) : status === 'FAILED' ? (
              <>
                <div className="error-icon">
                  <AlertCircleIcon />
                </div>
                <p>민팅에 실패했습니다.</p>
              </>
            ) : (
              <>
                <div className="pending-icon">
                  <WalletIcon />
                </div>
                <p>
                  {isConnected
                    ? '민팅 버튼을 눌러 NFT를 블록체인에 기록하세요.'
                    : '지갑을 연결하여 민팅을 시작하세요.'}
                </p>
              </>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="error-message">
              <AlertCircleIcon />
              <span>{error}</span>
            </div>
          )}

          {/* 트랜잭션 링크 */}
          {mintStatus?.transactionHash && (
            <div className="transaction-links">
              <a
                href={mintingService.getPolygonscanTxUrl(mintStatus.transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="link-btn"
              >
                <ExternalLinkIcon />
                Polygonscan에서 보기
              </a>
              {mintStatus.mintStatus === 'MINTED' &&
                mintStatus.tokenId &&
                mintStatus.contractAddress && (
                  <a
                    href={mintingService.getOpenseaUrl(
                      mintStatus.contractAddress,
                      mintStatus.tokenId
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-btn"
                  >
                    <ExternalLinkIcon />
                    OpenSea에서 보기
                  </a>
                )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="minting-actions">
            {!isConnected ? (
              <button
                className="action-btn primary"
                onClick={handleConnect}
                disabled={isConnecting}
                data-testid="connect-wallet-btn"
              >
                {isConnecting ? (
                  <>
                    <div className="btn-spinner" />
                    연결 중...
                  </>
                ) : (
                  <>
                    <WalletIcon />
                    지갑 연결
                  </>
                )}
              </button>
            ) : status === 'PENDING' ? (
              <button className="action-btn primary" onClick={handleMint} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="btn-spinner" />
                    요청 중...
                  </>
                ) : (
                  'NFT 민팅하기'
                )}
              </button>
            ) : status === 'FAILED' ? (
              <button className="action-btn primary" onClick={handleRetry} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="btn-spinner" />
                    재시도 중...
                  </>
                ) : (
                  <>
                    <RefreshIcon />
                    민팅 재시도
                  </>
                )}
              </button>
            ) : status === 'MINTED' ? (
              <button className="action-btn secondary" onClick={onClose} data-testid="minting-close-action-btn">
                닫기
              </button>
            ) : null}
          </div>

          {/* 지갑 정보 */}
          {isConnected && walletAddress && (
            <div className="wallet-info">
              <WalletIcon />
              <span>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MintingModal;
