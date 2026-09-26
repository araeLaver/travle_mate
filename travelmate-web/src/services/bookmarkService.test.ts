import * as bookmarkService from './bookmarkService';
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

describe('BookmarkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates bookmarks with the backend request body', async () => {
    const request = {
      targetType: 'LOCATION' as const,
      targetId: 7,
      folderName: 'summer',
      note: 'visit again',
    };
    const response = {
      id: 3,
      targetType: 'LOCATION',
      targetTypeDisplayName: 'Location',
      targetId: 7,
      createdAt: '2026-07-26T09:00:00',
    };
    mockApiClient.post.mockResolvedValueOnce(response);

    const result = await bookmarkService.createBookmark(request);

    expect(mockApiClient.post).toHaveBeenCalledWith('/bookmarks', request);
    expect(result).toBe(response);
  });

  it('toggles bookmarks with targetType and targetId query params', async () => {
    const response = {
      targetType: 'LOCATION',
      targetId: 7,
      isBookmarked: true,
    };
    mockApiClient.post.mockResolvedValueOnce(response);

    const result = await bookmarkService.toggleBookmark('LOCATION', 7);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/bookmarks/toggle?targetType=LOCATION&targetId=7'
    );
    expect(result).toBe(response);
  });

  it('encodes folder names when loading folder bookmarks', async () => {
    const response = {
      bookmarks: [],
      totalCount: 0,
      hasMore: false,
      page: 2,
      size: 5,
    };
    mockApiClient.get.mockResolvedValueOnce(response);

    const result = await bookmarkService.getBookmarksByFolder('summer plans', 2, 5);

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/bookmarks/folder/summer%20plans?page=2&size=5'
    );
    expect(result).toBe(response);
  });

  it('uses the batch status endpoint for location bookmark checks', async () => {
    const response = {
      targetType: 'LOCATION',
      bookmarkStatus: {
        7: true,
        8: false,
      },
    };
    mockApiClient.post.mockResolvedValueOnce(response);

    const result = await bookmarkService.getBatchLocationBookmarkStatus([7, 8]);

    expect(mockApiClient.post).toHaveBeenCalledWith('/bookmarks/status/batch', {
      targetType: 'LOCATION',
      targetIds: [7, 8],
    });
    expect(result).toBe(response);
  });

  it('renames folders with the backend bulk rename endpoint', async () => {
    const request = {
      oldFolderName: 'summer',
      newFolderName: 'autumn',
    };
    mockApiClient.put.mockResolvedValueOnce(4);

    const result = await bookmarkService.renameFolder(request);

    expect(mockApiClient.put).toHaveBeenCalledWith('/bookmarks/folders/rename', request);
    expect(result).toBe(4);
  });
});
