import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import './WalletButton.css';

interface WalletButtonProps {
  variant?: 'full' | 'compact';
  showBalance?: boolean;
}

const WalletButton: React.FC<WalletButtonProps> = ({ variant = 'full', showBalance = true }) => {
  const navigate = useNavigate();
  const { isConnected, isConnecting, walletInfo, shortAddress, isMetaMaskInstalled, connect } =
    useWallet();

  const handleClick = async () => {
    if (isConnected) {
      navigate('/wallet');
    } else if (isMetaMaskInstalled) {
      await connect();
    } else {
      navigate('/wallet');
    }
  };

  if (variant === 'compact') {
    return (
      <button
        className={`wallet-btn-compact ${isConnected ? 'connected' : ''}`}
        onClick={handleClick}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <span className="loading-dot" />
        ) : isConnected ? (
          <>
            <span className="wallet-icon">💰</span>
            <span className="wallet-address">{shortAddress}</span>
          </>
        ) : (
          <>
            <span className="wallet-icon">🔗</span>
            <span>연결</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="wallet-btn-container">
      {isConnected ? (
        <button className="wallet-btn connected" onClick={handleClick}>
          <div className="wallet-btn-content">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
              alt="MetaMask"
              className="wallet-icon-img"
            />
            <div className="wallet-info">
              <span className="wallet-label">지갑 연결됨</span>
              <span className="wallet-address-full">{shortAddress}</span>
            </div>
            {showBalance && walletInfo && (
              <span className="wallet-balance">{walletInfo.balanceFormatted}</span>
            )}
          </div>
        </button>
      ) : (
        <button className="wallet-btn not-connected" onClick={handleClick} disabled={isConnecting}>
          {isConnecting ? (
            <>
              <span className="spinner-small" />
              <span>연결 중...</span>
            </>
          ) : (
            <>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                alt="MetaMask"
                className="wallet-icon-img"
              />
              <span>지갑 연결하기</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default WalletButton;
