import { apiClient } from './apiClient';
import {
  PaginatedResponse,
  MarketplaceListingResponse,
  CreateListingRequest,
  BuyNftResponse,
  Rarity,
} from '../types';

/**
 * NFT 마켓플레이스 관련 API 서비스
 */
class MarketplaceService {
  /**
   * 활성 리스팅 목록 조회
   */
  async getActiveListings(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<MarketplaceListingResponse>> {
    return apiClient.get(`/marketplace/listings?page=${page}&size=${size}`);
  }

  /**
   * 가격 범위로 리스팅 조회
   */
  async getListingsByPriceRange(
    minPrice: number,
    maxPrice: number,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<MarketplaceListingResponse>> {
    return apiClient.get(
      `/marketplace/listings/price?minPrice=${minPrice}&maxPrice=${maxPrice}&page=${page}&size=${size}`
    );
  }

  /**
   * 희귀도별 리스팅 조회
   */
  async getListingsByRarity(
    rarity: Rarity,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<MarketplaceListingResponse>> {
    return apiClient.get(`/marketplace/listings/rarity/${rarity}?page=${page}&size=${size}`);
  }

  /**
   * NFT 판매 등록
   */
  async createListing(request: CreateListingRequest): Promise<MarketplaceListingResponse> {
    return apiClient.post('/marketplace/list', request);
  }

  /**
   * NFT 구매
   */
  async buyNft(listingId: number): Promise<BuyNftResponse> {
    return apiClient.post(`/marketplace/buy/${listingId}`);
  }

  /**
   * 판매 취소
   */
  async cancelListing(listingId: number): Promise<void> {
    return apiClient.delete(`/marketplace/listing/${listingId}`);
  }

  /**
   * 내 판매 리스팅 조회
   */
  async getMyListings(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<MarketplaceListingResponse>> {
    return apiClient.get(`/marketplace/my-listings?page=${page}&size=${size}`);
  }

  /**
   * 내 구매 내역 조회
   */
  async getMyPurchases(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<MarketplaceListingResponse>> {
    return apiClient.get(`/marketplace/my-purchases?page=${page}&size=${size}`);
  }
}

export const marketplaceService = new MarketplaceService();
