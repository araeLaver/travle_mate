import React, { Component, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';
import { useKakaoSDK } from '../hooks/useKakaoSDK';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { trackEvent, trackSignUpComplete } from '../utils/analytics';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

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

const GoogleSignupButtonInner: React.FC<{
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
    onError: () => onError('Google 가입이 취소되었습니다.'),
  });

  return (
    <button
      type="button"
      onClick={() => handleLogin()}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      Google로 시작하기
    </button>
  );
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateCheck, setDuplicateCheck] = useState({
    email: { checked: false, available: false, loading: false },
    username: { checked: false, available: false, loading: false },
  });
  const [oauthLoading, setOauthLoading] = useState<'google' | 'kakao' | 'naver' | null>(null);
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const { login: kakaoLogin, isInitialized: isKakaoReady } = useKakaoSDK();

  // OAuth 공통 핸들러 (백엔드가 자동 가입 처리)
  const handleOAuthSuccess = useCallback(
    async (provider: 'google' | 'kakao' | 'naver', accessToken: string) => {
      setError('');
      try {
        await authService.oauthLogin({ provider, accessToken });
        trackEvent('sign_up', { method: provider });
        toast.success('가입이 완료되었습니다!');
        navigate('/dashboard');
      } catch (err) {
        logError(`Register.oauth.${provider}`, err);
        const errorMsg = getErrorMessage(err);
        toast.error(errorMsg);
        setError(errorMsg);
      } finally {
        setOauthLoading(null);
      }
    },
    [navigate, toast]
  );

  const handleKakaoSignup = useCallback(async () => {
    if (!isKakaoReady) {
      setError('카카오 로그인을 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setOauthLoading('kakao');
    try {
      const accessToken = await kakaoLogin();
      await handleOAuthSuccess('kakao', accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : '카카오 가입에 실패했습니다.');
      setOauthLoading(null);
    }
  }, [isKakaoReady, kakaoLogin, handleOAuthSuccess]);

  const handleNaverSignup = useCallback(() => {
    if (!NAVER_CLIENT_ID) {
      setError('네이버 로그인이 설정되지 않았습니다.');
      return;
    }
    setOauthLoading('naver');
    const state = 'naver';
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=token&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
    window.location.href = naverAuthUrl;
  }, []);

  const validation = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[가-힣a-zA-Z0-9_]{2,20}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    return {
      username: usernameRegex.test(formData.username),
      email: emailRegex.test(formData.email),
      password: passwordRegex.test(formData.password),
      confirmPassword:
        formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
    };
  }, [formData]);

  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (password.length === 0) return { level: 0, text: '', color: '' };

    let strength = 0;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    if (strength <= 1) return { level: 1, text: '약함', color: 'bg-red-500' };
    if (strength <= 3) return { level: 2, text: '보통', color: 'bg-amber-500' };
    return { level: 3, text: '강함', color: 'bg-green-500' };
  }, [formData.password]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email' && validation.email && !duplicateCheck.email.checked) {
      checkEmailDuplicate();
    } else if (field === 'username' && validation.username && !duplicateCheck.username.checked) {
      checkUsernameDuplicate();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'email') {
      setDuplicateCheck(prev => ({
        ...prev,
        email: { checked: false, available: false, loading: false },
      }));
    } else if (name === 'username') {
      setDuplicateCheck(prev => ({
        ...prev,
        username: { checked: false, available: false, loading: false },
      }));
    }
  };

  const checkEmailDuplicate = async () => {
    if (!formData.email) {
      setError('이메일을 먼저 입력해주세요.');
      return;
    }

    setDuplicateCheck(prev => ({ ...prev, email: { ...prev.email, loading: true } }));

    try {
      const exists = await authService.checkEmailDuplicate(formData.email);
      setDuplicateCheck(prev => ({
        ...prev,
        email: { checked: true, available: !exists, loading: false },
      }));
      setError(exists ? '이미 사용중인 이메일입니다.' : '');
    } catch {
      setDuplicateCheck(prev => ({
        ...prev,
        email: { checked: false, available: false, loading: false },
      }));
      setError('이메일 중복 확인 중 오류가 발생했습니다.');
    }
  };

  const checkUsernameDuplicate = async () => {
    if (!formData.username) {
      setError('닉네임을 먼저 입력해주세요.');
      return;
    }

    setDuplicateCheck(prev => ({ ...prev, username: { ...prev.username, loading: true } }));

    try {
      const exists = await authService.checkNicknameDuplicate(formData.username);
      setDuplicateCheck(prev => ({
        ...prev,
        username: { checked: true, available: !exists, loading: false },
      }));
      setError(exists ? '이미 사용중인 닉네임입니다.' : '');
    } catch {
      setDuplicateCheck(prev => ({
        ...prev,
        username: { checked: false, available: false, loading: false },
      }));
      setError('닉네임 중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!validation.username) {
      toast.warning('닉네임은 한글, 영문, 숫자, 밑줄만 사용 가능합니다 (2-20자).');
      return;
    }
    if (!validation.email) {
      toast.warning('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (!validation.password) {
      toast.warning('비밀번호는 영문 대소문자, 숫자, 특수문자를 포함해 8-20자로 입력해주세요.');
      return;
    }
    if (!validation.confirmPassword) {
      toast.warning('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!duplicateCheck.email.checked || !duplicateCheck.email.available) {
      toast.warning('이메일 중복 확인을 해주세요.');
      return;
    }
    if (!duplicateCheck.username.checked || !duplicateCheck.username.available) {
      toast.warning('닉네임 중복 확인을 해주세요.');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        nickname: formData.username,
      });
      trackEvent('sign_up', { method: 'email' });
      trackSignUpComplete();

      // 자동 로그인 시도
      try {
        await authService.login({ email: formData.email, password: formData.password });
        toast.success('회원가입이 완료되었습니다!');
        navigate('/dashboard');
      } catch (loginErr) {
        logError('Register.autoLogin', loginErr);
        toast.success('회원가입이 완료되었습니다! 로그인해주세요.');
        navigate('/login');
      }
    } catch (err) {
      logError('Register.handleSubmit', err);
      const errorMsg = getErrorMessage(err);
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const getCheckButtonStyle = (field: 'email' | 'username') => {
    const state = duplicateCheck[field];
    if (state.checked && state.available) return 'bg-green-500 hover:bg-green-600';
    if (state.checked && !state.available) return 'bg-red-500 hover:bg-red-600';
    return 'bg-violet-500 hover:bg-violet-600';
  };

  const getCheckButtonText = (field: 'email' | 'username') => {
    const state = duplicateCheck[field];
    if (state.loading) return '확인 중...';
    if (state.checked) return state.available ? '사용가능' : '중복됨';
    return '중복확인';
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-60 dark:opacity-40" />
      <div
        className="absolute top-20 right-10 w-72 h-72 bg-pink-400/30 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite' }}
      />
      <div
        className="absolute bottom-20 left-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite', animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl"
        style={{ animation: 'glow 4s infinite' }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-6xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
            <div className="flex items-center justify-between h-16 px-6">
              <Link to="/" className="flex items-center gap-3 group">
                <Logo
                  variant="gradient"
                  size="md"
                  className="group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Fryndo
                </span>
              </Link>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mt-24 mb-8"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl shadow-gray-200/50 dark:shadow-black/30 p-8 md:p-10">
          <motion.div {...fadeInUp} className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              회원가입
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              여행 동반자와 함께할 모험을 시작하세요
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6"
            >
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
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
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <motion.div {...fadeInUp} transition={{ delay: 0.15 }}>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                닉네임
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={() => handleBlur('username')}
                    placeholder="한글, 영문, 숫자 가능 (2-20자)"
                    required
                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
                      touched.username
                        ? validation.username
                          ? 'border-green-500'
                          : 'border-red-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={checkUsernameDuplicate}
                  disabled={!formData.username || duplicateCheck.username.loading}
                  className={`px-4 py-3 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getCheckButtonStyle('username')}`}
                >
                  {getCheckButtonText('username')}
                </button>
              </div>
              {touched.username && !validation.username && (
                <p className="mt-1 text-xs text-red-500">한글, 영문, 숫자, 밑줄만 사용 (2-20자)</p>
              )}
              {duplicateCheck.username.checked && duplicateCheck.username.available && (
                <p className="mt-1 text-xs text-green-500">사용 가능한 닉네임입니다</p>
              )}
            </motion.div>

            {/* Email Field */}
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                이메일
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    placeholder="your@email.com"
                    required
                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
                      touched.email
                        ? validation.email
                          ? 'border-green-500'
                          : 'border-red-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={checkEmailDuplicate}
                  disabled={!formData.email || duplicateCheck.email.loading}
                  className={`px-4 py-3 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getCheckButtonStyle('email')}`}
                >
                  {getCheckButtonText('email')}
                </button>
              </div>
              {touched.email && !validation.email && (
                <p className="mt-1 text-xs text-red-500">올바른 이메일 형식을 입력해주세요</p>
              )}
              {duplicateCheck.email.checked && duplicateCheck.email.available && (
                <p className="mt-1 text-xs text-green-500">사용 가능한 이메일입니다</p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div {...fadeInUp} transition={{ delay: 0.25 }}>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                비밀번호
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="영문 대소문자, 숫자, 특수문자 포함 8-20자"
                  required
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
                    touched.password
                      ? validation.password
                        ? 'border-green-500'
                        : 'border-red-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3].map(level => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          passwordStrength.level >= level
                            ? passwordStrength.color
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.level === 1
                        ? 'text-red-500'
                        : passwordStrength.level === 2
                          ? 'text-amber-500'
                          : 'text-green-500'
                    }`}
                  >
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
                    touched.confirmPassword && formData.confirmPassword
                      ? validation.confirmPassword
                        ? 'border-green-500'
                        : 'border-red-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              {touched.confirmPassword &&
                !validation.confirmPassword &&
                formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
                )}
              {validation.confirmPassword && formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-500">비밀번호가 일치합니다</p>
              )}
            </motion.div>

            <motion.button
              {...fadeInUp}
              transition={{ delay: 0.35 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
                  <span>가입 중...</span>
                </>
              ) : (
                <span>회원가입</span>
              )}
            </motion.button>
          </form>

          <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {GOOGLE_CLIENT_ID && (
                <GoogleButtonErrorBoundary>
                  <GoogleSignupButtonInner
                    disabled={oauthLoading !== null}
                    loading={oauthLoading === 'google'}
                    onLoginStart={() => setOauthLoading('google')}
                    onSuccess={accessToken => handleOAuthSuccess('google', accessToken)}
                    onError={setError}
                  />
                </GoogleButtonErrorBoundary>
              )}
              <button
                type="button"
                onClick={handleKakaoSignup}
                disabled={oauthLoading !== null}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#FEE500] rounded-xl text-[#3C1E1E] font-medium hover:bg-[#FDD835] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                      fill="#3C1E1E"
                      d="M12 3c-5.52 0-10 3.59-10 8 0 2.87 1.89 5.39 4.74 6.82-.21.78-.77 2.83-.88 3.27-.14.54.2.53.42.39.17-.11 2.74-1.86 3.85-2.62.62.09 1.25.14 1.87.14 5.52 0 10-3.59 10-8s-4.48-8-10-8z"
                    />
                  </svg>
                )}
                카카오로 시작하기
              </button>
              {NAVER_CLIENT_ID && (
                <button
                  type="button"
                  onClick={handleNaverSignup}
                  disabled={oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#03C75A] rounded-xl text-white font-medium hover:bg-[#02b351] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  네이버로 시작하기
                </button>
              )}
            </div>
          </motion.div>

          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.45 }}
            className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
          >
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              로그인
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
