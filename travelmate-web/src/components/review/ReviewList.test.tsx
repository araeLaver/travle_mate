import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewList from './ReviewList';
import { locationReviewService } from '../../services/locationReviewService';
import { authService } from '../../services/authService';

// Mock services
jest.mock('../../services/locationReviewService', () => ({
  locationReviewService: {
    getLocationReviews: jest.fn(),
    getLocationReviewStats: jest.fn(),
    toggleHelpful: jest.fn(),
    deleteReview: jest.fn(),
  },
}));

jest.mock('../../services/authService', () => ({
  authService: {
    getUser: jest.fn(),
  },
}));

const mockGetLocationReviews = locationReviewService.getLocationReviews as jest.Mock;
const mockGetLocationReviewStats = locationReviewService.getLocationReviewStats as jest.Mock;
const mockToggleHelpful = locationReviewService.toggleHelpful as jest.Mock;
const mockDeleteReview = locationReviewService.deleteReview as jest.Mock;
const mockGetUser = authService.getUser as jest.Mock;

describe('ReviewList', () => {
  const mockReviews = [
    {
      id: 1,
      rating: 5,
      comment: '정말 좋은 장소입니다!',
      visitedSeasonDisplay: '봄',
      helpfulCount: 10,
      isHelpful: false,
      photoUrls: ['https://example.com/photo1.jpg'],
      createdAt: new Date().toISOString(),
      reviewer: {
        id: 1,
        nickname: '여행자1',
        profileImageUrl: 'https://example.com/profile1.jpg',
      },
    },
    {
      id: 2,
      rating: 4,
      comment: '괜찮았어요',
      visitedSeasonDisplay: '여름',
      helpfulCount: 5,
      isHelpful: true,
      photoUrls: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 어제
      reviewer: {
        id: 2,
        nickname: '여행자2',
        profileImageUrl: null,
      },
    },
  ];

  const mockStats = {
    averageRating: 4.5,
    reviewCount: 25,
  };

  const mockOnReviewDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockReturnValue({ id: 1, nickname: '여행자1' });
  });

  test('리뷰 목록 렌더링', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: mockReviews,
      last: false,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(screen.getByText('정말 좋은 장소입니다!')).toBeInTheDocument();
      expect(screen.getByText('괜찮았어요')).toBeInTheDocument();
    });
  });

  test('통계 헤더 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: mockReviews,
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('25개의 리뷰')).toBeInTheDocument();
    });
  });

  test('빈 목록 메시지 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: [],
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce({ averageRating: 0, reviewCount: 0 });

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(screen.getByText('아직 리뷰가 없습니다.')).toBeInTheDocument();
      expect(screen.getByText('첫 번째 리뷰를 작성해보세요!')).toBeInTheDocument();
    });
  });

  test('최신순 정렬 버튼 활성화 상태', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: mockReviews,
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      const recentBtn = screen.getByText('최신순');
      expect(recentBtn).toHaveClass('active');
    });
  });

  test('정렬 버튼 클릭 시 정렬 변경', async () => {
    mockGetLocationReviews.mockResolvedValue({
      content: mockReviews,
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValue(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(screen.getByText('최신순')).toBeInTheDocument();
    });

    const helpfulBtn = screen.getByText('도움순');
    fireEvent.click(helpfulBtn);

    await waitFor(() => {
      expect(helpfulBtn).toHaveClass('active');
      expect(mockGetLocationReviews).toHaveBeenCalledWith(1, 'helpful', 0);
    });
  });

  test('도움됨 버튼 클릭', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: mockReviews,
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);
    mockToggleHelpful.mockResolvedValueOnce({ isHelpful: true });

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(screen.getByText('정말 좋은 장소입니다!')).toBeInTheDocument();
    });

    const helpfulBtns = screen.getAllByText(/도움됨/);
    fireEvent.click(helpfulBtns[0]);

    await waitFor(() => {
      expect(mockToggleHelpful).toHaveBeenCalledWith(1);
    });
  });

  test('본인 리뷰에만 삭제 버튼 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: mockReviews,
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      const deleteBtns = document.querySelectorAll('.delete-btn');
      expect(deleteBtns).toHaveLength(1); // 본인 리뷰만
    });
  });

  test('삭제 버튼 클릭 시 삭제 확인 및 실행', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: mockReviews,
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);
    mockDeleteReview.mockResolvedValueOnce({});

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ReviewList locationId={1} onReviewDeleted={mockOnReviewDeleted} />);

    await waitFor(() => {
      expect(document.querySelector('.delete-btn')).toBeInTheDocument();
    });

    const deleteBtn = document.querySelector('.delete-btn');
    fireEvent.click(deleteBtn!);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('리뷰를 삭제하시겠습니까?');
      expect(mockDeleteReview).toHaveBeenCalledWith(1);
      expect(mockOnReviewDeleted).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  test('삭제 취소 시 삭제하지 않음', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: mockReviews,
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(document.querySelector('.delete-btn')).toBeInTheDocument();
    });

    const deleteBtn = document.querySelector('.delete-btn');
    fireEvent.click(deleteBtn!);

    expect(mockDeleteReview).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  test('더 보기 버튼 표시 및 클릭', async () => {
    mockGetLocationReviews
      .mockResolvedValueOnce({
        content: mockReviews,
        last: false,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 3,
            rating: 3,
            comment: '추가 리뷰',
            helpfulCount: 0,
            isHelpful: false,
            photoUrls: [],
            createdAt: new Date().toISOString(),
            reviewer: { id: 3, nickname: '여행자3', profileImageUrl: null },
          },
        ],
        last: true,
      });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(screen.getByText('더 보기')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('더 보기'));

    await waitFor(() => {
      expect(mockGetLocationReviews).toHaveBeenCalledTimes(2);
    });
  });

  test('로딩 스피너 표시', async () => {
    mockGetLocationReviews.mockImplementation(
      () => new Promise(() => {}) // 무한 대기
    );
    mockGetLocationReviewStats.mockImplementation(() => new Promise(() => {}));

    render(<ReviewList locationId={1} />);

    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  test('리뷰어 프로필 이미지 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: [mockReviews[0]],
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      const avatar = screen.getByAltText('여행자1');
      expect(avatar).toHaveAttribute('src', 'https://example.com/profile1.jpg');
    });
  });

  test('프로필 이미지 없을 때 플레이스홀더 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: [mockReviews[1]],
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      const placeholder = document.querySelector('.reviewer-avatar.placeholder');
      expect(placeholder).toBeInTheDocument();
    });
  });

  test('방문 계절 배지 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: [mockReviews[0]],
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(screen.getByText('봄 방문')).toBeInTheDocument();
    });
  });

  test('리뷰 사진 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: [mockReviews[0]],
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      const photo = screen.getByAltText('리뷰 사진 1');
      expect(photo).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });
  });

  test('도움됨 활성화 상태 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: [mockReviews[1]], // isHelpful: true
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      const activeBtn = document.querySelector('.helpful-btn.active');
      expect(activeBtn).toBeInTheDocument();
    });
  });

  test('도움됨 카운트 표시', async () => {
    mockGetLocationReviews.mockResolvedValueOnce({
      content: [mockReviews[0]], // helpfulCount: 10
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      expect(screen.getByText('도움됨 (10)')).toBeInTheDocument();
    });
  });

  test('로그인하지 않은 경우 삭제 버튼 미표시', async () => {
    mockGetUser.mockReturnValue(null);
    mockGetLocationReviews.mockResolvedValueOnce({
      content: mockReviews,
      last: true,
    });
    mockGetLocationReviewStats.mockResolvedValueOnce(mockStats);

    render(<ReviewList locationId={1} />);

    await waitFor(() => {
      const deleteBtns = document.querySelectorAll('.delete-btn');
      expect(deleteBtns).toHaveLength(0);
    });
  });
});
