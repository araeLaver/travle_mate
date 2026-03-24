import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

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
    AnimatePresence: ({ children }: { children: unknown }) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    oauthLogin: jest.fn(),
  },
}));

jest.mock('@react-oauth/google', () => ({
  useGoogleLogin: (opts: { onSuccess: (arg: { access_token: string }) => void }) => () =>
    opts.onSuccess({ access_token: 'mock-token' }),
}));

jest.mock('../hooks/useKakaoSDK', () => ({
  useKakaoSDK: () => ({
    login: jest.fn().mockResolvedValue('kakao-token'),
    isInitialized: true,
  }),
}));

jest.mock('../components/Logo', () => () => <div data-testid="logo">Logo</div>);
jest.mock('../components/ThemeToggle', () => () => (
  <div data-testid="theme-toggle">ThemeToggle</div>
));

jest.mock('../utils/analytics', () => ({
  trackEvent: jest.fn(),
  trackLoginSuccess: jest.fn(),
  trackSignUpComplete: jest.fn(),
  trackChatMessageSent: jest.fn(),
  trackMatchRequestSent: jest.fn(),
  trackMatchRecommendationViewed: jest.fn(),
}));

// eslint-disable-next-line import/first
import { authService } from '../services/authService';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form with email and password fields', () => {
    renderLogin();

    expect(screen.getAllByText('로그인').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  test('renders social login buttons', () => {
    renderLogin();

    // Kakao button is always rendered
    expect(screen.getByText('카카오로 계속하기')).toBeInTheDocument();
    // Google and Naver buttons are conditionally rendered based on env vars;
    // they may not appear in test environments — verified via snapshot/separate env test
  });

  test('renders register link', () => {
    renderLogin();
    // Use getAllByText since '회원가입' may appear in multiple places (e.g. button + link)
    expect(screen.getAllByText('회원가입').length).toBeGreaterThanOrEqual(1);
  });

  test('submits form with email and password', async () => {
    (authService.login as jest.Mock).mockResolvedValue({});
    renderLogin();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays error on login failure', async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error('잘못된 자격 증명'));
    renderLogin();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('잘못된 자격 증명')).toBeInTheDocument();
  });

  test('shows loading state during submission', async () => {
    (authService.login as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    renderLogin();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('로그인 중...')).toBeInTheDocument();
  });

  test('remembers email when rememberMe is checked', async () => {
    (authService.login as jest.Mock).mockResolvedValue({});
    renderLogin();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });

    // The checkbox is sr-only, find by its nearby label text
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(localStorage.getItem('rememberEmail')).toBe('test@example.com');
    });
  });

  test('loads remembered email on mount', () => {
    localStorage.setItem('rememberEmail', 'saved@example.com');
    renderLogin();

    expect(screen.getByLabelText('이메일')).toHaveValue('saved@example.com');
  });

  test('toggles password visibility', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText('비밀번호');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find the visibility toggle button - the only button without visible text
    const allButtons = screen.getAllByRole('button');
    const visibilityToggle = allButtons.find(btn => {
      const text = btn.textContent?.trim() ?? '';
      return text === '';
    });

    expect(visibilityToggle).toBeDefined();
    fireEvent.click(visibilityToggle!);
    // After clicking, verify the type changes (re-query to get fresh state)
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'text');
  });
});
