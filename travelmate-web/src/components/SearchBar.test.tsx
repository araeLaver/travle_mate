import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from './SearchBar';
import * as hooks from '../hooks/useSearch';

jest.mock('../hooks/useSearch');
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (hooks.useQuickSearch as jest.Mock).mockReturnValue({
      data: null,
    });

    (hooks.useAutocomplete as jest.Mock).mockReturnValue({
      data: ['제주도 여행', '제주도 맛집 투어', '제주도 한라산'],
    });
  });

  test('검색바 렌더링', () => {
    render(<SearchBar />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('여행 그룹 검색...');
    expect(searchInput).toBeInTheDocument();

    const searchButton = screen.getByRole('button', { name: /검색/i });
    expect(searchButton).toBeInTheDocument();
  });

  test('검색어 입력 시 자동완성 표시', async () => {
    render(<SearchBar />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('여행 그룹 검색...');
    fireEvent.change(searchInput, { target: { value: '제주' } });

    await waitFor(() => {
      expect(screen.getByText('제주도 여행')).toBeInTheDocument();
      expect(screen.getByText('제주도 맛집 투어')).toBeInTheDocument();
      expect(screen.getByText('제주도 한라산')).toBeInTheDocument();
    });
  });

  test('자동완성 항목 클릭 시 페이지 이동', async () => {
    render(<SearchBar />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('여행 그룹 검색...');
    fireEvent.change(searchInput, { target: { value: '제주' } });

    await waitFor(() => {
      const suggestion = screen.getByText('제주도 여행');
      fireEvent.click(suggestion);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/search?q=' + encodeURIComponent('제주도 여행')
    );
  });

  test('Enter 키로 검색', () => {
    render(<SearchBar />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('여행 그룹 검색...');
    fireEvent.change(searchInput, { target: { value: '부산' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/search?q=' + encodeURIComponent('부산')
    );
  });

  test('검색 버튼 클릭', () => {
    render(<SearchBar />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('여행 그룹 검색...');
    fireEvent.change(searchInput, { target: { value: '서울' } });

    const searchButton = screen.getByRole('button', { name: /검색/i });
    fireEvent.click(searchButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/search?q=' + encodeURIComponent('서울')
    );
  });

  test('2글자 미만 검색어는 자동완성 표시 안함', async () => {
    (hooks.useAutocomplete as jest.Mock).mockReturnValue({
      data: [],
    });

    render(<SearchBar />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('여행 그룹 검색...');
    fireEvent.change(searchInput, { target: { value: '제' } });

    await waitFor(() => {
      expect(screen.queryByText('추천 검색어')).not.toBeInTheDocument();
    });
  });
});
