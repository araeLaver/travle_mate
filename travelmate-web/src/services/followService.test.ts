import { followService } from './followService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { authService } from './authService';

// Mock fetch
global.fetch = jest.fn();

// Mock authService
jest.mock('./authService', () => ({
  authService: {
    getToken: jest.fn(() => 'mock-token'),
  },
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.follow(2);

      expect(result.success).toBe(true);
      expect(result.isFollowing).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/2/follow'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw error on follow failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '이미 팔로우 중입니다.' }),
      } as Response);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.unfollow(2);

      expect(result.success).toBe(true);
      expect(result.isFollowing).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/2/follow'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should throw error on unfollow failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '팔로우 관계가 존재하지 않습니다.' }),
      } as Response);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getFollowers(2, 0, 20);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].nickname).toBe('팔로워1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/2/followers?page=0&size=20'),
        expect.any(Object)
      );
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(followService.getFollowers(2)).rejects.toThrow('팔로워 목록을 불러오는데 실패했습니다.');
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getFollowing(1, 0, 20);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].nickname).toBe('팔로잉1');
    });
  });

  describe('getFollowStats', () => {
    it('should fetch follow stats', async () => {
      const mockResponse = {
        userId: 1,
        followerCount: 100,
        followingCount: 50,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getFollowStats(1);

      expect(result.followerCount).toBe(100);
      expect(result.followingCount).toBe(50);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(followService.getFollowStats(1)).rejects.toThrow('팔로우 통계를 불러오는데 실패했습니다.');
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getFollowStatus(2);

      expect(result.isFollowing).toBe(true);
      expect(result.isFollowedBy).toBe(true);
      expect(result.isMutual).toBe(true);
    });

    it('should fetch follow status for one-way follow', async () => {
      const mockResponse = {
        userId: 2,
        isFollowing: true,
        isFollowedBy: false,
        isMutual: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getMutualFollowers(1, 0, 20);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].isMutual).toBe(true);
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getMyFollowers(0, 20);

      expect(result.content).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/followers'),
        expect.any(Object)
      );
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getMyFollowing(0, 20);

      expect(result.content).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/following'),
        expect.any(Object)
      );
    });
  });

  describe('getMyFollowStats', () => {
    it('should fetch my follow stats', async () => {
      const mockResponse = {
        userId: 1,
        followerCount: 10,
        followingCount: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getMyFollowStats();

      expect(result.followerCount).toBe(10);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/follow-stats'),
        expect.any(Object)
      );
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await followService.getFollowStatusBatch([2, 3]);

      expect(result).toHaveLength(2);
      expect(result[0].isFollowing).toBe(true);
      expect(result[1].isFollowedBy).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/follow-status/batch'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userIds: [2, 3] }),
        })
      );
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(followService.getFollowStatusBatch([2, 3])).rejects.toThrow(
        '팔로우 상태를 확인하는데 실패했습니다.'
      );
    });
  });
});
