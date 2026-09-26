import { marketplaceService } from './marketplaceService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('MarketplaceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads active listings with pagination params', async () => {
    const response = { content: [], totalElements: 0, totalPages: 0, number: 2, size: 10 };
    mockApiClient.get.mockResolvedValueOnce(response);

    const result = await marketplaceService.getActiveListings(2, 10);

    expect(mockApiClient.get).toHaveBeenCalledWith('/marketplace/listings?page=2&size=10');
    expect(result).toBe(response);
  });

  it('loads listings by price range with backend query params', async () => {
    const response = { content: [], totalElements: 0, totalPages: 0, number: 1, size: 12 };
    mockApiClient.get.mockResolvedValueOnce(response);

    const result = await marketplaceService.getListingsByPriceRange(1000, 5000, 1, 12);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/marketplace/listings/price?minPrice=1000&maxPrice=5000&page=1&size=12'
    );
    expect(result).toBe(response);
  });

  it('loads listings by rarity through the rarity path segment', async () => {
    const response = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
    mockApiClient.get.mockResolvedValueOnce(response);

    const result = await marketplaceService.getListingsByRarity('EPIC');

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/marketplace/listings/rarity/EPIC?page=0&size=20'
    );
    expect(result).toBe(response);
  });

  it('creates listings and buys NFTs through transaction endpoints', async () => {
    const createRequest = {
      nftCollectionId: 9,
      priceInPoints: 3000,
      durationDays: 7,
    };
    mockApiClient.post.mockResolvedValueOnce({ id: 4 }).mockResolvedValueOnce({
      success: true,
      message: 'ok',
      pointsSpent: 3000,
    });

    await marketplaceService.createListing(createRequest);
    await marketplaceService.buyNft(4);

    expect(mockApiClient.post).toHaveBeenNthCalledWith(1, '/marketplace/list', createRequest);
    expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/marketplace/buy/4');
  });

  it('loads current user listings and purchases, and cancels listings', async () => {
    const response = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 };
    mockApiClient.get.mockResolvedValue(response);
    mockApiClient.delete.mockResolvedValueOnce({});

    await marketplaceService.getMyListings(0, 5);
    await marketplaceService.getMyPurchases(1, 6);
    await marketplaceService.cancelListing(4);

    expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/marketplace/my-listings?page=0&size=5');
    expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/marketplace/my-purchases?page=1&size=6');
    expect(mockApiClient.delete).toHaveBeenCalledWith('/marketplace/listings/4');
  });
});
