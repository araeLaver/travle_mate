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

interface BackendCollectibleLocation {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  collectRadius: number;
  category: string;
  rarity: string;
  country: string;
  city?: string;
  region: string;
  imageUrl?: string;
  nftImageUrl?: string;
  pointReward: number;
  isCollected?: boolean;
  isActive?: boolean;
  distance?: number;
}

interface BackendCollectionSummary {
  id: number;
  name: string;
  imageUrl?: string;
  nftImageUrl?: string;
  rarity: string;
  category: string;
  city?: string;
  country?: string;
}

interface BackendNftCollection {
  id: number;
  location: BackendCollectionSummary;
  tokenId?: string;
  mintStatus: string;
  collectedAt: string;
  earnedPoints: number;
  isVerified: boolean;
}

interface BackendCollectNftResponse {
  success: boolean;
  message: string;
  nftCollection?: BackendNftCollection;
  earnedPoints?: number;
}

class NftService {
  async getNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<NearbyLocation[]> {
    const locations = await apiClient.get<BackendCollectibleLocation[]>(
      `/nft/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
    );
    return locations.map(location => this.toNearbyLocation(location));
  }

  async collectNft(request: CollectNftRequest): Promise<CollectNftResponse> {
    const response = await apiClient.post<BackendCollectNftResponse>('/nft/collect', request);
    return {
      success: response.success,
      message: response.message,
      nft: response.nftCollection ? this.toNftCollection(response.nftCollection) : undefined,
      pointsEarned: response.earnedPoints,
    };
  }

  async getMyCollection(page: number = 0, size: number = 20): Promise<{
    content: NftCollection[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<{
      content: BackendNftCollection[];
      totalElements: number;
      totalPages: number;
    }>(`/nft/my-collection?page=${page}&size=${size}`);

    return {
      ...response,
      content: response.content.map(collection => this.toNftCollection(collection)),
    };
  }

  async getLocationDetails(locationId: number): Promise<CollectibleLocation> {
    const location = await apiClient.get<BackendCollectibleLocation>(
      `/nft/collectible-locations/${locationId}`
    );
    return this.toCollectibleLocation(location);
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

  private toNearbyLocation(location: BackendCollectibleLocation): NearbyLocation {
    return {
      location: this.toCollectibleLocation(location),
      distance: (location.distance || 0) / 1000,
      isCollected: Boolean(location.isCollected),
    };
  }

  private toCollectibleLocation(location: BackendCollectibleLocation): CollectibleLocation {
    return {
      id: location.id,
      name: location.name,
      description: location.description,
      region: location.region || location.city || '',
      country: location.country,
      category: location.category,
      rarity: location.rarity,
      latitude: location.latitude,
      longitude: location.longitude,
      collectRadius: location.collectRadius,
      imageUrl: location.imageUrl || location.nftImageUrl,
      pointReward: location.pointReward,
      isActive: location.isActive ?? true,
    };
  }

  private toNftCollection(collection: BackendNftCollection): NftCollection {
    return {
      id: collection.id,
      locationId: collection.location.id,
      locationName: collection.location.name,
      locationDescription: '',
      rarity: collection.location.rarity,
      imageUrl: collection.location.imageUrl || collection.location.nftImageUrl,
      collectedAt: collection.collectedAt,
      mintStatus: collection.mintStatus,
      tokenId: collection.tokenId,
    };
  }
}

export const nftService = new NftService();
export default nftService;
