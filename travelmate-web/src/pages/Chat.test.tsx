import { render, screen, fireEvent } from '@testing-library/react';
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

jest.mock('../services/chatService', () => ({
  chatService: {
    getChatRooms: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
    addMessageListener: jest.fn(),
    removeMessageListener: jest.fn(),
    getCurrentUserId: jest.fn().mockReturnValue('user-1'),
  },
  ChatMessage: {},
  ChatRoom: {},
}));

const mockMessages = [
  {
    id: 'msg-1',
    roomId: 'room-1',
    senderId: 'user-1',
    senderName: '나',
    content: '안녕하세요!',
    timestamp: new Date('2025-01-15T10:00:00'),
    type: 'text' as const,
    isRead: true,
  },
  {
    id: 'msg-2',
    roomId: 'room-1',
    senderId: 'user-2',
    senderName: '김철수',
    content: '반갑습니다!',
    timestamp: new Date('2025-01-15T10:05:00'),
    type: 'text' as const,
    isRead: false,
  },
];

const mockRoom = {
  id: 'room-1',
  name: '제주도 여행 채팅방',
  participants: [
    { id: 'user-1', name: '나', isOnline: true, lastSeen: new Date() },
    { id: 'user-2', name: '김철수', isOnline: true, lastSeen: new Date() },
  ],
  unreadCount: 1,
  createdAt: new Date(),
  type: 'group' as const,
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
import { chatService } from '../services/chatService';

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
    (chatService.getChatRooms as jest.Mock).mockReturnValue([mockRoom]);
    (chatService.getMessages as jest.Mock).mockReturnValue(mockMessages);
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  test('renders chat room name', () => {
    renderChat();
    expect(screen.getByText('제주도 여행 채팅방')).toBeInTheDocument();
  });

  test('renders messages', () => {
    renderChat();
    expect(screen.getByText('안녕하세요!')).toBeInTheDocument();
    expect(screen.getByText('반갑습니다!')).toBeInTheDocument();
  });

  test('renders participant count', () => {
    renderChat();
    expect(screen.getByText('2명 참여')).toBeInTheDocument();
  });

  test('renders message input area', () => {
    renderChat();
    expect(screen.getByPlaceholderText('메시지를 입력하세요...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '메시지 보내기' })).toBeInTheDocument();
  });

  test('sends message on submit', () => {
    renderChat();

    const input = screen.getByPlaceholderText('메시지를 입력하세요...');
    fireEvent.change(input, { target: { value: '새 메시지' } });

    fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(chatService.sendMessage).toHaveBeenCalledWith('room-1', '새 메시지');
  });

  test('does not send empty message', () => {
    renderChat();

    fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }));

    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  test('shows empty state when no messages', () => {
    (chatService.getMessages as jest.Mock).mockReturnValue([]);
    renderChat();

    expect(screen.getByText('아직 메시지가 없습니다')).toBeInTheDocument();
  });

  test('navigates to dashboard when room not found', () => {
    (chatService.getChatRooms as jest.Mock).mockReturnValue([]);
    renderChat('nonexistent');

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('marks messages as read on mount', () => {
    renderChat();
    expect(chatService.markMessagesAsRead).toHaveBeenCalledWith('room-1');
  });

  test('renders action buttons (image, location, emoticon)', () => {
    renderChat();
    expect(screen.getByRole('button', { name: '이미지 전송' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '위치 공유' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이모티콘 선택' })).toBeInTheDocument();
  });
});
