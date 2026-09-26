import { walletService } from './walletService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('WalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: undefined,
    });
  });

  it('detects MetaMask and returns the connected account', async () => {
    const request = jest.fn().mockResolvedValueOnce(['0xabc']);
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: {
        isMetaMask: true,
        request,
        on: jest.fn(),
      },
    });

    expect(walletService.isMetaMaskInstalled()).toBe(true);
    await expect(walletService.getConnectedAccount()).resolves.toBe('0xabc');
    expect(request).toHaveBeenCalledWith({ method: 'eth_accounts' });
  });

  it('returns null when no wallet account is connected', async () => {
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: {
        request: jest.fn().mockResolvedValueOnce([]),
        on: jest.fn(),
      },
    });

    await expect(walletService.getConnectedAccount()).resolves.toBeNull();
  });

  it('requests sign messages and verifies wallet connections through backend endpoints', async () => {
    const signMessage = {
      message: 'Sign this',
      nonce: 'nonce',
      timestamp: 1000,
      expiresAt: 2000,
    };
    const verifyRequest = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      message: 'Sign this',
      signature: '0xsig',
    };
    mockApiClient.post.mockResolvedValueOnce(signMessage).mockResolvedValueOnce({
      success: true,
      walletAddress: verifyRequest.walletAddress,
      isVerified: true,
      message: 'connected',
    });

    const messageResult = await walletService.requestSignMessage(verifyRequest.walletAddress);
    const verifyResult = await walletService.verifyAndConnect(verifyRequest);

    expect(mockApiClient.post).toHaveBeenNthCalledWith(1, '/wallet/sign-message', {
      walletAddress: verifyRequest.walletAddress,
    });
    expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/wallet/verify', verifyRequest);
    expect(messageResult).toBe(signMessage);
    expect(verifyResult.success).toBe(true);
  });

  it('loads wallet status, disconnects wallets, and loads network info', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      isConnected: true,
      isVerified: true,
      walletAddress: '0x1234567890123456789012345678901234567890',
    });
    mockApiClient.delete.mockResolvedValueOnce({
      success: true,
      message: 'disconnected',
    });
    mockApiClient.get.mockResolvedValueOnce({
      name: 'Polygon Amoy',
      chainId: 80002,
      rpcUrl: 'https://rpc-amoy.polygon.technology',
      currencySymbol: 'MATIC',
      blockExplorerUrl: 'https://amoy.polygonscan.com',
      contractAddress: '0xcontract',
      isTestnet: true,
    });

    const status = await walletService.getWalletStatus();
    const disconnect = await walletService.disconnectWallet();
    const network = await walletService.getNetworkInfo();

    expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/wallet/status');
    expect(mockApiClient.delete).toHaveBeenCalledWith('/wallet/disconnect');
    expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/wallet/network');
    expect(status.isConnected).toBe(true);
    expect(disconnect.success).toBe(true);
    expect(network.chainId).toBe(80002);
  });

  it('switches to Polygon Amoy and adds the chain when MetaMask does not know it', async () => {
    const request = jest
      .fn()
      .mockRejectedValueOnce({ code: 4902 })
      .mockResolvedValueOnce(undefined);
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: {
        request,
        on: jest.fn(),
      },
    });

    await walletService.switchToPolygon(true);

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x13882' }],
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'wallet_addEthereumChain',
      params: [
        expect.objectContaining({
          chainId: '0x13882',
          chainName: 'Polygon Amoy Testnet',
        }),
      ],
    });
  });
});
