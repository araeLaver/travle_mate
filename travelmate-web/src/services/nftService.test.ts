import { nftService } from './nftService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('NftService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses backend endpoint for category-filtered collectible locations', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });

    await nftService.getLocationsByCategory('LANDMARK', 1, 12);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/nft/collectible-locations/category/LANDMARK?page=1&size=12'
    );
  });
});
