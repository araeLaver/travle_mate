import { chatRestService } from './chatRestService';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ChatRestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps backend chat rooms with string lastMessage and participant DTO fields', async () => {
    mockApiClient.get.mockResolvedValueOnce([
      {
        id: 10,
        roomName: '서울 여행',
        roomType: 'GROUP',
        participants: [
          {
            userId: 2,
            nickname: '상대방',
            profileImageUrl: 'https://example.com/profile.jpg',
          },
        ],
        lastMessage: '내일 봐요',
        lastMessageAt: '2026-07-26T09:00:00',
        unreadCount: 3,
        createdAt: '2026-07-25T09:00:00',
      },
    ]);

    const rooms = await chatRestService.getChatRooms();

    expect(mockApiClient.get).toHaveBeenCalledWith('/chat/rooms');
    expect(rooms[0].participants[0]).toMatchObject({
      id: '2',
      userId: '2',
      userName: '상대방',
      profileImage: 'https://example.com/profile.jpg',
    });
    expect(rooms[0].lastMessage?.content).toBe('내일 봐요');
    expect(rooms[0].unreadCount).toBe(3);
  });

  it('normalizes create-room ids to backend numeric ids', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      id: 11,
      roomName: '부산 여행',
      roomType: 'TRAVEL_GROUP',
      participants: [],
      createdAt: '2026-07-26T09:00:00',
    });

    await chatRestService.createChatRoom({
      roomName: '부산 여행',
      roomType: 'TRAVEL_GROUP',
      participantIds: ['2', '3'],
      travelGroupId: '7',
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/chat/rooms', {
      roomName: '부산 여행',
      roomType: 'TRAVEL_GROUP',
      participantIds: [2, 3],
      travelGroupId: 7,
    });
  });

  it('handles array message responses from the backend', async () => {
    mockApiClient.get.mockResolvedValueOnce([
      {
        id: 1,
        chatRoomId: 10,
        sender: { id: 2, nickname: '상대방' },
        content: '도착했습니다',
        messageType: 'TEXT',
        sentAt: '2026-07-26T09:10:00',
        isDeleted: false,
      },
    ]);

    const messages = await chatRestService.getMessages('10');

    expect(mockApiClient.get).toHaveBeenCalledWith('/chat/rooms/10/messages?page=0&size=50');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      id: '1',
      chatRoomId: '10',
      senderId: '2',
      senderName: '상대방',
      content: '도착했습니다',
    });
  });

  it('keeps compatibility with paginated message responses', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      content: [
        {
          id: 2,
          chatRoomId: 10,
          content: '페이지 응답',
          messageType: 'TEXT',
          sentAt: '2026-07-26T09:20:00',
          isDeleted: false,
        },
      ],
    });

    const messages = await chatRestService.getMessages('10', 1, 25);

    expect(mockApiClient.get).toHaveBeenCalledWith('/chat/rooms/10/messages?page=1&size=25');
    expect(messages[0].content).toBe('페이지 응답');
  });

  it('calls backend message deletion and unread count endpoints', async () => {
    mockApiClient.delete.mockResolvedValueOnce({});
    mockApiClient.get.mockResolvedValueOnce({ count: 4 });

    await chatRestService.deleteMessage('55');
    const count = await chatRestService.getUnreadCount('10');

    expect(mockApiClient.delete).toHaveBeenCalledWith('/chat/messages/55');
    expect(mockApiClient.get).toHaveBeenCalledWith('/chat/rooms/10/unread-count');
    expect(count).toBe(4);
  });
});
