import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageMessage from './ImageMessage';

describe('ImageMessage', () => {
  const mockImageUrl = 'https://example.com/image.jpg';
  const mockThumbnailUrl = 'https://example.com/thumbnail.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('이미지 렌더링', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockImageUrl);
  });

  test('썸네일 URL이 있으면 썸네일 표시', () => {
    render(<ImageMessage imageUrl={mockImageUrl} thumbnailUrl={mockThumbnailUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    expect(image).toHaveAttribute('src', mockThumbnailUrl);
  });

  test('커스텀 alt 텍스트 적용', () => {
    render(<ImageMessage imageUrl={mockImageUrl} alt="커스텀 설명" />);

    const image = screen.getByAltText('커스텀 설명');
    expect(image).toBeInTheDocument();
  });

  test('내 메시지 스타일 적용', () => {
    render(<ImageMessage imageUrl={mockImageUrl} isMyMessage={true} />);

    const container = screen.getByTestId('image-message-container');
    expect(container).toHaveClass('my-message');
  });

  test('로딩 중 로딩 스피너 표시', () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const loading = screen.getByTestId('image-loading');
    expect(loading).toBeInTheDocument();
  });

  test('이미지 로드 완료 시 로딩 숨김', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    fireEvent.load(image);

    await waitFor(() => {
      expect(screen.queryByTestId('image-loading')).not.toBeInTheDocument();
    });
  });

  test('이미지 로드 실패 시 에러 UI 표시', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.getByText('이미지를 불러올 수 없습니다')).toBeInTheDocument();
    });
  });

  test('이미지 클릭 시 모달 열기', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    fireEvent.load(image);

    const container = screen.getByTestId('image-message-container');
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.getByTestId('image-modal-overlay')).toBeInTheDocument();
    });
  });

  test('모달에서 원본 이미지 표시', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} thumbnailUrl={mockThumbnailUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    fireEvent.load(image);

    const container = screen.getByTestId('image-message-container');
    fireEvent.click(container);

    await waitFor(() => {
      const modalImage = screen.getByTestId('modal-image');
      expect(modalImage).toHaveAttribute('src', mockImageUrl);
    });
  });

  test('모달 닫기 버튼 동작', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    fireEvent.load(image);

    const container = screen.getByTestId('image-message-container');
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.getByTestId('modal-close-btn')).toBeInTheDocument();
    });

    const closeBtn = screen.getByTestId('modal-close-btn');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('image-modal-overlay')).not.toBeInTheDocument();
    });
  });

  test('오버레이 클릭 시 모달 닫기', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    fireEvent.load(image);

    const container = screen.getByTestId('image-message-container');
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.getByTestId('image-modal-overlay')).toBeInTheDocument();
    });

    const overlay = screen.getByTestId('image-modal-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByTestId('image-modal-overlay')).not.toBeInTheDocument();
    });
  });

  test('에러 상태에서는 모달 열지 않음', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    fireEvent.error(image);

    const container = screen.getByTestId('image-message-container');
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.queryByTestId('image-modal-overlay')).not.toBeInTheDocument();
    });
  });

  test('다운로드 버튼 존재', async () => {
    render(<ImageMessage imageUrl={mockImageUrl} />);

    const image = screen.getByAltText('이미지 메시지');
    fireEvent.load(image);

    const container = screen.getByTestId('image-message-container');
    fireEvent.click(container);

    await waitFor(() => {
      expect(screen.getByTestId('modal-download-btn')).toBeInTheDocument();
    });
  });
});
