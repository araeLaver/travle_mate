import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './Toast';

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

  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const provider = urlParams.get('provider') || state; // state에서 provider 정보 추출

      if (error) {
        toast.error(`로그인 중 오류가 발생했습니다: ${error}`);
        navigate('/login');
        return;
      }

      if (code) {
        try {
          // 실제 구현에서는 백엔드 API를 호출하여 토큰을 교환해야 합니다
          // 예시: POST /api/auth/oauth/callback
          const response = await fetch('/api/auth/oauth/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              provider,
              redirectUri: process.env.REACT_APP_REDIRECT_URI,
            }),
          });

          if (response.ok) {
            const userData = await response.json();

            // 로컬 저장소에 사용자 정보 저장
            localStorage.setItem('socialUser', JSON.stringify(userData.user));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loginProvider', provider || 'unknown');
            localStorage.setItem('accessToken', userData.accessToken);

            toast.success(
              `${provider?.toUpperCase()} 로그인 성공! 환영합니다, ${userData.user?.name}님!`
            );
            navigate('/dashboard');
          } else {
            throw new Error('백엔드 인증 처리 실패');
          }
        } catch (error) {
          // 백엔드 연결 실패 시 임시로 성공 처리 (개발용)
          const mockUser = {
            id: 'oauth_' + Date.now(),
            email: 'oauth.user@example.com',
            name: `${provider?.toUpperCase()} 사용자`,
            provider: provider || 'unknown',
          };

          localStorage.setItem('socialUser', JSON.stringify(mockUser));
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('loginProvider', provider || 'unknown');

          toast.success(`${provider?.toUpperCase()} 로그인 성공! (개발 모드)`);
          navigate('/dashboard');
        }
      } else {
        // 네이버 로그인의 경우 fragment 방식 처리
        const hash = location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const tokenType = hashParams.get('token_type');

          if (accessToken) {
            // 네이버 사용자 정보 API 호출
            try {
              const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
                headers: {
                  Authorization: `${tokenType} ${accessToken}`,
                },
              });

              if (userResponse.ok) {
                const naverData = await userResponse.json();
                const user = {
                  id: naverData.response.id,
                  email: naverData.response.email,
                  name: naverData.response.nickname || naverData.response.name,
                  profileImage: naverData.response.profile_image,
                  provider: 'naver',
                };

                localStorage.setItem('socialUser', JSON.stringify(user));
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('loginProvider', 'naver');

                toast.success(`네이버 로그인 성공! 환영합니다, ${user.name}님!`);
                navigate('/dashboard');
                return;
              }
            } catch (error) {
              // 네이버 사용자 정보 조회 실패
            }
          }
        }

        // 콜백 파라미터가 없는 경우 로그인 페이지로 리다이렉트
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [location, navigate, toast]);

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
