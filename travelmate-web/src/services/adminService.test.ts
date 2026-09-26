import { adminService } from './adminService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses collectible-location admin endpoint for NFT location CRUD', async () => {
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

    await adminService.getAllLocations(2, 30);

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/collectible-locations?page=2&size=30');
  });

  it('uses relative admin endpoint for dashboard APIs', async () => {
    mockApiClient.get.mockResolvedValueOnce({});

    await adminService.getDashboardStats();

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('keeps general admin locations on the admin endpoint', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 1,
      first: false,
      last: true,
      empty: true,
    });

    await adminService.getAdminLocations({
      search: 'seoul',
      category: 'LANDMARK',
      isActive: true,
      page: 1,
      size: 10,
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/admin/locations?search=seoul&category=LANDMARK&isActive=true&page=1&size=10'
    );
  });

  it('builds recommendation feedback query on the admin endpoint', async () => {
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

    await adminService.getRecommendationFeedback({
      userId: 1,
      rating: 2,
      feedbackType: 'MATCH',
      targetType: 'GROUP',
      page: 0,
      size: 20,
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/admin/recommendation-feedback?userId=1&rating=2&feedbackType=MATCH&targetType=GROUP&page=0&size=20'
    );
  });

  it('uses recommendation feedback stats endpoint', async () => {
    mockApiClient.get.mockResolvedValueOnce({});

    await adminService.getRecommendationFeedbackStats();

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/recommendation-feedback/stats');
  });
});
