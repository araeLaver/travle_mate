import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * NFT 민팅 요청
 */
export const requestMinting = async (
  collectionId: number,
  walletAddress: string
): Promise<MintingResponse> => {
  const response = await fetch(`${API_BASE_URL}/nft/mint/${collectionId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ walletAddress } as MintingRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '민팅 요청에 실패했습니다.');
  }

  return response.json();
};

/**
 * 민팅 상태 조회
 */
export const getMintingStatus = async (collectionId: number): Promise<MintingStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/nft/mint/status/${collectionId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '민팅 상태 조회에 실패했습니다.');
  }

  return response.json();
};

/**
 * 민팅 가능한 NFT 목록 조회
 */
export const getMintableNfts = async (
  page: number = 0,
  size: number = 20
): Promise<PageResponse<MintableNftResponse>> => {
  const response = await fetch(`${API_BASE_URL}/nft/mint/mintable?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('민팅 가능한 NFT 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

/**
 * 민팅 재시도
 */
export const retryMinting = async (collectionId: number): Promise<MintingResponse> => {
  const response = await fetch(`${API_BASE_URL}/nft/mint/${collectionId}/retry`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '민팅 재시도에 실패했습니다.');
  }

  return response.json();
};

/**
 * 민팅 통계 조회
 */
export const getMintingStats = async (): Promise<MintingStatsResponse> => {
  const response = await fetch(`${API_BASE_URL}/nft/mint/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('민팅 통계를 불러오는데 실패했습니다.');
  }

  return response.json();
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
