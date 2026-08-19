import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockApiClient = {
  get: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  post: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

const loadChatService = () => {
  jest.resetModules();
  jest.doMock('./apiClient', () => ({
    __esModule: true,
    apiClient: mockApiClient,
    default: mockApiClient,
  }));

  return require('./chatService') as typeof import('./chatService');
};

const createBackendGroup = (id: number) => ({
  id,
  title: `Seoul Group ${id}`,
  description: `Seoul itinerary ${id}`,
  destination: 'Seoul',
  currentMembers: id,
  maxMembers: 20,
  groupImageUrl: null,
  creator: {
    id: 1,
    nickname: 'owner',
  },
  status: 'RECRUITING',
  createdAt: '2026-08-01T00:00:00',
  isJoinedByCurrentUser: false,
});

describe('mobile chatService backend contract mapping', () => {
  beforeEach(() => {
    mockApiClient.get.mockReset();
    mockApiClient.post.mockReset();
  });

  it('returns the created group when post-create chat room bootstrap fails', async () => {
    const { chatService } = loadChatService();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockApiClient.post
      .mockResolvedValueOnce(createBackendGroup(7))
      .mockRejectedValueOnce({ response: { status: 503 }, message: 'chat room down' });

    const group = await chatService.createGroup({
      name: '서울 동행',
      description: '주말 일정',
      destination: '서울',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      purpose: 'LEISURE',
      maxMembers: 4,
    });

    expect(group).toMatchObject({
      id: 7,
      name: 'Seoul Group 7',
      isMember: true,
    });
    expect(mockApiClient.post).toHaveBeenNthCalledWith(1, '/groups', {
      title: '서울 동행',
      description: '주말 일정',
      destination: '서울',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      purpose: 'LEISURE',
      maxMembers: 4,
    });
    expect(mockApiClient.post).toHaveBeenNthCalledWith(2, '/chat/rooms', {
      roomName: '서울 동행',
      roomType: 'TRAVEL_GROUP',
      travelGroupId: 7,
    });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to create group chat room after group creation:',
      expect.objectContaining({ message: 'chat room down' })
    );
    consoleWarnSpy.mockRestore();
  });

  it('paginates filtered public group results without losing total counts', async () => {
    const { chatService } = loadChatService();
    const groups = Array.from({ length: 25 }, (_, index) => createBackendGroup(index + 1));
    mockApiClient.get.mockResolvedValueOnce(groups);

    const response = await chatService.getPublicGroups(' seoul ', 1);

    expect(mockApiClient.get).toHaveBeenCalledWith('/groups');
    expect(response.content.map(group => group.id)).toEqual([21, 22, 23, 24, 25]);
    expect(response.totalElements).toBe(25);
    expect(response.totalPages).toBe(2);
    expect(response.size).toBe(20);
    expect(response.number).toBe(1);
    expect(response.first).toBe(false);
    expect(response.last).toBe(true);
  });

  it('normalizes backend creator member roles to the mobile owner role', async () => {
    const { chatService } = loadChatService();
    mockApiClient.get.mockResolvedValueOnce([
      {
        id: 10,
        user: {
          id: 1,
          nickname: '방장',
          profileImageUrl: null,
        },
        role: 'CREATOR',
        status: 'ACCEPTED',
        joinedAt: '2026-08-01T00:00:00',
      },
      {
        id: 11,
        user: {
          id: 2,
          nickname: '관리자',
          profileImageUrl: 'https://example.com/admin.png',
        },
        role: 'ADMIN',
        status: 'ACCEPTED',
        joinedAt: '2026-08-01T01:00:00',
      },
      {
        id: 12,
        user: {
          id: 3,
          nickname: '멤버',
          profileImageUrl: null,
        },
        role: 'UNKNOWN',
        status: 'ACCEPTED',
        joinedAt: '2026-08-01T02:00:00',
      },
    ]);

    const members = await chatService.getGroupMembers(7);

    expect(mockApiClient.get).toHaveBeenCalledWith('/groups/7/members');
    expect(members.map(member => member.role)).toEqual(['OWNER', 'ADMIN', 'MEMBER']);
  });

  it('sends location messages to the resolved chat room using backend DTO fields', async () => {
    const { chatService } = loadChatService();
    mockApiClient.get.mockResolvedValueOnce([
      {
        id: 99,
        roomName: '서울 채팅',
        travelGroupId: 7,
        createdAt: '2026-08-01T00:00:00',
      },
    ]);
    mockApiClient.post.mockResolvedValueOnce({
      id: 501,
      chatRoomId: 99,
      sender: {
        id: 3,
        nickname: '여행자',
        profileImageUrl: null,
      },
      content: '서울역',
      messageType: 'LOCATION',
      locationLatitude: 37.5547,
      locationLongitude: 126.9706,
      locationName: '서울역',
      sentAt: '2026-08-01T12:00:00',
      isDeleted: false,
    });

    const message = await chatService.sendMessage(7, {
      content: '서울역',
      messageType: 'LOCATION',
      latitude: 37.5547,
      longitude: 126.9706,
      locationName: '서울역',
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/chat/rooms/99/messages', {
      content: '서울역',
      messageType: 'LOCATION',
      imageUrl: undefined,
      locationLatitude: 37.5547,
      locationLongitude: 126.9706,
      locationName: '서울역',
    });
    expect(message).toMatchObject({
      id: 501,
      groupId: 99,
      senderId: 3,
      senderNickname: '여행자',
      messageType: 'LOCATION',
      latitude: 37.5547,
      longitude: 126.9706,
      locationName: '서울역',
      createdAt: '2026-08-01T12:00:00',
    });
  });
});
