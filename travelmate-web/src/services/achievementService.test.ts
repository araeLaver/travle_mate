import { achievementService } from './achievementService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AchievementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses backend endpoint for completed current-user achievements', async () => {
    mockApiClient.get.mockResolvedValueOnce([]);

    const achievements = await achievementService.getCompletedAchievements();

    expect(mockApiClient.get).toHaveBeenCalledWith('/achievements/my/completed');
    expect(achievements).toEqual([]);
  });
});
