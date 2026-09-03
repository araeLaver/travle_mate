import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

  it('renders the 404 code and message', () => {
    renderPage();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('페이지를 찾을 수 없습니다')).toBeInTheDocument();
  });

  it('offers a link back to home', () => {
    renderPage();
    const homeLink = screen.getByRole('link', { name: '홈으로 돌아가기' });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
