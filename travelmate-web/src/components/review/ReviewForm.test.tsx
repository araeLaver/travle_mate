import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from './ReviewForm';
import { locationReviewService } from '../../services/locationReviewService';

// Mock service
jest.mock('../../services/locationReviewService', () => ({
  locationReviewService: {
    createReview: jest.fn(),
  },
}));

const mockCreateReview = locationReviewService.createReview as jest.Mock;

describe('ReviewForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();
  const defaultProps = {
    locationId: 1,
    locationName: '테스트 장소',
    onSubmit: mockOnSubmit,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('폼 초기 렌더링', () => {
    render(<ReviewForm {...defaultProps} />);

    expect(screen.getByRole('heading', { name: '리뷰 작성' })).toBeInTheDocument();
    expect(screen.getByText('테스트 장소')).toBeInTheDocument();
    expect(screen.getByText('평점 *')).toBeInTheDocument();
    expect(screen.getByText('방문 계절')).toBeInTheDocument();
    expect(screen.getByText('리뷰 내용')).toBeInTheDocument();
  });

  test('별점 클릭시 상태 변경', () => {
    render(<ReviewForm {...defaultProps} />);

    const star4 = screen.getByTestId('star-btn-4');
    fireEvent.click(star4);

    expect(screen.getByText('4점')).toBeInTheDocument();
  });

  test('별점 호버시 미리보기', () => {
    render(<ReviewForm {...defaultProps} />);

    const star5 = screen.getByTestId('star-btn-5');
    fireEvent.mouseEnter(star5);

    // All 5 stars should be filled
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`star-btn-${i}`)).toHaveClass('filled');
    }

    fireEvent.mouseLeave(star5);
  });

  test('계절 선택', () => {
    render(<ReviewForm {...defaultProps} />);

    const springBtn = screen.getByText('봄');
    fireEvent.click(springBtn);

    expect(springBtn).toHaveClass('selected');
  });

  test('계절 토글 (선택 해제)', () => {
    render(<ReviewForm {...defaultProps} />);

    const springBtn = screen.getByText('봄');
    fireEvent.click(springBtn); // 선택
    fireEvent.click(springBtn); // 해제

    expect(springBtn).not.toHaveClass('selected');
  });

  test('코멘트 입력', () => {
    render(<ReviewForm {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('이 장소에 대한 경험을 공유해주세요...');
    fireEvent.change(textarea, { target: { value: '좋은 장소입니다!' } });

    expect(textarea).toHaveValue('좋은 장소입니다!');
    const charCount = screen.getByTestId('char-count');
    expect(charCount).toHaveTextContent('9/1000');
  });

  test('별점 없이 제출 시 에러 표시', async () => {
    render(<ReviewForm {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: '리뷰 작성' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('평점을 선택해주세요.')).toBeInTheDocument();
    expect(mockCreateReview).not.toHaveBeenCalled();
  });

  test('제출 성공', async () => {
    mockCreateReview.mockResolvedValueOnce({});

    render(<ReviewForm {...defaultProps} />);

    // 별점 선택
    const star5 = screen.getByTestId('star-btn-5');
    fireEvent.click(star5);

    // 계절 선택
    const summerBtn = screen.getByText('여름');
    fireEvent.click(summerBtn);

    // 코멘트 입력
    const textarea = screen.getByPlaceholderText('이 장소에 대한 경험을 공유해주세요...');
    fireEvent.change(textarea, { target: { value: '정말 좋았어요!' } });

    // 제출
    const submitBtn = screen.getByRole('button', { name: '리뷰 작성' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateReview).toHaveBeenCalledWith(1, {
        rating: 5,
        comment: '정말 좋았어요!',
        visitedSeason: 'SUMMER',
      });
    });
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  test('제출 실패 시 에러 메시지 표시', async () => {
    mockCreateReview.mockRejectedValueOnce(new Error('리뷰 작성에 실패했습니다.'));

    render(<ReviewForm {...defaultProps} />);

    // 별점 선택
    const star5 = screen.getByTestId('star-btn-5');
    fireEvent.click(star5);

    // 제출
    const submitBtn = screen.getByRole('button', { name: '리뷰 작성' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('리뷰 작성에 실패했습니다.')).toBeInTheDocument();
    });
  });

  test('제출 중 버튼 비활성화', async () => {
    mockCreateReview.mockImplementation(() => new Promise(() => {})); // 무한 대기

    render(<ReviewForm {...defaultProps} />);

    // 별점 선택
    const star5 = screen.getByTestId('star-btn-5');
    fireEvent.click(star5);

    // 제출
    const submitBtn = screen.getByRole('button', { name: '리뷰 작성' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('작성 중...')).toBeInTheDocument();
    });
  });

  test('취소 버튼 동작', () => {
    render(<ReviewForm {...defaultProps} />);

    const cancelBtn = screen.getByText('취소');
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('닫기 버튼(X) 동작', () => {
    render(<ReviewForm {...defaultProps} />);

    const closeBtn = screen.getByTestId('close-btn');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('오버레이 클릭 시 닫기', () => {
    render(<ReviewForm {...defaultProps} />);

    const overlay = screen.getByTestId('review-form-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('모달 내부 클릭 시 닫히지 않음', () => {
    render(<ReviewForm {...defaultProps} />);

    const modal = screen.getByTestId('review-form-modal');
    fireEvent.click(modal);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('코멘트 없이 제출 가능', async () => {
    mockCreateReview.mockResolvedValueOnce({});

    render(<ReviewForm {...defaultProps} />);

    // 별점만 선택
    const star3 = screen.getByTestId('star-btn-3');
    fireEvent.click(star3);

    // 제출
    const submitBtn = screen.getByRole('button', { name: '리뷰 작성' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateReview).toHaveBeenCalledWith(1, {
        rating: 3,
        comment: undefined,
        visitedSeason: undefined,
      });
    });
  });

  test('모든 계절 버튼 표시', () => {
    render(<ReviewForm {...defaultProps} />);

    expect(screen.getByText('봄')).toBeInTheDocument();
    expect(screen.getByText('여름')).toBeInTheDocument();
    expect(screen.getByText('가을')).toBeInTheDocument();
    expect(screen.getByText('겨울')).toBeInTheDocument();
  });
});
