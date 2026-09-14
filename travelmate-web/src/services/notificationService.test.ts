import { notificationService } from './notificationService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads paginated notifications with page and size params', async () => {
    const response = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 2,
      first: false,
      last: true,
      empty: true,
    };
    mockApiClient.get.mockResolvedValueOnce(response);

    const result = await notificationService.getNotifications(2, 10);

    expect(mockApiClient.get).toHaveBeenCalledWith('/notifications?page=2&size=10');
    expect(result).toBe(response);
  });

  it('loads unread notifications and maps unread count responses to a number', async () => {
    mockApiClient.get.mockResolvedValueOnce([
      {
        id: 1,
        type: 'MESSAGE',
        title: '새 메시지',
        message: '도착했습니다',
        isRead: false,
        createdAt: '2026-07-26T09:00:00',
      },
    ]);
    mockApiClient.get.mockResolvedValueOnce({ count: 3 });

    const unread = await notificationService.getUnreadNotifications();
    const count = await notificationService.getUnreadCount();

    expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/notifications/unread');
    expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/notifications/unread/count');
    expect(unread).toHaveLength(1);
    expect(count).toBe(3);
  });

  it('marks selected notifications and all notifications as read', async () => {
    mockApiClient.post.mockResolvedValue(undefined);

    await notificationService.markAsRead([1, 2]);
    await notificationService.markAllAsRead();

    expect(mockApiClient.post).toHaveBeenNthCalledWith(1, '/notifications/read', [1, 2]);
    expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/notifications/read/all');
  });

  it('deletes notifications through the backend delete endpoint', async () => {
    mockApiClient.delete.mockResolvedValueOnce(undefined);

    await notificationService.deleteNotification(7);

    expect(mockApiClient.delete).toHaveBeenCalledWith('/notifications/7');
  });
});
