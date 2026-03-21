import { apiClient } from './apiClient';
import {
  PaginatedResponse,
  CollectibleLocationResponse,
  CollectNftRequest,
  CollectNftResponse,
  UserNftCollectionResponse,
  CollectionBookResponse,
  UserNftStatsResponse,
  Rarity,
} from '../types';

/**
 * NFT 수집 관련 API 서비스
 */
class NftService {
  // ===== 수집 가능 장소 =====

  /**
   * 수집 가능 장소 목록 조회
   */
  async getCollectibleLocations(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<CollectibleLocationResponse>> {
    return apiClient.get(`/nft/collectible-locations?page=${page}&size=${size}`);
  }

  /**
   * 주변 수집 가능 장소 조회
   */
  async getNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<CollectibleLocationResponse[]> {
    return apiClient.get(
      `/nft/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
    );
  }

  /**
   * 카테고리별 장소 조회
   */
  async getLocationsByCategory(
    category: string,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<CollectibleLocationResponse>> {
    return apiClient.get(`/nft/locations/category/${category}?page=${page}&size=${size}`);
  }

  // ===== NFT 수집 =====

  /**
   * NFT 수집
   */
  async collectNft(request: CollectNftRequest): Promise<CollectNftResponse> {
    return apiClient.post('/nft/collect', request);
  }

  // ===== 내 컬렉션 =====

  /**
   * 내 NFT 컬렉션 조회
   */
  async getMyCollection(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<UserNftCollectionResponse>> {
    return apiClient.get(`/nft/my-collection?page=${page}&size=${size}`);
  }

  /**
   * 희귀도별 컬렉션 조회
   */
  async getMyCollectionByRarity(
    rarity: Rarity,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<UserNftCollectionResponse>> {
    return apiClient.get(`/nft/my-collection/rarity/${rarity}?page=${page}&size=${size}`);
  }

  /**
   * NFT 상세 조회
   */
  async getNftDetail(collectionId: number): Promise<UserNftCollectionResponse> {
    return apiClient.get(`/nft/collection/${collectionId}`);
  }

  // ===== 도감 =====

  /**
   * 도감 조회
   */
  async getCollectionBook(): Promise<CollectionBookResponse> {
    return apiClient.get('/nft/collection-book');
  }

  // ===== 통계 =====

  /**
   * 사용자 NFT 통계 조회
   */
  async getUserNftStats(): Promise<UserNftStatsResponse> {
    return apiClient.get('/nft/stats');
  }
}

export const nftService = new NftService();
