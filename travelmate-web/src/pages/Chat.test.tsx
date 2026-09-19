import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Chat from './Chat';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('framer-motion', () => {
  const mockMotionProps = [
    'initial',
    'animate',
    'transition',
    'exit',
    'whileHover',
    'whileTap',
    'variants',
  ];
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
    AnimatePresence: ({ children }: { children: unknown }) => children,
  };
});

jest.mock('../services/authService', () => ({
  authService: {
    getUser: jest.fn(() => ({ id: 1 })),
  },
}));

jest.mock('../services/apiClient', () => ({
  apiClient: {
    uploadFile: jest.fn(),
  },
}));

jest.mock('../services/chatRestService', () => ({
  chatRestService: {
    getChatRoom: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    markAsRead: jest.fn(),
  },
}));

const mockMessages = [
  {
    id: 'msg-1',
    chatRoomId: 'room-1',
    senderId: '1',
    senderName: '나',
    content: '안녕하세요!',
    sentAt: new Date('2025-01-15T10:00:00'),
    messageType: 'TEXT' as const,
    isRead: true,
    isDeleted: false,
  },
  {
    id: 'msg-2',
    chatRoomId: 'room-1',
    senderId: '2',
    senderName: '김철수',
    content: '반갑습니다!',
    sentAt: new Date('2025-01-15T10:05:00'),
    messageType: 'TEXT' as const,
    isRead: false,
    isDeleted: false,
  },
];

const mockRoom = {
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
  unreadCount: 1,
  createdAt: new Date(),
  isActive: true,
};

const mockToast = { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };
jest.mock('../components/Toast', () => ({
  useToast: () => mockToast,
}));

jest.mock('../components/chat', () => ({
  ImageMessage: ({ alt }: { alt: string }) => <div data-testid="image-message">{alt}</div>,
  LocationMessage: ({ locationName }: { locationName: string }) => (
    <div data-testid="location-message">{locationName}</div>
  ),
  TypingIndicator: () => <div data-testid="typing-indicator">typing...</div>,
}));

jest.mock('../components/Logo', () => () => <div data-testid="logo">Logo</div>);
jest.mock('../components/ThemeToggle', () => () => (
  <div data-testid="theme-toggle">ThemeToggle</div>
));

// eslint-disable-next-line import/first
import { chatRestService } from '../services/chatRestService';

const renderChat = (roomId = 'room-1') =>
  render(
    <MemoryRouter initialEntries={[`/chat/${roomId}`]}>
      <Routes>
        <Route path="/chat/:roomId" element={<Chat />} />
      </Routes>
    </MemoryRouter>
  );

describe('Chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chatRestService.getChatRoom as jest.Mock).mockResolvedValue(mockRoom);
    (chatRestService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatRestService.sendMessage as jest.Mock).mockResolvedValue({
      id: 'msg-3',
      chatRoomId: 'room-1',
      senderId: '1',
      senderName: '나',
      content: '새 메시지',
      sentAt: new Date('2025-01-15T10:10:00'),
      messageType: 'TEXT',
      isRead: false,
      isDeleted: false,
    });
    (chatRestService.markAsRead as jest.Mock).mockResolvedValue(undefined);
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  test('renders chat room name', async () => {
    renderChat();
    expect(await screen.findByText('제주도 여행 채팅방')).toBeInTheDocument();
  });

  test('renders messages', async () => {
    renderChat();
    expect(await screen.findByText('안녕하세요!')).toBeInTheDocument();
    expect(screen.getByText('반갑습니다!')).toBeInTheDocument();
  });

  test('renders participant count', async () => {
    renderChat();
    expect(await screen.findByText('2명 참여')).toBeInTheDocument();
  });

  test('renders message input area', async () => {
    renderChat();
    expect(await screen.findByPlaceholderText('메시지를 입력하세요...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '메시지 보내기' })).toBeInTheDocument();
  });

  test('sends message on submit', async () => {
    renderChat();

    const input = await screen.findByPlaceholderText('메시지를 입력하세요...');
    fireEvent.change(input, { target: { value: '새 메시지' } });

    fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }));

    await waitFor(() => {
      expect(chatRestService.sendMessage).toHaveBeenCalledWith('room-1', {
        content: '새 메시지',
        messageType: 'TEXT',
      });
    });
  });

  test('does not send empty message', async () => {
    renderChat();

    fireEvent.click(await screen.findByRole('button', { name: '메시지 보내기' }));

    expect(chatRestService.sendMessage).not.toHaveBeenCalled();
  });

  test('shows empty state when no messages', async () => {
    (chatRestService.getMessages as jest.Mock).mockResolvedValue([]);
    renderChat();

    expect(await screen.findByText('아직 메시지가 없습니다')).toBeInTheDocument();
  });

  test('navigates to dashboard when room not found', async () => {
    (chatRestService.getChatRoom as jest.Mock).mockResolvedValue(null);
    renderChat('nonexistent');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('marks messages as read on mount', async () => {
    renderChat();
    await waitFor(() => {
      expect(chatRestService.markAsRead).toHaveBeenCalledWith('room-1');
    });
  });

  test('renders action buttons (image, location, emoticon)', async () => {
    renderChat();
    expect(await screen.findByRole('button', { name: '이미지 전송' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '위치 공유' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이모티콘 선택' })).toBeInTheDocument();
  });
});
