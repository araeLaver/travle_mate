import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
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

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!duplicateCheck.email.checked || !duplicateCheck.email.available) {
      setError('이메일 중복 확인을 해주세요.');
      return;
    }

    if (!duplicateCheck.username.checked || !duplicateCheck.username.available) {
      setError('사용자명 중복 확인을 해주세요.');
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
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
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
              placeholder="실명을 입력하세요"
              required
              autoComplete="name"
            />
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
                placeholder="사용자명을 입력하세요"
                required
                autoComplete="username"
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
                placeholder="your@email.com"
                required
                autoComplete="email"
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
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8자 이상의 비밀번호"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              required
              autoComplete="new-password"
            />
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
