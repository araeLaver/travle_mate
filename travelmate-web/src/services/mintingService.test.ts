import {
  mintingService,
  getPolygonscanTxUrl,
  getOpenseaUrl,
  getMintStatusLabel,
  getMintStatusColor,
} from './mintingService';

// Mock fetch
global.fetch = jest.fn();

// Mock authService
jest.mock('./authService', () => ({
  authService: {
    getToken: jest.fn(() => 'mock-token'),
  },
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('MintingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestMinting', () => {
    it('should request minting successfully', async () => {
      const mockResponse = {
        collectionId: 1,
        locationId: 1,
        locationName: '테스트 장소',
        mintStatus: 'MINTING' as const,
        walletAddress: '0x1234567890abcdef',
        message: '민팅이 시작되었습니다.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await mintingService.requestMinting(1, '0x1234567890abcdef');

      expect(result.mintStatus).toBe('MINTING');
      expect(result.message).toBe('민팅이 시작되었습니다.');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/nft/mint/1'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ walletAddress: '0x1234567890abcdef' }),
        })
      );
    });

    it('should throw error when not owner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '권한이 없습니다.' }),
      } as Response);

      await expect(
        mintingService.requestMinting(1, '0x1234567890abcdef')
      ).rejects.toThrow('권한이 없습니다.');
    });

    it('should throw error when already minted', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '이미 민팅된 NFT입니다.' }),
      } as Response);

      await expect(
        mintingService.requestMinting(1, '0x1234567890abcdef')
      ).rejects.toThrow('이미 민팅된 NFT입니다.');
    });

    it('should throw error when minting in progress', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '민팅이 진행 중입니다.' }),
      } as Response);

      await expect(
        mintingService.requestMinting(1, '0x1234567890abcdef')
      ).rejects.toThrow('민팅이 진행 중입니다.');
    });
  });

  describe('getMintingStatus', () => {
    it('should fetch minting status - MINTED', async () => {
      const mockResponse = {
        collectionId: 1,
        locationId: 1,
        locationName: '테스트 장소',
        nftImageUrl: 'https://example.com/nft.png',
        rarity: 'RARE',
        mintStatus: 'MINTED' as const,
        tokenId: '12345',
        transactionHash: '0xabc123def456',
        contractAddress: '0xcontract',
        walletAddress: '0xwallet',
        polygonscanUrl: 'https://amoy.polygonscan.com/tx/0xabc123def456',
        openseaUrl: 'https://testnets.opensea.io/assets/amoy/0xcontract/12345',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await mintingService.getMintingStatus(1);

      expect(result.mintStatus).toBe('MINTED');
      expect(result.tokenId).toBe('12345');
      expect(result.transactionHash).toBe('0xabc123def456');
    });

    it('should fetch minting status - MINTING', async () => {
      const mockResponse = {
        collectionId: 1,
        locationId: 1,
        locationName: '테스트 장소',
        nftImageUrl: 'https://example.com/nft.png',
        rarity: 'COMMON',
        mintStatus: 'MINTING' as const,
        tokenId: null,
        transactionHash: null,
        contractAddress: null,
        walletAddress: '0xwallet',
        polygonscanUrl: null,
        openseaUrl: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await mintingService.getMintingStatus(1);

      expect(result.mintStatus).toBe('MINTING');
      expect(result.tokenId).toBeNull();
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'NFT 컬렉션을 찾을 수 없습니다.' }),
      } as Response);

      await expect(mintingService.getMintingStatus(999)).rejects.toThrow(
        'NFT 컬렉션을 찾을 수 없습니다.'
      );
    });
  });

  describe('getMintableNfts', () => {
    it('should fetch mintable NFT list', async () => {
      const mockResponse = {
        content: [
          {
            collectionId: 1,
            locationId: 1,
            locationName: '장소1',
            locationDescription: '설명1',
            nftImageUrl: 'https://example.com/nft1.png',
            rarity: 'COMMON',
            mintStatus: 'PENDING' as const,
            collectedAt: '2024-01-01T00:00:00Z',
            earnedPoints: 100,
          },
          {
            collectionId: 2,
            locationId: 2,
            locationName: '장소2',
            locationDescription: '설명2',
            nftImageUrl: 'https://example.com/nft2.png',
            rarity: 'RARE',
            mintStatus: 'FAILED' as const,
            collectedAt: '2024-01-02T00:00:00Z',
            earnedPoints: 200,
          },
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await mintingService.getMintableNfts(0, 20);

      expect(result.content).toHaveLength(2);
      expect(result.content[0].mintStatus).toBe('PENDING');
      expect(result.content[1].mintStatus).toBe('FAILED');
    });

    it('should return empty list', async () => {
      const mockResponse = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await mintingService.getMintableNfts(0, 20);

      expect(result.content).toHaveLength(0);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(mintingService.getMintableNfts()).rejects.toThrow(
        '민팅 가능한 NFT 목록을 불러오는데 실패했습니다.'
      );
    });
  });

  describe('retryMinting', () => {
    it('should retry minting successfully', async () => {
      const mockResponse = {
        collectionId: 1,
        locationId: 1,
        locationName: '테스트 장소',
        mintStatus: 'MINTING' as const,
        walletAddress: '0xwallet',
        message: '민팅이 재시도됩니다.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await mintingService.retryMinting(1);

      expect(result.mintStatus).toBe('MINTING');
      expect(result.message).toBe('민팅이 재시도됩니다.');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/nft/mint/1/retry'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw error when not failed status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '실패한 NFT만 재시도할 수 있습니다.' }),
      } as Response);

      await expect(mintingService.retryMinting(1)).rejects.toThrow(
        '실패한 NFT만 재시도할 수 있습니다.'
      );
    });
  });

  describe('getMintingStats', () => {
    it('should fetch minting stats', async () => {
      const mockResponse = {
        totalCollected: 10,
        mintedCount: 5,
        pendingCount: 3,
        mintingCount: 1,
        failedCount: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await mintingService.getMintingStats();

      expect(result.totalCollected).toBe(10);
      expect(result.mintedCount).toBe(5);
      expect(result.pendingCount).toBe(3);
      expect(result.mintingCount).toBe(1);
      expect(result.failedCount).toBe(1);
    });

    it('should return zero stats when no NFTs', async () => {
      const mockResponse = {
        totalCollected: 0,
        mintedCount: 0,
        pendingCount: 0,
        mintingCount: 0,
        failedCount: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await mintingService.getMintingStats();

      expect(result.totalCollected).toBe(0);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(mintingService.getMintingStats()).rejects.toThrow(
        '민팅 통계를 불러오는데 실패했습니다.'
      );
    });
  });

  describe('getPolygonscanTxUrl', () => {
    it('should generate correct Polygonscan URL', () => {
      const txHash = '0xabc123def456';
      const url = getPolygonscanTxUrl(txHash);

      expect(url).toBe('https://amoy.polygonscan.com/tx/0xabc123def456');
    });
  });

  describe('getOpenseaUrl', () => {
    it('should generate correct OpenSea URL', () => {
      const contractAddress = '0xcontract123';
      const tokenId = '12345';
      const url = getOpenseaUrl(contractAddress, tokenId);

      expect(url).toBe('https://testnets.opensea.io/assets/amoy/0xcontract123/12345');
    });
  });

  describe('getMintStatusLabel', () => {
    it('should return 대기중 for PENDING', () => {
      expect(getMintStatusLabel('PENDING')).toBe('대기중');
    });

    it('should return 민팅중 for MINTING', () => {
      expect(getMintStatusLabel('MINTING')).toBe('민팅중');
    });

    it('should return 확인중 for CONFIRMING', () => {
      expect(getMintStatusLabel('CONFIRMING')).toBe('확인중');
    });

    it('should return 완료 for MINTED', () => {
      expect(getMintStatusLabel('MINTED')).toBe('완료');
    });

    it('should return 실패 for FAILED', () => {
      expect(getMintStatusLabel('FAILED')).toBe('실패');
    });
  });

  describe('getMintStatusColor', () => {
    it('should return yellow for PENDING', () => {
      expect(getMintStatusColor('PENDING')).toBe('#fbbf24');
    });

    it('should return blue for MINTING', () => {
      expect(getMintStatusColor('MINTING')).toBe('#3b82f6');
    });

    it('should return blue for CONFIRMING', () => {
      expect(getMintStatusColor('CONFIRMING')).toBe('#3b82f6');
    });

    it('should return green for MINTED', () => {
      expect(getMintStatusColor('MINTED')).toBe('#10b981');
    });

    it('should return red for FAILED', () => {
      expect(getMintStatusColor('FAILED')).toBe('#ef4444');
    });
  });
});
