import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './Toast';
import { authService } from '../services/authService';

const LoadingIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '48px', height: '48px', animation: 'spin 1s linear infinite' }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const redirectUri = `${window.location.origin}/auth/callback`;

      // 1) Hash fragment 파싱 (implicit flow: #access_token=xxx&state=provider)
      const hash = location.hash.substring(1);
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const state = hashParams.get('state');

        if (accessToken && state) {
          try {
            await authService.oauthLogin({
              provider: state as 'google' | 'kakao' | 'naver',
              accessToken,
            });
            toast.success(
              `${state.charAt(0).toUpperCase() + state.slice(1)} 로그인 성공! 환영합니다!`
            );
            navigate('/dashboard');
          } catch (err) {
            const message = err instanceof Error ? err.message : 'OAuth 로그인에 실패했습니다.';
            setErrorMessage(message);
            toast.error(message);
            setTimeout(() => navigate('/login'), 3000);
          }
          return;
        }
      }

      // 2) Query parameter 파싱 (authorization code flow: ?code=xxx&state=provider)
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const provider = urlParams.get('provider') || state;

      if (error) {
        toast.error(`로그인 중 오류가 발생했습니다: ${error}`);
        navigate('/login');
        return;
      }

      if (code && provider) {
        try {
          // 백엔드에서 코드 → 토큰 교환 + 로그인 처리
          await authService.oauthCodeLogin({
            provider: provider as 'naver' | 'kakao',
            code,
            redirectUri,
          });

          toast.success(
            `${provider.charAt(0).toUpperCase() + provider.slice(1)} 로그인 성공! 환영합니다!`
          );
          navigate('/dashboard');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'OAuth 로그인에 실패했습니다.';
          setErrorMessage(message);
          toast.error(message);
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [location, navigate, toast]);

  if (errorMessage) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
          color: 'white',
        }}
      >
        <div style={{ marginBottom: '20px', color: '#f87171' }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '48px', height: '48px' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2>로그인 실패</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '10px' }}>{errorMessage}</p>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '20px', fontSize: '14px' }}>
          잠시 후 로그인 페이지로 이동합니다...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        color: 'white',
      }}
    >
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ marginBottom: '20px', color: '#a78bfa' }} aria-hidden="true">
        <LoadingIcon />
      </div>
      <h2>로그인 처리 중...</h2>
      <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>잠시만 기다려주세요.</p>
    </div>
  );
};

export default AuthCallback;
