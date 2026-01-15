/**
 * NFT Service for TravelMate Mobile
 */

import { apiClient } from './apiClient';

export interface CollectibleLocation {
  id: number;
  name: string;
  description: string;
  region: string;
  country: string;
  category: string;
  rarity: string;
  latitude: number;
  longitude: number;
  collectRadius: number;
  imageUrl?: string;
  pointReward: number;
  isActive: boolean;
}

export interface NftCollection {
  id: number;
  locationId: number;
  locationName: string;
  locationDescription: string;
  rarity: string;
  imageUrl?: string;
  collectedAt: string;
  mintStatus: string;
  tokenId?: string;
  transactionHash?: string;
}

export interface CollectNftRequest {
  locationId: number;
  latitude: number;
  longitude: number;
}

export interface CollectNftResponse {
  success: boolean;
  message: string;
  nft?: NftCollection;
  pointsEarned?: number;
}

export interface NearbyLocation {
  location: CollectibleLocation;
  distance: number;
  isCollected: boolean;
}

class NftService {
  async getNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<NearbyLocation[]> {
    return apiClient.get<NearbyLocation[]>(
      `/nft/locations/nearby?lat=${latitude}&lng=${longitude}&radiusKm=${radiusKm}`
    );
  }

  async collectNft(request: CollectNftRequest): Promise<CollectNftResponse> {
    return apiClient.post<CollectNftResponse>('/nft/collect', request);
  }

  async getMyCollection(page: number = 0, size: number = 20): Promise<{
    content: NftCollection[];
    totalElements: number;
    totalPages: number;
  }> {
    return apiClient.get(`/nft/collection?page=${page}&size=${size}`);
  }

  async getLocationDetails(locationId: number): Promise<CollectibleLocation> {
    return apiClient.get<CollectibleLocation>(`/nft/locations/${locationId}`);
  }

  async requestMinting(collectionId: number, walletAddress: string): Promise<{
    success: boolean;
    message: string;
    transactionHash?: string;
  }> {
    return apiClient.post(`/nft/mint/${collectionId}`, { walletAddress });
  }

  async getMintingStatus(collectionId: number): Promise<{
    status: string;
    tokenId?: string;
    transactionHash?: string;
  }> {
    return apiClient.get(`/nft/mint/status/${collectionId}`);
  }

  // Helper methods
  getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      COMMON: '#9CA3AF',
      UNCOMMON: '#10B981',
      RARE: '#3B82F6',
      EPIC: '#8B5CF6',
      LEGENDARY: '#F59E0B',
    };
    return colors[rarity] || '#9CA3AF';
  }

  getRarityLabel(rarity: string): string {
    const labels: Record<string, string> = {
      COMMON: '일반',
      UNCOMMON: '고급',
      RARE: '희귀',
      EPIC: '영웅',
      LEGENDARY: '전설',
    };
    return labels[rarity] || rarity;
  }

  getMintStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      NOT_MINTED: '미민팅',
      MINTING: '민팅 중',
      MINTED: '민팅 완료',
      FAILED: '민팅 실패',
    };
    return labels[status] || status;
  }
}

export const nftService = new NftService();
export default nftService;
