import { apiClient } from './apiClient';
import { appendQuery, withServiceError } from './apiRequestUtils';

// ===== Types =====

export type MintStatus = 'PENDING' | 'MINTING' | 'CONFIRMING' | 'MINTED' | 'FAILED';

export interface MintingRequest {
  walletAddress: string;
}

export interface MintingResponse {
  collectionId: number;
  locationId: number;
  locationName: string;
  mintStatus: MintStatus;
  walletAddress: string;
  message: string;
}

export interface MintingStatusResponse {
  collectionId: number;
  locationId: number;
  locationName: string;
  nftImageUrl: string | null;
  rarity: string;
  mintStatus: MintStatus;
  tokenId: string | null;
  transactionHash: string | null;
  contractAddress: string | null;
  walletAddress: string | null;
  polygonscanUrl: string | null;
  openseaUrl: string | null;
}

export interface MintableNftResponse {
  collectionId: number;
  locationId: number;
  locationName: string;
  locationDescription: string;
  nftImageUrl: string | null;
  rarity: string;
  mintStatus: MintStatus;
  collectedAt: string;
  earnedPoints: number;
}

export interface MintingStatsResponse {
  totalCollected: number;
  mintedCount: number;
  pendingCount: number;
  mintingCount: number;
  failedCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ===== API Methods =====

/**
 * NFT 민팅 요청
 */
export const requestMinting = async (
  collectionId: number,
  walletAddress: string
): Promise<MintingResponse> => {
  return withServiceError(
    apiClient.post<MintingResponse, MintingRequest>(`/nft/mint/${collectionId}`, {
      walletAddress,
    }),
    '민팅 요청에 실패했습니다.'
  );
};

/**
 * 민팅 상태 조회
 */
export const getMintingStatus = async (collectionId: number): Promise<MintingStatusResponse> => {
  return withServiceError(
    apiClient.get<MintingStatusResponse>(`/nft/mint/status/${collectionId}`),
    '민팅 상태 조회에 실패했습니다.'
  );
};

/**
 * 민팅 가능한 NFT 목록 조회
 */
export const getMintableNfts = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<MintableNftResponse>> => {
  return withServiceError(
    apiClient.get<PageResponse<MintableNftResponse>>(
      appendQuery('/nft/mint/mintable', { page, size })
    ),
    '민팅 가능한 NFT 목록을 불러오는데 실패했습니다.'
  );
};

/**
 * 민팅 재시도
 */
export const retryMinting = async (collectionId: number): Promise<MintingResponse> => {
  return withServiceError(
    apiClient.post<MintingResponse>(`/nft/mint/${collectionId}/retry`),
    '민팅 재시도에 실패했습니다.'
  );
};

/**
 * 민팅 통계 조회
 */
export const getMintingStats = async (): Promise<MintingStatsResponse> => {
  return withServiceError(
    apiClient.get<MintingStatsResponse>('/nft/mint/stats'),
    '민팅 통계를 불러오는데 실패했습니다.'
  );
};

/**
 * Polygonscan에서 트랜잭션 보기 URL 생성
 */
export const getPolygonscanTxUrl = (transactionHash: string): string => {
  return `https://amoy.polygonscan.com/tx/${transactionHash}`;
};

/**
 * OpenSea에서 NFT 보기 URL 생성
 */
export const getOpenseaUrl = (contractAddress: string, tokenId: string): string => {
  return `https://testnets.opensea.io/assets/amoy/${contractAddress}/${tokenId}`;
};

/**
 * 민팅 상태 한글 변환
 */
export const getMintStatusLabel = (status: MintStatus): string => {
  switch (status) {
    case 'PENDING':
      return '대기중';
    case 'MINTING':
      return '민팅중';
    case 'CONFIRMING':
      return '확인중';
    case 'MINTED':
      return '완료';
    case 'FAILED':
      return '실패';
    default:
      return status;
  }
};

/**
 * 민팅 상태 색상
 */
export const getMintStatusColor = (status: MintStatus): string => {
  switch (status) {
    case 'PENDING':
      return '#fbbf24'; // yellow
    case 'MINTING':
    case 'CONFIRMING':
      return '#3b82f6'; // blue
    case 'MINTED':
      return '#10b981'; // green
    case 'FAILED':
      return '#ef4444'; // red
    default:
      return '#9ca3af'; // gray
  }
};

export const mintingService = {
  requestMinting,
  getMintingStatus,
  getMintableNfts,
  retryMinting,
  getMintingStats,
  getPolygonscanTxUrl,
  getOpenseaUrl,
  getMintStatusLabel,
  getMintStatusColor,
};
