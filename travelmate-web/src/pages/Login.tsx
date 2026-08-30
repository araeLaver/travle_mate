import React, { Component, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';
import { createOAuthState } from '../services/oauthState';
import { useKakaoSDK } from '../hooks/useKakaoSDK';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { trackEvent, trackLoginSuccess } from '../utils/analytics';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

// useGoogleLogin 크래시 시 Login 전체가 깨지지 않도록 별도 컴포넌트 + ErrorBoundary로 격리
class GoogleButtonErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

const GoogleLoginButtonInner: React.FC<{
  disabled: boolean;
  loading: boolean;
  onLoginStart: () => void;
  onSuccess: (accessToken: string) => void;
  onError: (msg: string) => void;
}> = ({ disabled, loading, onLoginStart, onSuccess, onError }) => {
  const handleLogin = useGoogleLogin({
    onSuccess: tokenResponse => {
      onLoginStart();
      onSuccess(tokenResponse.access_token);
    },
    onError: () => onError('Google 로그인이 취소되었습니다.'),
  });

  return (
    <button
      type="button"
      onClick={() => handleLogin()}
      disabled={disabled}
      className="w-full h-14 flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-[1.5px] border-sand-400 dark:border-gray-700 rounded-[15px] text-ink dark:text-gray-200 font-bold hover:bg-sand-50 dark:hover:bg-gray-750 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      Google로 계속하기
    </button>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'kakao' | 'naver' | null>(null);
  const [error, setError] = useState('');

  const { login: kakaoLogin, isInitialized: isKakaoReady } = useKakaoSDK();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        await authService.login({ email, password });
        trackEvent('login', { method: 'email' });
        trackLoginSuccess();
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        navigate('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [email, password, rememberMe, navigate]
  );

  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Google OAuth - 콜백 핸들러 (별도 컴포넌트에서 호출)
  const handleGoogleSuccess = useCallback(
    async (accessToken: string) => {
      setError('');
      try {
        await authService.oauthLogin({ provider: 'google', accessToken });
        navigate('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.');
      } finally {
        setOauthLoading(null);
      }
    },
    [navigate]
  );

  // Kakao OAuth Handler
  const handleKakaoLogin = useCallback(async () => {
    if (!isKakaoReady) {
      setError('카카오 로그인을 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setOauthLoading('kakao');
    setError('');
    try {
      const accessToken = await kakaoLogin();
      await authService.oauthLogin({
        provider: 'kakao',
        accessToken,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '카카오 로그인에 실패했습니다.');
    } finally {
      setOauthLoading(null);
    }
  }, [isKakaoReady, kakaoLogin, navigate]);

  // Naver OAuth Handler (URL Redirect 방식)
  const handleNaverLogin = useCallback(() => {
    if (!NAVER_CLIENT_ID) {
      setError('네이버 로그인이 설정되지 않았습니다.');
      return;
    }
    setOauthLoading('naver');
    try {
      const state = createOAuthState('naver');
      const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(state)}`;
      window.location.href = naverAuthUrl;
    } catch {
      setOauthLoading(null);
      setError('네이버 로그인을 시작할 수 없습니다. 브라우저 저장소 설정을 확인해주세요.');
    }
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0a0a0b]">
      {/* Left photo panel */}
      <div className="relative hidden lg:flex lg:w-[46%] flex-col justify-between p-12 overflow-hidden bg-ink bg-[linear-gradient(160deg,#2A1BC7_0%,#4A3AFF_55%,#101014_130%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(at 80% 15%, rgba(142,123,255,0.5) 0px, transparent 45%), radial-gradient(at 15% 85%, rgba(16,16,20,0.6) 0px, transparent 55%)',
          }}
        />
        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit">
          <Logo variant="white" size="md" />
          <span className="text-xl font-extrabold text-white tracking-tight">Fryndo</span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-[44px] leading-[1.15] text-white">여행을 수집하다</h2>
        </div>

        {/* Floating NFT card */}
        <div className="relative z-10 self-end w-[260px] bg-white rounded-2xl border-2 border-rarity-legendary p-3 shadow-[0_10px_30px_rgba(16,16,20,0.3)]">
          <div className="h-32 rounded-xl bg-[linear-gradient(135deg,#ECEBFF_0%,#F5F4F1_60%,#FDF3E4_100%)] flex items-center justify-center">
            <Logo variant="gradient" size="lg" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-extrabold text-ink">Fryndo Stamp</span>
            <span className="h-5 px-1.5 inline-flex items-center rounded-[7px] bg-rarity-legendary text-white text-[10px] font-extrabold uppercase tracking-wide">
              Legendary
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#8A8A95]">Fryndo · Collectible</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex-1 flex flex-col bg-sand-50 dark:bg-[#0a0a0b]">
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Logo variant="gradient" size="sm" />
            <span className="font-extrabold text-ink dark:text-white tracking-tight">Fryndo</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/register"
              className="h-[42px] px-5 inline-flex items-center text-sm font-bold text-ink dark:text-gray-900 bg-sand-200 dark:bg-white rounded-xl hover:bg-sand-300 dark:hover:bg-gray-100 transition-all"
            >
              회원가입
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[440px]"
          >
            <div className="bg-white dark:bg-gray-900 rounded-[20px] p-8 md:p-10 shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:border dark:border-gray-800">
              <motion.div {...fadeInUp} className="mb-8">
                <h1 className="text-[30px] font-extrabold tracking-tight text-ink dark:text-white mb-2">
                  로그인
                </h1>
                <p className="text-[#4A4A55] dark:text-gray-400">여행 동반자와 다시 만나보세요</p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-[#FBF0EF] dark:bg-red-900/20 border border-[#F0D6D3] dark:border-red-800 rounded-[13px] mb-6"
                >
                  <svg
                    className="w-5 h-5 text-danger"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-danger dark:text-red-400">{error}</span>
                </motion.div>
              )}

              {/* Social login */}
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="space-y-3">
                {GOOGLE_CLIENT_ID && (
                  <GoogleButtonErrorBoundary>
                    <GoogleLoginButtonInner
                      disabled={oauthLoading !== null}
                      loading={oauthLoading === 'google'}
                      onLoginStart={() => setOauthLoading('google')}
                      onSuccess={handleGoogleSuccess}
                      onError={setError}
                    />
                  </GoogleButtonErrorBoundary>
                )}
                <button
                  type="button"
                  onClick={handleKakaoLogin}
                  disabled={oauthLoading !== null}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-[#FEE500] rounded-[15px] text-[#191600] font-bold hover:bg-[#FDD835] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {oauthLoading === 'kakao' ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#191600"
                        d="M12 3c-5.52 0-10 3.59-10 8 0 2.87 1.89 5.39 4.74 6.82-.21.78-.77 2.83-.88 3.27-.14.54.2.53.42.39.17-.11 2.74-1.86 3.85-2.62.62.09 1.25.14 1.87.14 5.52 0 10-3.59 10-8s-4.48-8-10-8z"
                      />
                    </svg>
                  )}
                  카카오로 계속하기
                </button>
                {NAVER_CLIENT_ID && (
                  <button
                    type="button"
                    onClick={handleNaverLogin}
                    disabled={oauthLoading !== null}
                    className="w-full h-14 flex items-center justify-center gap-3 bg-[#03C75A] rounded-[15px] text-white font-bold hover:bg-[#02b351] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {oauthLoading === 'naver' ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="white"
                          d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"
                          transform="scale(0.8) translate(3, 3)"
                        />
                      </svg>
                    )}
                    네이버로 계속하기
                  </button>
                )}
              </motion.div>

              {/* Divider */}
              <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#F2F1ED] dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs font-bold tracking-wider">
                  <span className="px-4 bg-white dark:bg-gray-900 text-[#9A9AA4]">또는 이메일</span>
                </div>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div {...fadeInUp} transition={{ delay: 0.25 }}>
                  <label
                    htmlFor="email"
                    className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-2"
                  >
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    className="w-full h-12 px-4 bg-sand-100 dark:bg-gray-800 border-[1.5px] border-transparent dark:border-gray-700 rounded-[13px] text-ink dark:text-white placeholder-[#9A9AA4] focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 transition-all"
                  />
                </motion.div>

                <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
                  <label
                    htmlFor="password"
                    className="block text-xs font-extrabold text-[#8A8A95] tracking-wider mb-2"
                  >
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      required
                      autoComplete="current-password"
                      className="w-full h-12 pl-4 pr-12 bg-sand-100 dark:bg-gray-800 border-[1.5px] border-transparent dark:border-gray-700 rounded-[13px] text-ink dark:text-white placeholder-[#9A9AA4] focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9AA4] hover:text-ink dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  {...fadeInUp}
                  transition={{ delay: 0.35 }}
                  className="flex items-center justify-between"
                >
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="sr-only peer"
                        aria-label="로그인 상태 유지"
                      />
                      <div className="w-5 h-5 bg-sand-100 dark:bg-gray-700 border-2 border-sand-400 dark:border-gray-600 rounded-md peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all">
                        <svg
                          className="w-full h-full text-white opacity-0 peer-checked:opacity-100 p-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-[#4A4A55] dark:text-gray-400 group-hover:text-ink dark:group-hover:text-gray-200 transition-colors">
                      로그인 상태 유지
                    </span>
                  </label>
                  <span
                    title="준비 중입니다"
                    className="text-sm font-medium text-[#9A9AA4] dark:text-gray-500 cursor-not-allowed"
                  >
                    비밀번호 찾기
                  </span>
                </motion.div>

                <motion.button
                  {...fadeInUp}
                  transition={{ delay: 0.4 }}
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-primary-500 text-white font-extrabold rounded-[15px] hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_8px_22px_rgba(74,58,255,0.3)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>로그인 중...</span>
                    </>
                  ) : (
                    <span>로그인</span>
                  )}
                </motion.button>
              </form>

              <motion.p
                {...fadeInUp}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center text-sm text-[#74747F] dark:text-gray-400"
              >
                계정이 없으신가요?{' '}
                <Link
                  to="/register"
                  className="font-bold text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  회원가입
                </Link>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
