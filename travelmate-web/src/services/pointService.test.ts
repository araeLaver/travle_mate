import { pointService } from './pointService';
import { apiClient } from './apiClient';
import { PointTransactionType } from '../types';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('PointService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses backend query parameter contract for transaction type filtering', async () => {
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

    const earnType: PointTransactionType = 'EARN';

    await pointService.getTransactionsByType(earnType, 2, 30);

    expect(mockApiClient.get).toHaveBeenCalledWith('/points/transactions?type=EARN&page=2&size=30');
  });

  it('uses backend rank endpoint for current user rank', async () => {
    mockApiClient.get.mockResolvedValueOnce(7);

    const rank = await pointService.getMyRank();

    expect(mockApiClient.get).toHaveBeenCalledWith('/points/rank');
    expect(rank).toBe(7);
  });
});
