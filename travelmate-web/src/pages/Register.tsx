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
    } catch (error) {
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
    } catch (error) {
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

  return (
    <div className="auth-container">
      {/* Animated Background Blobs */}
      <div className="blob-1" />
      <div className="blob-2" />
      <div className="blob-3" />

      <div className="auth-card">
        <div className="auth-header">
          <h1>TravelMate</h1>
          <h2>Join Us</h2>
          <p>여행 동반자와 함께할 모험을 시작하세요</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              placeholder="실명을 입력하세요"
              required
              autoComplete="name"
              className={touched.name ? (validation.name ? 'valid' : 'invalid') : ''}
            />
            {touched.name && !validation.name && (
              <span className="validation-message error">이름은 2자 이상 입력해주세요</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="username">사용자명</label>
            <div className="input-with-button">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                placeholder="사용자명을 입력하세요"
                required
                autoComplete="username"
                className={touched.username ? (validation.username ? 'valid' : 'invalid') : ''}
              />
              <button
                type="button"
                className={getCheckButtonClass('username')}
                onClick={checkUsernameDuplicate}
                disabled={!formData.username || duplicateCheck.username.loading}
              >
                {getCheckButtonText('username')}
              </button>
            </div>
            {touched.username && !validation.username && (
              <span className="validation-message error">영문, 숫자, 밑줄만 사용 (3-20자)</span>
            )}
            {duplicateCheck.username.checked && duplicateCheck.username.available && (
              <span className="validation-message success">사용 가능한 사용자명입니다</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <div className="input-with-button">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className={touched.email ? (validation.email ? 'valid' : 'invalid') : ''}
              />
              <button
                type="button"
                className={getCheckButtonClass('email')}
                onClick={checkEmailDuplicate}
                disabled={!formData.email || duplicateCheck.email.loading}
              >
                {getCheckButtonText('email')}
              </button>
            </div>
            {touched.email && !validation.email && (
              <span className="validation-message error">올바른 이메일 형식을 입력해주세요</span>
            )}
            {duplicateCheck.email.checked && duplicateCheck.email.available && (
              <span className="validation-message success">사용 가능한 이메일입니다</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              placeholder="8자 이상의 비밀번호"
              required
              minLength={8}
              autoComplete="new-password"
              className={touched.password ? (validation.password ? 'valid' : 'invalid') : ''}
            />
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bars">
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
                  {passwordStrength.text}
                </span>
              </div>
            )}
            {touched.password && !validation.password && (
              <span className="validation-message error">비밀번호는 8자 이상 입력해주세요</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="비밀번호를 다시 입력하세요"
              required
              autoComplete="new-password"
              className={
                touched.confirmPassword ? (validation.confirmPassword ? 'valid' : 'invalid') : ''
              }
            />
            {touched.confirmPassword && !validation.confirmPassword && formData.confirmPassword && (
              <span className="validation-message error">비밀번호가 일치하지 않습니다</span>
            )}
            {validation.confirmPassword && formData.confirmPassword && (
              <span className="validation-message success">비밀번호가 일치합니다</span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
