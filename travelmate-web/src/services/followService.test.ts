import { followService } from './followService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('FollowService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('should follow successfully', async () => {
      const mockResponse = {
        success: true,
        message: '팔로잉님을 팔로우합니다.',
        isFollowing: true,
        isMutual: false,
        stats: {
          userId: 2,
          followerCount: 10,
          followingCount: 5,
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await followService.follow(2);

      expect(result.success).toBe(true);
      expect(result.isFollowing).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/users/2/follow');
    });

    it('should throw error on follow failure', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        message: '이미 팔로우 중입니다.',
        status: 409,
      });

      await expect(followService.follow(2)).rejects.toThrow('이미 팔로우 중입니다.');
    });
  });

  describe('unfollow', () => {
    it('should unfollow successfully', async () => {
      const mockResponse = {
        success: true,
        message: '언팔로우했습니다.',
        isFollowing: false,
        isMutual: false,
        stats: {
          userId: 2,
          followerCount: 9,
          followingCount: 5,
        },
      };

      mockApiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await followService.unfollow(2);

      expect(result.success).toBe(true);
      expect(result.isFollowing).toBe(false);
      expect(mockApiClient.delete).toHaveBeenCalledWith('/users/2/follow');
    });

    it('should throw error on unfollow failure', async () => {
      mockApiClient.delete.mockRejectedValueOnce({
        message: '팔로우 관계가 존재하지 않습니다.',
        status: 404,
      });

      await expect(followService.unfollow(2)).rejects.toThrow('팔로우 관계가 존재하지 않습니다.');
    });
  });

  describe('getFollowers', () => {
    it('should fetch followers with pagination', async () => {
      const mockResponse = {
        content: [
          {
            id: 1,
            nickname: '팔로워1',
            profileImageUrl: 'https://example.com/profile.jpg',
            bio: '안녕하세요',
            followedAt: '2024-01-01T00:00:00Z',
            isMutual: true,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getFollowers(2, 0, 20);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].nickname).toBe('팔로워1');
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/2/followers?page=0&size=20');
    });

    it('should throw fallback error on failure without server message', async () => {
      mockApiClient.get.mockRejectedValueOnce({ status: 500 });

      await expect(followService.getFollowers(2)).rejects.toThrow(
        '팔로워 목록을 불러오는데 실패했습니다.'
      );
    });
  });

  describe('getFollowing', () => {
    it('should fetch following with pagination', async () => {
      const mockResponse = {
        content: [
          {
            id: 3,
            nickname: '팔로잉1',
            profileImageUrl: null,
            bio: null,
            followedAt: '2024-01-01T00:00:00Z',
            isMutual: false,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getFollowing(1, 0, 20);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].nickname).toBe('팔로잉1');
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/1/following?page=0&size=20');
    });
  });

  describe('getFollowStats', () => {
    it('should fetch follow stats', async () => {
      const mockResponse = {
        userId: 1,
        followerCount: 100,
        followingCount: 50,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getFollowStats(1);

      expect(result.followerCount).toBe(100);
      expect(result.followingCount).toBe(50);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/1/follow-stats');
    });

    it('should throw fallback error on failure without server message', async () => {
      mockApiClient.get.mockRejectedValueOnce({ status: 500 });

      await expect(followService.getFollowStats(1)).rejects.toThrow(
        '팔로우 통계를 불러오는데 실패했습니다.'
      );
    });
  });

  describe('getFollowStatus', () => {
    it('should fetch follow status for mutual follow', async () => {
      const mockResponse = {
        userId: 2,
        isFollowing: true,
        isFollowedBy: true,
        isMutual: true,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getFollowStatus(2);

      expect(result.isFollowing).toBe(true);
      expect(result.isFollowedBy).toBe(true);
      expect(result.isMutual).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/2/follow-status');
    });

    it('should fetch follow status for one-way follow', async () => {
      const mockResponse = {
        userId: 2,
        isFollowing: true,
        isFollowedBy: false,
        isMutual: false,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getFollowStatus(2);

      expect(result.isFollowing).toBe(true);
      expect(result.isMutual).toBe(false);
    });
  });

  describe('getMutualFollowers', () => {
    it('should fetch mutual followers', async () => {
      const mockResponse = {
        content: [
          {
            id: 3,
            nickname: '맞팔유저',
            profileImageUrl: null,
            bio: null,
            followedAt: '2024-01-01T00:00:00Z',
            isMutual: true,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getMutualFollowers(1, 0, 20);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].isMutual).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/1/mutual-followers?page=0&size=20');
    });
  });

  describe('getMyFollowers', () => {
    it('should fetch my followers', async () => {
      const mockResponse = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getMyFollowers(0, 20);

      expect(result.content).toHaveLength(0);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/me/followers?page=0&size=20');
    });
  });

  describe('getMyFollowing', () => {
    it('should fetch my following', async () => {
      const mockResponse = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
        first: true,
        last: true,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getMyFollowing(0, 20);

      expect(result.content).toHaveLength(0);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/me/following?page=0&size=20');
    });
  });

  describe('getMyFollowStats', () => {
    it('should fetch my follow stats', async () => {
      const mockResponse = {
        userId: 1,
        followerCount: 10,
        followingCount: 5,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await followService.getMyFollowStats();

      expect(result.followerCount).toBe(10);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/me/follow-stats');
    });
  });

  describe('getFollowStatusBatch', () => {
    it('should fetch batch follow status', async () => {
      const mockResponse = [
        {
          id: 2,
          nickname: '유저2',
          profileImageUrl: null,
          bio: null,
          rating: 4.5,
          totalNftsCollected: 10,
          isFollowing: true,
          isFollowedBy: false,
          isMutual: false,
        },
        {
          id: 3,
          nickname: '유저3',
          profileImageUrl: null,
          bio: null,
          rating: 3.5,
          totalNftsCollected: 5,
          isFollowing: false,
          isFollowedBy: true,
          isMutual: false,
        },
      ];

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await followService.getFollowStatusBatch([2, 3]);

      expect(result).toHaveLength(2);
      expect(result[0].isFollowing).toBe(true);
      expect(result[1].isFollowedBy).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/users/follow-status/batch', {
        userIds: [2, 3],
      });
    });

    it('should throw fallback error on failure without server message', async () => {
      mockApiClient.post.mockRejectedValueOnce({ status: 500 });

      await expect(followService.getFollowStatusBatch([2, 3])).rejects.toThrow(
        '팔로우 상태를 확인하는데 실패했습니다.'
      );
    });
  });
});
