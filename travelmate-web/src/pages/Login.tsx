import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
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
          <h2>Welcome Back</h2>
          <p>여행 동반자와 다시 만나보세요</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span>로그인 중...</span> : <span>로그인</span>}
          </button>
        </form>

        <div className="auth-divider">
          <span>또는</span>
        </div>

        <div className="social-login">
          <button className="social-btn google" type="button" disabled>
            <span>G</span>
            <span>Google로 계속하기</span>
          </button>
          <button className="social-btn kakao" type="button" disabled>
            <span>K</span>
            <span>카카오로 계속하기</span>
          </button>
        </div>

        <div className="auth-footer">
          <p>
            계정이 없으신가요? <Link to="/register">회원가입</Link>
          </p>
          <p>
            <Link to="/forgot-password">비밀번호를 잊으셨나요?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
