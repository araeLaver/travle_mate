import React from 'react';
import { useWallet } from '../hooks/useWallet';
import './WalletConnect.css';

const WalletConnect: React.FC = () => {
  const {
    isConnected,
    isVerified,
    isConnecting,
    walletAddress,
    walletInfo,
    networkInfo,
    error,
    connect,
    disconnect,
    isMetaMaskInstalled,
    shortAddress,
  } = useWallet();

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const getNetworkBadgeClass = () => {
    if (!networkInfo) return '';
    return networkInfo.isTestnet ? 'testnet' : 'mainnet';
  };

  return (
    <div className="wallet-connect-page">
      <div className="wallet-header">
        <h1>지갑 연결</h1>
        <p>NFT를 수집하고 거래하려면 지갑을 연결하세요</p>
      </div>

      {/* 연결 안내 */}
      {!isConnected && (
        <div className="wallet-intro">
          <div className="intro-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M16 10h4v4h-4z" />
              <circle cx="18" cy="12" r="1" />
            </svg>
          </div>
          <h2>MetaMask 지갑 연결</h2>
          <p>
            TravelMate NFT 시스템은 Polygon 네트워크를 사용합니다.
            <br />
            MetaMask 지갑을 연결하여 NFT를 수집하고 관리하세요.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <span>여행지 NFT 수집</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>포인트로 거래</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span>업적 달성 보상</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>랭킹 시스템</span>
            </div>
          </div>

          {!isMetaMaskInstalled ? (
            <div className="metamask-install">
              <p className="warning-text">MetaMask가 설치되어 있지 않습니다.</p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="install-btn"
              >
                MetaMask 설치하기
              </a>
            </div>
          ) : (
            <button className="connect-btn" onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <span className="spinner"></span>
                  연결 중...
                </>
              ) : (
                <>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                    alt="MetaMask"
                    className="metamask-logo"
                  />
                  MetaMask 연결하기
                </>
              )}
            </button>
          )}

          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {/* 연결된 상태 */}
      {isConnected && (
        <div className="wallet-connected">
          <div className="connection-status">
            <span className={`status-badge ${isVerified ? 'verified' : 'pending'}`}>
              {isVerified ? '검증됨' : '검증 대기'}
            </span>
            {networkInfo && (
              <span className={`network-badge ${getNetworkBadgeClass()}`}>{networkInfo.name}</span>
            )}
          </div>

          <div className="wallet-card">
            <div className="wallet-card-header">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                alt="MetaMask"
                className="wallet-logo"
              />
              <div className="wallet-address-section">
                <span className="label">지갑 주소</span>
                <span className="address" title={walletAddress || ''}>
                  {shortAddress}
                </span>
              </div>
            </div>

            {walletInfo && (
              <div className="wallet-details">
                <div className="detail-row">
                  <span className="detail-label">잔액</span>
                  <span className="detail-value">{walletInfo.balanceFormatted}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">수집한 NFT</span>
                  <span className="detail-value">{walletInfo.nftCount}개</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">네트워크</span>
                  <span className="detail-value">{walletInfo.networkName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Chain ID</span>
                  <span className="detail-value">{walletInfo.chainId}</span>
                </div>
              </div>
            )}

            {networkInfo && (
              <div className="network-details">
                <h4>네트워크 정보</h4>
                <div className="detail-row">
                  <span className="detail-label">컨트랙트</span>
                  <span className="detail-value contract-address">
                    {networkInfo.contractAddress
                      ? `${networkInfo.contractAddress.slice(0, 10)}...${networkInfo.contractAddress.slice(-8)}`
                      : '미설정'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">통화</span>
                  <span className="detail-value">{networkInfo.currencySymbol}</span>
                </div>
                {networkInfo.blockExplorerUrl && (
                  <a
                    href={networkInfo.blockExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                  >
                    블록 탐색기 열기 →
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="wallet-actions">
            <button className="action-btn primary" onClick={() => (window.location.href = '/nft')}>
              NFT 수집하러 가기
            </button>
            <button
              className="action-btn secondary"
              onClick={() => (window.location.href = '/nft/collection')}
            >
              내 컬렉션 보기
            </button>
            <button className="action-btn danger" onClick={handleDisconnect}>
              연결 해제
            </button>
          </div>
        </div>
      )}

      {/* 안내 섹션 */}
      <div className="info-section">
        <h3>Polygon 네트워크란?</h3>
        <p>
          Polygon은 이더리움과 호환되는 레이어2 블록체인으로, 빠른 트랜잭션 속도와 저렴한 가스비를
          제공합니다. TravelMate는 Polygon Amoy 테스트넷을 사용합니다.
        </p>

        <h3>테스트넷 MATIC 받기</h3>
        <p>
          NFT를 민팅하려면 소량의 MATIC이 필요합니다.
          <a href="https://faucet.polygon.technology/" target="_blank" rel="noopener noreferrer">
            Polygon Faucet
          </a>
          에서 무료로 테스트넷 MATIC을 받을 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default WalletConnect;
