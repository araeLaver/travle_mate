import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatList from './ChatList';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('framer-motion', () => {
  const mockMotionProps = ['initial', 'animate', 'transition', 'variants'];
  const ReactModule = require('react');
  return {
    motion: new Proxy(
      {},
      {
        get: (_target: unknown, prop: string) => {
          return ({ children, ...rest }: { children?: unknown; [key: string]: unknown }) => {
            const validProps = Object.fromEntries(
              Object.entries(rest).filter(([key]) => !mockMotionProps.includes(key))
            );
            return ReactModule.createElement(prop, validProps, children);
          };
        },
      }
    ),
  };
});

jest.mock('../services/authService', () => ({
  authService: {
    getUser: jest.fn(() => ({ id: 1 })),
  },
}));

jest.mock('../services/chatRestService', () => ({
  chatRestService: {
    getChatRooms: jest.fn(),
  },
}));

jest.mock('../components/Logo', () => () => <div data-testid="logo">Logo</div>);
jest.mock('../components/ThemeToggle', () => () => (
  <div data-testid="theme-toggle">ThemeToggle</div>
));
jest.mock('../components/SEOHead', () => () => null);
jest.mock('../components/PageBackground', () => () => null);

// eslint-disable-next-line import/first
import { chatRestService } from '../services/chatRestService';

const mockRooms = [
  {
    id: 'room-1',
    name: '제주도 여행 채팅방',
    roomType: 'GROUP' as const,
    participants: [
      { id: 'participant-1', userId: '1', userName: '나', isOnline: true, lastSeen: new Date() },
      {
        id: 'participant-2',
        userId: '2',
        userName: '김철수',
        isOnline: true,
        lastSeen: new Date(),
      },
    ],
    lastMessage: {
      id: 'msg-1',
      chatRoomId: 'room-1',
      senderId: '2',
      senderName: '김철수',
      content: '내일 일정 확인해요',
      messageType: 'TEXT' as const,
      isDeleted: false,
      sentAt: new Date('2025-01-15T10:00:00'),
      isRead: false,
    },
    unreadCount: 2,
    createdAt: new Date('2025-01-15T09:00:00'),
    isActive: true,
  },
  {
    id: 'room-2',
    name: '서울 문화탐방',
    roomType: 'PRIVATE' as const,
    participants: [
      { id: 'participant-1', userId: '1', userName: '나', isOnline: true, lastSeen: new Date() },
      {
        id: 'participant-3',
        userId: '3',
        userName: '박영희',
        isOnline: false,
        lastSeen: new Date(),
      },
    ],
    unreadCount: 0,
    createdAt: new Date('2025-01-14T09:00:00'),
    isActive: true,
  },
];

const renderChatList = () =>
  render(
    <MemoryRouter>
      <ChatList />
    </MemoryRouter>
  );

describe('ChatList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chatRestService.getChatRooms as jest.Mock).mockResolvedValue(mockRooms);
  });

  test('loads chat rooms from REST service', async () => {
    renderChatList();

    expect(await screen.findByText('제주도 여행 채팅방')).toBeInTheDocument();
    expect(screen.getByText('서울 문화탐방')).toBeInTheDocument();
    expect(chatRestService.getChatRooms).toHaveBeenCalled();
  });

  test('filters chat rooms by search query', async () => {
    renderChatList();

    const searchInput = await screen.findByLabelText('채팅방 검색');
    fireEvent.change(searchInput, { target: { value: '제주' } });

    expect(screen.getByText('제주도 여행 채팅방')).toBeInTheDocument();
    expect(screen.queryByText('서울 문화탐방')).not.toBeInTheDocument();
  });

  test('navigates to selected chat room', async () => {
    renderChatList();

    fireEvent.click(await screen.findByText('제주도 여행 채팅방'));

    expect(mockNavigate).toHaveBeenCalledWith('/chat/room-1');
  });
});
