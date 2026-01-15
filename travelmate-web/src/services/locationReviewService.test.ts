import { locationReviewService, getSeasonLabel } from './locationReviewService';

// Mock fetch
global.fetch = jest.fn();

// Mock authService
jest.mock('./authService', () => ({
  authService: {
    getToken: jest.fn(() => 'mock-token'),
  },
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('LocationReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReview = {
    id: 1,
    reviewer: {
      id: 1,
      nickname: '테스트유저',
      profileImageUrl: 'https://example.com/profile.jpg',
    },
    locationId: 1,
    locationName: '테스트 장소',
    rating: 5,
    comment: '좋은 장소입니다',
    visitedSeason: 'SPRING' as const,
    visitedSeasonDisplay: '봄',
    photoUrls: [],
    helpfulCount: 10,
    isHelpful: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('createReview', () => {
    it('should create review successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReview,
      } as Response);

      const result = await locationReviewService.createReview(1, {
        rating: 5,
        comment: '좋은 장소입니다',
        visitedSeason: 'SPRING',
      });

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('좋은 장소입니다');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/locations/1/reviews'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            rating: 5,
            comment: '좋은 장소입니다',
            visitedSeason: 'SPRING',
          }),
        })
      );
    });

    it('should throw error when not collected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '수집한 후에 리뷰를 작성할 수 있습니다.' }),
      } as Response);

      await expect(
        locationReviewService.createReview(1, { rating: 5 })
      ).rejects.toThrow('수집한 후에 리뷰를 작성할 수 있습니다.');
    });

    it('should throw error on duplicate review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '이미 리뷰를 작성한 장소입니다.' }),
      } as Response);

      await expect(
        locationReviewService.createReview(1, { rating: 5 })
      ).rejects.toThrow('이미 리뷰를 작성한 장소입니다.');
    });
  });

  describe('updateReview', () => {
    it('should update review successfully', async () => {
      const updatedReview = { ...mockReview, rating: 4, comment: '수정된 리뷰' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedReview,
      } as Response);

      const result = await locationReviewService.updateReview(1, {
        rating: 4,
        comment: '수정된 리뷰',
      });

      expect(result.rating).toBe(4);
      expect(result.comment).toBe('수정된 리뷰');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reviews/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should throw error when not owner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '본인이 작성한 리뷰만 수정할 수 있습니다.' }),
      } as Response);

      await expect(
        locationReviewService.updateReview(1, { rating: 4 })
      ).rejects.toThrow('본인이 작성한 리뷰만 수정할 수 있습니다.');
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await expect(locationReviewService.deleteReview(1)).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reviews/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should throw error when not owner', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '본인이 작성한 리뷰만 삭제할 수 있습니다.' }),
      } as Response);

      await expect(locationReviewService.deleteReview(1)).rejects.toThrow(
        '본인이 작성한 리뷰만 삭제할 수 있습니다.'
      );
    });
  });

  describe('getLocationReviews', () => {
    it('should fetch reviews sorted by recent', async () => {
      const mockResponse = {
        content: [mockReview],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        first: true,
        last: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await locationReviewService.getLocationReviews(1, 'recent', 0, 10);

      expect(result.content).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/locations/1/reviews?sort=recent&page=0&size=10'),
        expect.any(Object)
      );
    });

    it('should fetch reviews sorted by helpful', async () => {
      const mockResponse = {
        content: [mockReview],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        first: true,
        last: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await locationReviewService.getLocationReviews(1, 'helpful', 0, 10);

      expect(result.content).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=helpful'),
        expect.any(Object)
      );
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(locationReviewService.getLocationReviews(1)).rejects.toThrow(
        '리뷰 목록을 불러오는데 실패했습니다.'
      );
    });
  });

  describe('getUserReviews', () => {
    it('should fetch user reviews', async () => {
      const mockResponse = {
        content: [mockReview],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        first: true,
        last: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await locationReviewService.getUserReviews(1, 0, 10);

      expect(result.content).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1/reviews'),
        expect.any(Object)
      );
    });
  });

  describe('getReview', () => {
    it('should fetch review detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReview,
      } as Response);

      const result = await locationReviewService.getReview(1);

      expect(result.id).toBe(1);
      expect(result.rating).toBe(5);
    });

    it('should throw error when review not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(locationReviewService.getReview(999)).rejects.toThrow(
        '리뷰를 불러오는데 실패했습니다.'
      );
    });
  });

  describe('toggleHelpful', () => {
    it('should add helpful', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isHelpful: true }),
      } as Response);

      const result = await locationReviewService.toggleHelpful(1);

      expect(result.isHelpful).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reviews/1/helpful'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should remove helpful', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isHelpful: false }),
      } as Response);

      const result = await locationReviewService.toggleHelpful(1);

      expect(result.isHelpful).toBe(false);
    });

    it('should throw error on own review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '본인의 리뷰에는 도움됨을 표시할 수 없습니다.' }),
      } as Response);

      await expect(locationReviewService.toggleHelpful(1)).rejects.toThrow(
        '본인의 리뷰에는 도움됨을 표시할 수 없습니다.'
      );
    });
  });

  describe('getLocationReviewStats', () => {
    it('should fetch review stats', async () => {
      const mockStats = {
        locationId: 1,
        averageRating: 4.5,
        reviewCount: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response);

      const result = await locationReviewService.getLocationReviewStats(1);

      expect(result.averageRating).toBe(4.5);
      expect(result.reviewCount).toBe(100);
    });

    it('should return zero stats for no reviews', async () => {
      const mockStats = {
        locationId: 1,
        averageRating: 0,
        reviewCount: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response);

      const result = await locationReviewService.getLocationReviewStats(1);

      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });
  });

  describe('getSeasonLabel', () => {
    it('should return 봄 for SPRING', () => {
      expect(getSeasonLabel('SPRING')).toBe('봄');
    });

    it('should return 여름 for SUMMER', () => {
      expect(getSeasonLabel('SUMMER')).toBe('여름');
    });

    it('should return 가을 for FALL', () => {
      expect(getSeasonLabel('FALL')).toBe('가을');
    });

    it('should return 겨울 for WINTER', () => {
      expect(getSeasonLabel('WINTER')).toBe('겨울');
    });
  });
});
