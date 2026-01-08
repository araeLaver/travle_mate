import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import './Auth.css';

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

  // 실시간 유효성 검사
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

    if (strength <= 2) return { level: 1, text: '약함', color: '#ef4444' };
    if (strength <= 4) return { level: 2, text: '보통', color: '#f59e0b' };
    return { level: 3, text: '강함', color: '#22c55e' };
  }, [formData.password]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

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

    setDuplicateCheck(prev => ({
      ...prev,
      email: { ...prev.email, loading: true },
    }));

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

    setDuplicateCheck(prev => ({
      ...prev,
      username: { ...prev.username, loading: true },
    }));

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

    // 모든 필드 터치 처리
    setTouched({
      name: true,
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // 유효성 검사
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

  const getCheckButtonClass = (field: 'email' | 'username') => {
    const state = duplicateCheck[field];
    if (state.checked) {
      return state.available ? 'check-btn available' : 'check-btn unavailable';
    }
    return 'check-btn';
  };

  const getCheckButtonText = (field: 'email' | 'username') => {
    const state = duplicateCheck[field];
    if (state.loading) return '확인 중...';
    if (state.checked) return state.available ? '사용가능' : '중복됨';
    return '중복확인';
  };

  // Icon components
  const UserIcon = () => (
    <svg
      className="input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const AtSignIcon = () => (
    <svg
      className="input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );

  const MailIcon = () => (
    <svg
      className="input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );

  const LockIcon = () => (
    <svg
      className="input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  const EyeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className="auth-container">
      {/* Animated Background Blobs */}
      <div className="blob-1" aria-hidden="true" />
      <div className="blob-2" aria-hidden="true" />
      <div className="blob-3" aria-hidden="true" />

      <main className="auth-card">
        <header className="auth-header">
          <h1>TravelMate</h1>
          <h2>Join Us</h2>
          <p>여행 동반자와 함께할 모험을 시작하세요</p>
        </header>

        {error && (
          <div className="auth-error" role="alert" aria-live="assertive">
            <svg
              className="error-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" aria-label="회원가입 양식" noValidate>
          <div className="form-group">
            <label htmlFor="name">
              이름 <span className="sr-only">(필수)</span>
            </label>
            <div className="input-wrapper">
              <UserIcon />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                placeholder="실명을 입력하세요"
                required
                aria-required="true"
                autoComplete="name"
                className={touched.name ? (validation.name ? 'valid' : 'invalid') : ''}
                aria-invalid={touched.name && !validation.name}
                aria-describedby={touched.name && !validation.name ? 'name-error' : undefined}
              />
            </div>
            {touched.name && !validation.name && (
              <span id="name-error" className="validation-message error" role="alert">
                이름은 2자 이상 입력해주세요
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="username">
              사용자명 <span className="sr-only">(필수)</span>
            </label>
            <div className="input-with-button">
              <div className="input-wrapper">
                <AtSignIcon />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={() => handleBlur('username')}
                  placeholder="사용자명을 입력하세요"
                  required
                  aria-required="true"
                  autoComplete="username"
                  className={touched.username ? (validation.username ? 'valid' : 'invalid') : ''}
                  aria-invalid={touched.username && !validation.username}
                  aria-describedby="username-hint username-status"
                />
              </div>
              <button
                type="button"
                className={getCheckButtonClass('username')}
                onClick={checkUsernameDuplicate}
                disabled={!formData.username || duplicateCheck.username.loading}
                aria-busy={duplicateCheck.username.loading}
                aria-label={`사용자명 중복확인 ${duplicateCheck.username.checked ? (duplicateCheck.username.available ? '사용 가능' : '중복됨') : ''}`}
              >
                {duplicateCheck.username.loading && (
                  <span className="spinner small" aria-hidden="true" />
                )}
                {getCheckButtonText('username')}
              </button>
            </div>
            <span id="username-hint" className="sr-only">
              영문, 숫자, 밑줄만 사용 가능 (3-20자)
            </span>
            {touched.username && !validation.username && (
              <span id="username-status" className="validation-message error" role="alert">
                영문, 숫자, 밑줄만 사용 (3-20자)
              </span>
            )}
            {duplicateCheck.username.checked && duplicateCheck.username.available && (
              <span
                id="username-status"
                className="validation-message success"
                role="status"
                aria-live="polite"
              >
                사용 가능한 사용자명입니다
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              이메일 <span className="sr-only">(필수)</span>
            </label>
            <div className="input-with-button">
              <div className="input-wrapper">
                <MailIcon />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="your@email.com"
                  required
                  aria-required="true"
                  autoComplete="email"
                  className={touched.email ? (validation.email ? 'valid' : 'invalid') : ''}
                  aria-invalid={touched.email && !validation.email}
                  aria-describedby="email-status"
                />
              </div>
              <button
                type="button"
                className={getCheckButtonClass('email')}
                onClick={checkEmailDuplicate}
                disabled={!formData.email || duplicateCheck.email.loading}
                aria-busy={duplicateCheck.email.loading}
                aria-label={`이메일 중복확인 ${duplicateCheck.email.checked ? (duplicateCheck.email.available ? '사용 가능' : '중복됨') : ''}`}
              >
                {duplicateCheck.email.loading && (
                  <span className="spinner small" aria-hidden="true" />
                )}
                {getCheckButtonText('email')}
              </button>
            </div>
            {touched.email && !validation.email && (
              <span id="email-status" className="validation-message error" role="alert">
                올바른 이메일 형식을 입력해주세요
              </span>
            )}
            {duplicateCheck.email.checked && duplicateCheck.email.available && (
              <span
                id="email-status"
                className="validation-message success"
                role="status"
                aria-live="polite"
              >
                사용 가능한 이메일입니다
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              비밀번호 <span className="sr-only">(필수)</span>
            </label>
            <div className="input-wrapper">
              <LockIcon />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="8자 이상의 비밀번호"
                required
                aria-required="true"
                minLength={8}
                autoComplete="new-password"
                className={touched.password ? (validation.password ? 'valid' : 'invalid') : ''}
                aria-invalid={touched.password && !validation.password}
                aria-describedby="password-strength password-error"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {formData.password && (
              <div
                className="password-strength"
                id="password-strength"
                role="status"
                aria-live="polite"
              >
                <div className="strength-bars" aria-hidden="true">
                  <div
                    className={`strength-bar ${passwordStrength.level >= 1 ? 'active' : ''}`}
                    style={{
                      backgroundColor:
                        passwordStrength.level >= 1 ? passwordStrength.color : undefined,
                    }}
                  />
                  <div
                    className={`strength-bar ${passwordStrength.level >= 2 ? 'active' : ''}`}
                    style={{
                      backgroundColor:
                        passwordStrength.level >= 2 ? passwordStrength.color : undefined,
                    }}
                  />
                  <div
                    className={`strength-bar ${passwordStrength.level >= 3 ? 'active' : ''}`}
                    style={{
                      backgroundColor:
                        passwordStrength.level >= 3 ? passwordStrength.color : undefined,
                    }}
                  />
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  비밀번호 강도: {passwordStrength.text}
                </span>
              </div>
            )}
            {touched.password && !validation.password && (
              <span id="password-error" className="validation-message error" role="alert">
                비밀번호는 8자 이상 입력해주세요
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              비밀번호 확인 <span className="sr-only">(필수)</span>
            </label>
            <div className="input-wrapper">
              <LockIcon />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="비밀번호를 다시 입력하세요"
                required
                aria-required="true"
                autoComplete="new-password"
                className={
                  touched.confirmPassword ? (validation.confirmPassword ? 'valid' : 'invalid') : ''
                }
                aria-invalid={
                  touched.confirmPassword &&
                  !validation.confirmPassword &&
                  !!formData.confirmPassword
                }
                aria-describedby="confirm-password-status"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {touched.confirmPassword && !validation.confirmPassword && formData.confirmPassword && (
              <span id="confirm-password-status" className="validation-message error" role="alert">
                비밀번호가 일치하지 않습니다
              </span>
            )}
            {validation.confirmPassword && formData.confirmPassword && (
              <span
                id="confirm-password-status"
                className="validation-message success"
                role="status"
                aria-live="polite"
              >
                비밀번호가 일치합니다
              </span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>가입 중...</span>
              </>
            ) : (
              <span>회원가입</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Register;
