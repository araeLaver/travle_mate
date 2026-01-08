import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import * as hooks from '../hooks/useNotifications';

// Mock hooks
jest.mock('../hooks/useNotifications');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('NotificationCenter', () => {
  const mockNotifications = {
    content: [
      {
        id: 1,
        type: 'GROUP_INVITE',
        title: '그룹 초대',
        message: '새로운 그룹에 초대되었습니다',
        actionUrl: '/groups/1',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'NEW_MESSAGE',
        title: '새 메시지',
        message: '새로운 메시지가 도착했습니다',
        actionUrl: '/chat/1',
        isRead: true,
        createdAt: new Date().toISOString(),
      },
    ],
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (hooks.useNotifications as jest.Mock).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
    });

    (hooks.useUnreadCount as jest.Mock).mockReturnValue({
      data: 1,
    });

    (hooks.useMarkAsRead as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (hooks.useMarkAllAsRead as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (hooks.useDeleteNotification as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (hooks.useRealtimeNotifications as jest.Mock).mockReturnValue({
      realtimeNotifications: [],
      clearRealtimeNotifications: jest.fn(),
    });
  });

  test('알림 센터 렌더링 테스트', () => {
    render(<NotificationCenter />, { wrapper: createWrapper() });

    // 알림 벨 아이콘이 보여야 함
    const bellButton = screen.getByRole('button', { name: /🔔/i });
    expect(bellButton).toBeInTheDocument();

    // 읽지 않은 알림 뱃지가 보여야 함
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('알림 벨 클릭 시 드롭다운 표시', async () => {
    render(<NotificationCenter />, { wrapper: createWrapper() });

    const bellButton = screen.getByRole('button', { name: /🔔/i });
    fireEvent.click(bellButton);

    expect(await screen.findByText('알림')).toBeInTheDocument();
    expect(screen.getByText('그룹 초대')).toBeInTheDocument();
    expect(screen.getByText('새 메시지')).toBeInTheDocument();
  });

  test('알림 클릭 시 읽음 처리 및 페이지 이동', async () => {
    const mockMarkAsRead = jest.fn();
    (hooks.useMarkAsRead as jest.Mock).mockReturnValue({
      mutate: mockMarkAsRead,
      isPending: false,
    });

    render(<NotificationCenter />, { wrapper: createWrapper() });

    // 드롭다운 열기
    const bellButton = screen.getByRole('button', { name: /🔔/i });
    fireEvent.click(bellButton);

    // 첫 번째 알림 클릭 (읽지 않음) - 텍스트 직접 클릭
    const notification = await screen.findByText('그룹 초대');
    fireEvent.click(notification);

    // 읽음 처리 함수가 호출되어야 함
    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith([1]);
    });
  });

  test('모두 읽음 버튼 클릭 테스트', async () => {
    const mockMarkAllAsRead = jest.fn();
    (hooks.useMarkAllAsRead as jest.Mock).mockReturnValue({
      mutate: mockMarkAllAsRead,
      isPending: false,
    });

    render(<NotificationCenter />, { wrapper: createWrapper() });

    // 드롭다운 열기
    const bellButton = screen.getByRole('button', { name: /🔔/i });
    fireEvent.click(bellButton);

    // 모두 읽음 버튼 클릭
    const markAllReadButton = await screen.findByRole('button', { name: /모두 읽음/i });
    fireEvent.click(markAllReadButton);

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });
  });

  test('알림 삭제 버튼 테스트', async () => {
    const mockDeleteNotification = jest.fn();
    (hooks.useDeleteNotification as jest.Mock).mockReturnValue({
      mutate: mockDeleteNotification,
      isPending: false,
    });

    render(<NotificationCenter />, { wrapper: createWrapper() });

    // 드롭다운 열기
    const bellButton = screen.getByRole('button', { name: /🔔/i });
    fireEvent.click(bellButton);

    await screen.findByText('그룹 초대');
    const deleteButtons = screen.getAllByText('✕');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteNotification).toHaveBeenCalledWith(1);
    });
  });

  test('로딩 상태 표시', () => {
    (hooks.useNotifications as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<NotificationCenter />, { wrapper: createWrapper() });

    const bellButton = screen.getByRole('button', { name: /🔔/i });
    fireEvent.click(bellButton);

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  test('알림 없음 상태 표시', () => {
    (hooks.useNotifications as jest.Mock).mockReturnValue({
      data: { content: [], totalPages: 0 },
      isLoading: false,
    });

    (hooks.useUnreadCount as jest.Mock).mockReturnValue({
      data: 0,
    });

    render(<NotificationCenter />, { wrapper: createWrapper() });

    const bellButton = screen.getByRole('button', { name: /🔔/i });
    fireEvent.click(bellButton);

    expect(screen.getByText('새로운 알림이 없습니다.')).toBeInTheDocument();
  });
});
