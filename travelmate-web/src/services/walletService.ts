import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { apiClient } from './apiClient';
import {
  SignMessageResponse,
  VerifySignatureRequest,
  WalletConnectionResponse,
  WalletStatusResponse,
  NetworkInfo,
  DisconnectWalletResponse,
} from '../types';

// Polygon Network 설정
const POLYGON_NETWORKS = {
  mainnet: {
    chainId: '0x89', // 137
    chainName: 'Polygon Mainnet',
    rpcUrls: ['https://polygon-rpc.com'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  amoy: {
    chainId: '0x13882', // 80002
    chainName: 'Polygon Amoy Testnet',
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorerUrls: ['https://amoy.polygonscan.com'],
  },
};

class WalletService {
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;

  /**
   * MetaMask 연결 확인
   */
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  /**
   * 현재 연결된 계정 조회
   */
  async getConnectedAccount(): Promise<string | null> {
    if (!this.isMetaMaskInstalled()) return null;

    try {
      const accounts = (await window.ethereum!.request({ method: 'eth_accounts' })) as string[];
      return accounts.length > 0 ? accounts[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * MetaMask 지갑 연결
   */
  async connectMetaMask(): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask가 설치되어 있지 않습니다. MetaMask를 설치해주세요.');
    }

    try {
      const accounts = (await window.ethereum!.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts.length === 0) {
        throw new Error('지갑 연결이 거부되었습니다.');
      }

      this.provider = new BrowserProvider(window.ethereum!);
      this.signer = await this.provider.getSigner();

      return accounts[0];
    } catch (error: unknown) {
      if ((error as { code?: number })?.code === 4001) {
        throw new Error('지갑 연결이 거부되었습니다.');
      }
      throw error;
    }
  }

  /**
   * Polygon 네트워크로 전환
   */
  async switchToPolygon(testnet = true): Promise<void> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask가 설치되어 있지 않습니다.');
    }

    const network = testnet ? POLYGON_NETWORKS.amoy : POLYGON_NETWORKS.mainnet;

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
    } catch (switchError: unknown) {
      // 네트워크가 없으면 추가
      if ((switchError as { code?: number })?.code === 4902) {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        });
      } else {
        throw switchError;
      }
    }
  }

  /**
   * 현재 네트워크 체인 ID 조회
   */
  async getCurrentChainId(): Promise<number> {
    if (!this.isMetaMaskInstalled()) return 0;

    try {
      const chainId = (await window.ethereum!.request({ method: 'eth_chainId' })) as string;
      return parseInt(chainId, 16);
    } catch {
      return 0;
    }
  }

  /**
   * 메시지 서명
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      await this.connectMetaMask();
    }

    if (!this.signer) {
      throw new Error('지갑이 연결되지 않았습니다.');
    }

    return await this.signer.signMessage(message);
  }

  /**
   * 백엔드: 서명 메시지 생성 요청
   */
  async requestSignMessage(walletAddress: string): Promise<SignMessageResponse> {
    return await apiClient.post<SignMessageResponse>('/wallet/sign-message', {
      walletAddress,
    });
  }

  /**
   * 백엔드: 서명 검증 및 지갑 연결
   */
  async verifyAndConnect(request: VerifySignatureRequest): Promise<WalletConnectionResponse> {
    return await apiClient.post<WalletConnectionResponse>('/wallet/verify', request);
  }

  /**
   * 백엔드: 지갑 상태 조회
   */
  async getWalletStatus(): Promise<WalletStatusResponse> {
    return await apiClient.get<WalletStatusResponse>('/wallet/status');
  }

  /**
   * 백엔드: 지갑 연결 해제
   */
  async disconnectWallet(): Promise<DisconnectWalletResponse> {
    return await apiClient.delete<DisconnectWalletResponse>('/wallet/disconnect');
  }

  /**
   * 백엔드: 네트워크 정보 조회
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    return await apiClient.get<NetworkInfo>('/wallet/network');
  }

  /**
   * 전체 지갑 연결 프로세스
   */
  async fullConnect(): Promise<WalletConnectionResponse> {
    // 1. MetaMask 연결
    const walletAddress = await this.connectMetaMask();

    // 2. Polygon 네트워크로 전환
    await this.switchToPolygon(true); // testnet

    // 3. 서명 메시지 요청
    const { message } = await this.requestSignMessage(walletAddress);

    // 4. 메시지 서명
    const signature = await this.signMessage(message);

    // 5. 서명 검증 및 연결
    const result = await this.verifyAndConnect({
      walletAddress,
      message,
      signature,
    });

    return result;
  }

  /**
   * 계정 변경 이벤트 리스너
   */
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (this.isMetaMaskInstalled()) {
      window.ethereum!.on('accountsChanged', (args: unknown) => {
        callback(args as string[]);
      });
    }
  }

  /**
   * 네트워크 변경 이벤트 리스너
   */
  onChainChanged(callback: (chainId: string) => void): void {
    if (this.isMetaMaskInstalled()) {
      window.ethereum!.on('chainChanged', (args: unknown) => {
        callback(args as string);
      });
    }
  }

  /**
   * 이벤트 리스너 제거
   */
  removeListeners(): void {
    if (this.isMetaMaskInstalled()) {
      window.ethereum!.removeAllListeners?.();
    }
  }
}

// 전역 타입 선언
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeAllListeners?: () => void;
    };
  }
}

export const walletService = new WalletService();
export default walletService;
