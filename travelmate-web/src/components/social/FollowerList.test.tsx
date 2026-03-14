import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import FollowerList from './FollowerList';
import * as useFollowHooks from '../../hooks/useFollow';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock hooks
jest.mock('../../hooks/useFollow');

const mockUseFollowers = useFollowHooks.useFollowers as jest.Mock;
const mockUseFollowing = useFollowHooks.useFollowing as jest.Mock;
const mockUseFollowToggle = useFollowHooks.useFollowToggle as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('FollowerList', () => {
  const mockFollowers = [
    {
      id: 1,
      nickname: '팔로워1',
      profileImageUrl: 'https://example.com/profile1.jpg',
      bio: '안녕하세요',
      followedAt: '2024-01-01T00:00:00Z',
      isMutual: true,
    },
    {
      id: 2,
      nickname: '팔로워2',
      profileImageUrl: null,
      bio: null,
      followedAt: '2024-01-02T00:00:00Z',
      isMutual: false,
    },
  ];

  const mockToggle = jest.fn();
  const mockOnClose = jest.fn();
  const mockFetchNextPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFollowToggle.mockReturnValue({
      toggle: mockToggle,
      isLoading: false,
    });
  });

  test('팔로워 목록 렌더링', async () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: mockFollowers, totalElements: 2 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('팔로워');
    });
    expect(screen.getByText('팔로워1')).toBeInTheDocument();
    expect(screen.getByText('팔로워2')).toBeInTheDocument();
  });

  test('팔로잉 목록 렌더링', async () => {
    mockUseFollowers.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUseFollowing.mockReturnValue({
      data: { pages: [{ content: mockFollowers, totalElements: 2 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });

    render(<FollowerList userId={1} type="following" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('팔로잉');
    });
  });

  test('로딩 스피너 표시', () => {
    mockUseFollowers.mockReturnValue({
      data: null,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: true,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  test('빈 목록 메시지 표시', () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: [], totalElements: 0 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('아직 팔로워가 없습니다.')).toBeInTheDocument();
  });

  test('팔로잉 빈 목록 메시지 표시', () => {
    mockUseFollowers.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUseFollowing.mockReturnValue({
      data: { pages: [{ content: [], totalElements: 0 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });

    render(<FollowerList userId={1} type="following" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('아직 팔로우하는 사람이 없습니다.')).toBeInTheDocument();
  });

  test('팔로우 버튼 클릭', async () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: [mockFollowers[1]], totalElements: 1 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    const followBtn = screen.getByText('팔로우');
    fireEvent.click(followBtn);

    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith(2, false);
    });
  });

  test('언팔로우 버튼 클릭 (팔로잉 상태)', async () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: [mockFollowers[0]], totalElements: 1 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    const followingBtn = screen.getByText('팔로잉');
    fireEvent.click(followingBtn);

    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith(1, true);
    });
  });

  test('닫기 버튼 동작', () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: mockFollowers, totalElements: 2 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} onClose={mockOnClose} />, {
      wrapper: createWrapper(),
    });

    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('맞팔로우 배지 표시', () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: [mockFollowers[0]], totalElements: 1 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('mutual-badge')).toBeInTheDocument();
  });

  test('본인 프로필 아닐 때 팔로우 버튼 미표시', () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: mockFollowers, totalElements: 2 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={false} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText('팔로우')).not.toBeInTheDocument();
    expect(screen.queryByText('팔로잉')).not.toBeInTheDocument();
  });

  test('에러 상태 표시', () => {
    mockUseFollowers.mockReturnValue({
      data: null,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: new Error('Network error'),
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('목록을 불러오는데 실패했습니다.')).toBeInTheDocument();
  });

  test('프로필 이미지 없을 때 플레이스홀더 표시', () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: [mockFollowers[1]], totalElements: 1 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('avatar-placeholder-2')).toBeInTheDocument();
  });

  test('총 카운트 표시', () => {
    mockUseFollowers.mockReturnValue({
      data: { pages: [{ content: mockFollowers, totalElements: 100 }] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });
    mockUseFollowing.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FollowerList userId={1} type="followers" isOwnProfile={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
