import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { authService } from './services/authService';

jest.mock('./services/authService', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    tryRestoreSession: jest.fn(),
  },
}));

jest.mock('./utils/analytics', () => ({
  trackPageView: jest.fn(),
}));

jest.mock('./components/NotificationCenter', () => () => <div>Notifications</div>);
jest.mock('./components/Tutorial', () => () => null);
jest.mock('./components/ThemeToggle', () => () => <button>Theme</button>);
jest.mock('./components/Logo', () => () => <span>Fryndo</span>);

jest.mock('./pages/Home', () => () => <div>Home Page</div>);
jest.mock('./pages/About', () => () => <div>About Page</div>);
jest.mock('./pages/Portfolio', () => () => <div>Portfolio Page</div>);
jest.mock('./pages/Login', () => () => <div>Login Page</div>);
jest.mock('./pages/Register', () => () => <div>Register Page</div>);
jest.mock('./pages/Dashboard', () => () => <div>Dashboard Page</div>);
jest.mock('./pages/Chat', () => () => <div>Chat Page</div>);
jest.mock('./pages/ChatList', () => () => <div>Chat List Page</div>);
jest.mock('./pages/Groups', () => () => <div>Groups Page</div>);
jest.mock('./pages/CreateGroup', () => () => <div>Create Group Page</div>);
jest.mock('./pages/Profile', () => () => <div>Profile Page</div>);
jest.mock('./pages/Leaderboard', () => () => <div>Leaderboard Page</div>);
jest.mock('./pages/AdminDashboard', () => () => <div>Admin Page</div>);
jest.mock('./pages/NotificationSettings', () => () => <div>Notification Settings Page</div>);
jest.mock('./pages/AIRecommendation', () => () => <div>AI Page</div>);
jest.mock('./pages/Matching', () => () => <div>Matching Page</div>);
jest.mock('./pages/Payment', () => () => <div>Payment Page</div>);
jest.mock('./pages/PaymentSuccess', () => () => <div>Payment Success Page</div>);
jest.mock('./pages/PaymentFail', () => () => <div>Payment Fail Page</div>);
jest.mock('./pages/Marketplace', () => () => <div>Marketplace Page</div>);
jest.mock('./pages/NFTMap', () => () => <div>NFT Map Page</div>);
jest.mock('./pages/NFTCollection', () => () => <div>NFT Collection Page</div>);
jest.mock('./pages/PointShop', () => () => <div>Point Shop Page</div>);
jest.mock('./pages/WalletConnect', () => () => <div>Wallet Connect Page</div>);

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const renderAt = (path: string, authenticated = true) => {
  mockedAuthService.isAuthenticated.mockReturnValue(authenticated);
  window.history.pushState({}, 'Test page', path);
  return render(<App />);
};

describe('App NFT and points routes', () => {
  const authenticatedRoutes = [
    ['/nft/map', 'NFT Map Page'],
    ['/nft/collection', 'NFT Collection Page'],
    ['/marketplace', 'Marketplace Page'],
    ['/points/shop', 'Point Shop Page'],
    ['/wallet', 'Wallet Connect Page'],
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each(authenticatedRoutes)('renders %s for authenticated users', async (path, pageText) => {
    renderAt(path);

    expect(await screen.findByText(pageText)).toBeInTheDocument();
  });

  it.each(authenticatedRoutes)('redirects %s to login for guests', async path => {
    renderAt(path, false);

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
  });

  it('exposes NFT, marketplace, point shop, and wallet links in the main layout', async () => {
    renderAt('/dashboard');

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /NFT 지도/i })).toHaveAttribute('href', '/nft/map');
    expect(screen.getByRole('link', { name: /내 NFT/i })).toHaveAttribute(
      'href',
      '/nft/collection'
    );
    expect(screen.getByRole('link', { name: /NFT 마켓/i })).toHaveAttribute('href', '/marketplace');
    expect(screen.getByRole('link', { name: /포인트 샵/i })).toHaveAttribute(
      'href',
      '/points/shop'
    );
    expect(screen.getByRole('link', { name: /지갑 연결/i })).toHaveAttribute('href', '/wallet');
  });
});
