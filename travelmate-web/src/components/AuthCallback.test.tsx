import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthCallback from './AuthCallback';
import { authService } from '../services/authService';
import { createOAuthState } from '../services/oauthState';

const mockNavigate = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./Toast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

jest.mock('../services/authService', () => ({
  authService: {
    oauthCodeLogin: jest.fn(),
    oauthLogin: jest.fn(),
  },
}));

const renderCallback = (entry: string, strictMode = false) => {
  const tree = (
    <MemoryRouter initialEntries={[entry]}>
      <AuthCallback />
    </MemoryRouter>
  );

  return render(strictMode ? <React.StrictMode>{tree}</React.StrictMode> : tree);
};

describe('AuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('exchanges a valid one-time Naver state and authorization code', async () => {
    const state = createOAuthState('naver');
    (authService.oauthCodeLogin as jest.Mock).mockResolvedValue({});

    renderCallback(`/auth/callback?code=auth-code&state=${encodeURIComponent(state)}`, true);

    await waitFor(() => {
      expect(authService.oauthCodeLogin).toHaveBeenCalledTimes(1);
    });
    expect(authService.oauthCodeLogin).toHaveBeenCalledWith({
      provider: 'naver',
      code: 'auth-code',
      redirectUri: 'http://localhost/auth/callback',
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Naver 로그인 성공! 환영합니다!');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('uses a valid one-time state for implicit OAuth access tokens', async () => {
    const state = createOAuthState('google');
    (authService.oauthLogin as jest.Mock).mockResolvedValue({});

    renderCallback(`/auth/callback#access_token=google-token&state=${encodeURIComponent(state)}`);

    await waitFor(() => {
      expect(authService.oauthLogin).toHaveBeenCalledWith({
        provider: 'google',
        accessToken: 'google-token',
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('rejects callback requests without a stored state', async () => {
    renderCallback('/auth/callback?code=auth-code&state=naver');

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'OAuth 요청 상태를 확인할 수 없습니다. 다시 로그인해주세요.'
      );
    });
    expect(authService.oauthCodeLogin).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('rejects Google authorization code callbacks before calling the backend', async () => {
    const state = createOAuthState('google');

    renderCallback(`/auth/callback?code=auth-code&state=${encodeURIComponent(state)}`);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('지원하지 않는 OAuth 코드 로그인 제공자입니다.');
    });
    expect(authService.oauthCodeLogin).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
