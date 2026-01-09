import { useState, useEffect, useCallback } from 'react';
import { walletService } from '../services/walletService';
import { WalletStatusResponse, WalletInfo, NetworkInfo } from '../types';

interface UseWalletReturn {
  // 상태
  isConnected: boolean;
  isVerified: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  walletInfo: WalletInfo | null;
  networkInfo: NetworkInfo | null;
  chainId: number;
  error: string | null;

  // 액션
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<void>;

  // 유틸
  isMetaMaskInstalled: boolean;
  shortAddress: string;
}

export function useWallet(): UseWalletReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [chainId, setChainId] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isMetaMaskInstalled = walletService.isMetaMaskInstalled();

  // 주소 축약
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  // 상태 갱신
  const refreshStatus = useCallback(async () => {
    try {
      // 로컬 지갑 상태 및 체인 ID 확인
      await walletService.getConnectedAccount();
      const currentChainId = await walletService.getCurrentChainId();
      setChainId(currentChainId);

      // 백엔드 상태 조회
      const status: WalletStatusResponse = await walletService.getWalletStatus();
      setIsConnected(status.isConnected);
      setIsVerified(status.isVerified);
      setWalletAddress(status.walletAddress || null);
      setWalletInfo(status.walletInfo || null);

      // 네트워크 정보 조회
      const network = await walletService.getNetworkInfo();
      setNetworkInfo(network);

      setError(null);
    } catch (err) {
      // 인증되지 않은 상태에서는 에러 무시
      setIsConnected(false);
      setIsVerified(false);
    }
  }, []);

  // 지갑 연결
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask가 설치되어 있지 않습니다.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const result = await walletService.fullConnect();

      if (result.success) {
        setIsConnected(true);
        setIsVerified(result.isVerified);
        setWalletAddress(result.walletAddress || null);
        setWalletInfo(result.walletInfo || null);
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '지갑 연결에 실패했습니다.';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled]);

  // 지갑 연결 해제
  const disconnect = useCallback(async () => {
    try {
      await walletService.disconnectWallet();
      setIsConnected(false);
      setIsVerified(false);
      setWalletAddress(null);
      setWalletInfo(null);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '연결 해제에 실패했습니다.';
      setError(message);
    }
  }, []);

  // 초기 로드 및 이벤트 리스너 설정
  useEffect(() => {
    refreshStatus();

    // 계정 변경 감지
    walletService.onAccountsChanged((accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
      } else {
        setWalletAddress(accounts[0]);
      }
      refreshStatus();
    });

    // 네트워크 변경 감지
    walletService.onChainChanged((newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
      refreshStatus();
    });

    return () => {
      walletService.removeListeners();
    };
  }, [refreshStatus]);

  return {
    isConnected,
    isVerified,
    isConnecting,
    walletAddress,
    walletInfo,
    networkInfo,
    chainId,
    error,
    connect,
    disconnect,
    refreshStatus,
    isMetaMaskInstalled,
    shortAddress,
  };
}

export default useWallet;
