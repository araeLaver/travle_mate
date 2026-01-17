import { render, screen, fireEvent } from '@testing-library/react';
import LocationMessage from './LocationMessage';

// window.open Mock
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('LocationMessage', () => {
  const mockProps = {
    latitude: 37.5665,
    longitude: 126.978,
    locationName: '서울시청',
    address: '서울특별시 중구 세종대로 110',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('위치 정보 렌더링', () => {
    render(<LocationMessage {...mockProps} />);

    expect(screen.getByText('서울시청')).toBeInTheDocument();
    expect(screen.getByText('서울특별시 중구 세종대로 110')).toBeInTheDocument();
  });

  test('좌표 표시', () => {
    render(<LocationMessage {...mockProps} />);

    expect(screen.getByText('37.566500, 126.978000')).toBeInTheDocument();
  });

  test('장소명 없을 때 기본 텍스트 표시', () => {
    render(
      <LocationMessage
        latitude={mockProps.latitude}
        longitude={mockProps.longitude}
      />
    );

    expect(screen.getByText('공유된 위치')).toBeInTheDocument();
  });

  test('정적 지도 이미지 URL 생성', () => {
    render(<LocationMessage {...mockProps} />);

    const mapImage = screen.getByAltText('위치 미리보기');
    expect(mapImage).toHaveAttribute(
      'src',
      expect.stringContaining('staticmap.openstreetmap.de')
    );
    expect(mapImage.getAttribute('src')).toContain('37.5665');
    expect(mapImage.getAttribute('src')).toContain('126.978');
  });

  test('내 메시지 스타일 적용', () => {
    render(<LocationMessage {...mockProps} isMyMessage={true} />);

    const container = screen.getByTestId('location-message-container');
    expect(container).toHaveClass('my-message');
  });

  test('Google Maps 버튼 클릭', () => {
    render(<LocationMessage {...mockProps} />);

    const googleBtn = screen.getByRole('button', { name: /Google/i });
    fireEvent.click(googleBtn);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps'),
      '_blank'
    );
  });

  test('네이버 지도 버튼 클릭', () => {
    render(<LocationMessage {...mockProps} />);

    const naverBtn = screen.getByRole('button', { name: /네이버/i });
    fireEvent.click(naverBtn);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('map.naver.com'),
      '_blank'
    );
  });

  test('카카오맵 버튼 클릭', () => {
    render(<LocationMessage {...mockProps} />);

    const kakaoBtn = screen.getByRole('button', { name: /카카오/i });
    fireEvent.click(kakaoBtn);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('map.kakao.com'),
      '_blank'
    );
  });

  test('지도 앱 버튼들 존재', () => {
    render(<LocationMessage {...mockProps} />);

    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('네이버')).toBeInTheDocument();
    expect(screen.getByText('카카오')).toBeInTheDocument();
  });

  test('카드 클릭 시 Google Maps 열기', () => {
    render(<LocationMessage {...mockProps} />);

    const container = screen.getByTestId('location-message-container');
    fireEvent.click(container);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps'),
      '_blank'
    );
  });

  test('주소 없을 때 주소 요소 미렌더링', () => {
    render(
      <LocationMessage
        latitude={mockProps.latitude}
        longitude={mockProps.longitude}
        locationName={mockProps.locationName}
      />
    );

    expect(screen.queryByTestId('location-address')).not.toBeInTheDocument();
  });

  test('지도 이미지 로드 실패 처리', () => {
    render(<LocationMessage {...mockProps} />);

    const mapImage = screen.getByAltText('위치 미리보기');
    fireEvent.error(mapImage);

    // 이미지가 숨겨지는지 확인
    expect(mapImage).toHaveStyle('display: none');
  });
});
