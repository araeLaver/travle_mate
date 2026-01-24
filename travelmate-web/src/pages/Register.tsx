import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateCheck, setDuplicateCheck] = useState({
    email: { checked: false, available: false, loading: false },
    username: { checked: false, available: false, loading: false },
  });
  const [touched, setTouched] = useState({
    name: false,
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const validation = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    return {
      name: formData.name.length >= 2,
      username: usernameRegex.test(formData.username),
      email: emailRegex.test(formData.email),
      password: formData.password.length >= 8,
      confirmPassword:
        formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
    };
  }, [formData]);

  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (password.length === 0) return { level: 0, text: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, text: '약함', color: 'bg-red-500' };
    if (strength <= 4) return { level: 2, text: '보통', color: 'bg-amber-500' };
    return { level: 3, text: '강함', color: 'bg-green-500' };
  }, [formData.password]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
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
      setError('사용자명을 먼저 입력해주세요.');
      return;
    }

    setDuplicateCheck(prev => ({ ...prev, username: { ...prev.username, loading: true } }));

    try {
      const exists = await authService.checkNicknameDuplicate(formData.username);
      setDuplicateCheck(prev => ({
        ...prev,
        username: { checked: true, available: !exists, loading: false },
      }));
      setError(exists ? '이미 사용중인 사용자명입니다.' : '');
    } catch {
      setDuplicateCheck(prev => ({
        ...prev,
        username: { checked: false, available: false, loading: false },
      }));
      setError('사용자명 중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setTouched({
      name: true,
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!validation.name) {
      toast.warning('이름은 2자 이상 입력해주세요.');
      return;
    }
    if (!validation.username) {
      toast.warning('사용자명은 영문, 숫자, 밑줄만 사용 가능합니다 (3-20자).');
      return;
    }
    if (!validation.email) {
      toast.warning('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (!validation.password) {
      toast.warning('비밀번호는 8자 이상 입력해주세요.');
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
      toast.warning('사용자명 중복 확인을 해주세요.');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        nickname: formData.username,
        fullName: formData.name,
      });
      toast.success('회원가입이 완료되었습니다! 로그인해주세요.');
      navigate('/login');
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
              Join Fryndo
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
            {/* Name Field */}
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                이름
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  placeholder="실명을 입력하세요"
                  required
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
                    touched.name
                      ? validation.name
                        ? 'border-green-500'
                        : 'border-red-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
              </div>
              {touched.name && !validation.name && (
                <p className="mt-1 text-xs text-red-500">이름은 2자 이상 입력해주세요</p>
              )}
            </motion.div>

            {/* Username Field */}
            <motion.div {...fadeInUp} transition={{ delay: 0.15 }}>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                사용자명
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
                    placeholder="사용자명"
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
                <p className="mt-1 text-xs text-red-500">영문, 숫자, 밑줄만 사용 (3-20자)</p>
              )}
              {duplicateCheck.username.checked && duplicateCheck.username.available && (
                <p className="mt-1 text-xs text-green-500">사용 가능한 사용자명입니다</p>
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
                  placeholder="8자 이상의 비밀번호"
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

          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.4 }}
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
