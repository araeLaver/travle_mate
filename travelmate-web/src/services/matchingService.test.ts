import { completeMatchRequest } from './matchingService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    put: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('matchingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the backend completion endpoint for accepted matches', async () => {
    mockApiClient.put.mockResolvedValueOnce({ id: 42, status: 'COMPLETED' });

    await completeMatchRequest(42);

    expect(mockApiClient.put).toHaveBeenCalledWith('/matching/requests/42/complete');
  });
});
