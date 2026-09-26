import { locationReviewService, getSeasonLabel } from './locationReviewService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

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
      mockApiClient.post.mockResolvedValueOnce(mockReview);

      const request = {
        rating: 5,
        comment: '좋은 장소입니다',
        visitedSeason: 'SPRING' as const,
      };
      const result = await locationReviewService.createReview(1, request);

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('좋은 장소입니다');
      expect(mockApiClient.post).toHaveBeenCalledWith('/locations/1/reviews', request);
    });

    it('should throw error when not collected', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        message: '수집한 후에 리뷰를 작성할 수 있습니다.',
        status: 400,
      });

      await expect(locationReviewService.createReview(1, { rating: 5 })).rejects.toThrow(
        '수집한 후에 리뷰를 작성할 수 있습니다.'
      );
    });

    it('should throw error on duplicate review', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        message: '이미 리뷰를 작성한 장소입니다.',
        status: 409,
      });

      await expect(locationReviewService.createReview(1, { rating: 5 })).rejects.toThrow(
        '이미 리뷰를 작성한 장소입니다.'
      );
    });
  });

  describe('updateReview', () => {
    it('should update review successfully', async () => {
      const updatedReview = { ...mockReview, rating: 4, comment: '수정된 리뷰' };
      const request = {
        rating: 4,
        comment: '수정된 리뷰',
      };
      mockApiClient.put.mockResolvedValueOnce(updatedReview);

      const result = await locationReviewService.updateReview(1, request);

      expect(result.rating).toBe(4);
      expect(result.comment).toBe('수정된 리뷰');
      expect(mockApiClient.put).toHaveBeenCalledWith('/reviews/1', request);
    });

    it('should throw error when not owner', async () => {
      mockApiClient.put.mockRejectedValueOnce({
        message: '본인이 작성한 리뷰만 수정할 수 있습니다.',
        status: 403,
      });

      await expect(locationReviewService.updateReview(1, { rating: 4 })).rejects.toThrow(
        '본인이 작성한 리뷰만 수정할 수 있습니다.'
      );
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      mockApiClient.delete.mockResolvedValueOnce(undefined);

      await expect(locationReviewService.deleteReview(1)).resolves.toBeUndefined();
      expect(mockApiClient.delete).toHaveBeenCalledWith('/reviews/1');
    });

    it('should throw error when not owner', async () => {
      mockApiClient.delete.mockRejectedValueOnce({
        message: '본인이 작성한 리뷰만 삭제할 수 있습니다.',
        status: 403,
      });

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

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await locationReviewService.getLocationReviews(1, 'recent', 0, 10);

      expect(result.content).toHaveLength(1);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/locations/1/reviews?sort=recent&page=0&size=10'
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

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await locationReviewService.getLocationReviews(1, 'helpful', 0, 10);

      expect(result.content).toHaveLength(1);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/locations/1/reviews?sort=helpful&page=0&size=10'
      );
    });

    it('should throw fallback error on failure without server message', async () => {
      mockApiClient.get.mockRejectedValueOnce({ status: 500 });

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

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await locationReviewService.getUserReviews(1, 0, 10);

      expect(result.content).toHaveLength(1);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/1/reviews?page=0&size=10');
    });
  });

  describe('getReview', () => {
    it('should fetch review detail', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockReview);

      const result = await locationReviewService.getReview(1);

      expect(result.id).toBe(1);
      expect(result.rating).toBe(5);
      expect(mockApiClient.get).toHaveBeenCalledWith('/reviews/1');
    });

    it('should throw error when review not found', async () => {
      mockApiClient.get.mockRejectedValueOnce({ status: 404 });

      await expect(locationReviewService.getReview(999)).rejects.toThrow(
        '리뷰를 불러오는데 실패했습니다.'
      );
    });
  });

  describe('toggleHelpful', () => {
    it('should add helpful', async () => {
      mockApiClient.post.mockResolvedValueOnce({ isHelpful: true });

      const result = await locationReviewService.toggleHelpful(1);

      expect(result.isHelpful).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith('/reviews/1/helpful');
    });

    it('should remove helpful', async () => {
      mockApiClient.post.mockResolvedValueOnce({ isHelpful: false });

      const result = await locationReviewService.toggleHelpful(1);

      expect(result.isHelpful).toBe(false);
    });

    it('should throw error on own review', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        message: '본인의 리뷰에는 도움됨을 표시할 수 없습니다.',
        status: 400,
      });

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

      mockApiClient.get.mockResolvedValueOnce(mockStats);

      const result = await locationReviewService.getLocationReviewStats(1);

      expect(result.averageRating).toBe(4.5);
      expect(result.reviewCount).toBe(100);
      expect(mockApiClient.get).toHaveBeenCalledWith('/locations/1/reviews/stats');
    });

    it('should return zero stats for no reviews', async () => {
      const mockStats = {
        locationId: 1,
        averageRating: 0,
        reviewCount: 0,
      };

      mockApiClient.get.mockResolvedValueOnce(mockStats);

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
