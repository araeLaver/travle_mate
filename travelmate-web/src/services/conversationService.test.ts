import { conversationService } from './conversationService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ConversationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts a conversation with the backend request shape', async () => {
    const response = {
      id: 12,
      participant1: { id: 1, nickname: '나' },
      participant2: { id: 2, nickname: '상대방' },
      createdAt: '2026-07-26T09:00:00',
    };
    mockApiClient.post.mockResolvedValueOnce(response);

    const result = await conversationService.startConversation(2);

    expect(mockApiClient.post).toHaveBeenCalledWith('/conversations', { targetUserId: 2 });
    expect(result).toBe(response);
  });

  it('loads current user conversations from the backend list endpoint', async () => {
    const conversations = [
      {
        id: 12,
        otherUser: { id: 2, nickname: '상대방' },
        unreadCount: 1,
        createdAt: '2026-07-26T09:00:00',
        lastMessageAt: '2026-07-26T09:10:00',
      },
    ];
    mockApiClient.get.mockResolvedValueOnce(conversations);

    const result = await conversationService.getMyConversations();

    expect(mockApiClient.get).toHaveBeenCalledWith('/conversations');
    expect(result).toBe(conversations);
  });

  it('loads paginated messages using conversationId, page, and size query params', async () => {
    const response = {
      messages: [],
      page: 1,
      size: 25,
      hasNext: false,
      totalElements: 0,
    };
    mockApiClient.get.mockResolvedValueOnce(response);

    const result = await conversationService.getMessages(12, 1, 25);

    expect(mockApiClient.get).toHaveBeenCalledWith('/messages?conversationId=12&page=1&size=25');
    expect(result).toBe(response);
  });

  it('sends messages with conversationId and content in the request body', async () => {
    const response = {
      id: 30,
      conversationId: 12,
      senderId: 1,
      senderNickname: '나',
      content: '안녕하세요',
      isRead: false,
      createdAt: '2026-07-26T09:15:00',
    };
    mockApiClient.post.mockResolvedValueOnce(response);

    const result = await conversationService.sendMessage(12, '안녕하세요');

    expect(mockApiClient.post).toHaveBeenCalledWith('/messages', {
      conversationId: 12,
      content: '안녕하세요',
    });
    expect(result).toBe(response);
  });

  it('marks a conversation as read with the backend read endpoint', async () => {
    mockApiClient.put.mockResolvedValueOnce({});

    await conversationService.markAsRead(12);

    expect(mockApiClient.put).toHaveBeenCalledWith('/messages/12/read');
  });
});
