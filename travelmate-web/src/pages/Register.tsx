import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { realSocialLoginService } from '../services/realSocialLoginService';
import { authService } from '../services/authService';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState({
    email: { checked: false, available: false, loading: false },
    username: { checked: false, available: false, loading: false }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Reset duplicate check when field changes
    if (name === 'email') {
      setDuplicateCheck(prev => ({
        ...prev,
        email: { checked: false, available: false, loading: false }
      }));
    } else if (name === 'username') {
      setDuplicateCheck(prev => ({
        ...prev,
        username: { checked: false, available: false, loading: false }
      }));
    }
  };

  const checkEmailDuplicate = async () => {
    if (!formData.email) {
      alert('이메일을 먼저 입력해주세요.');
      return;
    }

    setDuplicateCheck(prev => ({
      ...prev,
      email: { ...prev.email, loading: true }
    }));

    try {
      const exists = await authService.checkEmailDuplicate(formData.email);
      setDuplicateCheck(prev => ({
        ...prev,
        email: { checked: true, available: !exists, loading: false }
      }));

      if (exists) {
        alert('❌ 이미 사용중인 이메일입니다.');
      } else {
        alert('✅ 사용 가능한 이메일입니다.');
      }
    } catch (error) {
      console.error('Email duplicate check failed:', error);
      setDuplicateCheck(prev => ({
        ...prev,
        email: { checked: false, available: false, loading: false }
      }));
      alert('이메일 중복 확인 중 오류가 발생했습니다.');
    }
  };

  const checkUsernameDuplicate = async () => {
    if (!formData.username) {
      alert('사용자명을 먼저 입력해주세요.');
      return;
    }

    setDuplicateCheck(prev => ({
      ...prev,
      username: { ...prev.username, loading: true }
    }));

    try {
      const exists = await authService.checkNicknameDuplicate(formData.username);
      setDuplicateCheck(prev => ({
        ...prev,
        username: { checked: true, available: !exists, loading: false }
      }));

      if (exists) {
        alert('❌ 이미 사용중인 사용자명입니다.');
      } else {
        alert('✅ 사용 가능한 사용자명입니다.');
      }
    } catch (error) {
      console.error('Username duplicate check failed:', error);
      setDuplicateCheck(prev => ({
        ...prev,
        username: { checked: false, available: false, loading: false }
      }));
      alert('사용자명 중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // Check if duplicate checks have been performed and passed
    if (!duplicateCheck.email.checked || !duplicateCheck.email.available) {
      alert('이메일 중복 확인을 해주세요.');
      return;
    }

    if (!duplicateCheck.username.checked || !duplicateCheck.username.available) {
      alert('사용자명 중복 확인을 해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        nickname: formData.username,
        fullName: formData.name
      });

      console.log('Registration successful:', response);
      alert('✅ 회원가입이 완료되었습니다! 로그인해주세요.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.message || '회원가입에 실패했습니다.');
      alert(`❌ ${error.message || '회원가입에 실패했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  // 소셜 로그인 핸들러들
  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    try {
      const result = await realSocialLoginService.loginWithGoogle();
      if (result.success) {
        alert(`✅ 구글 로그인 성공! 환영합니다, ${result.user?.name}님!`);
        navigate('/dashboard');
      } else {
        console.log('구글 로그인 실패:', result.error);
      }
    } catch (error) {
      console.error('구글 로그인 에러:', error);
      alert('구글 로그인 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleKakaoLogin = async () => {
    setSocialLoading('kakao');
    try {
      const result = await realSocialLoginService.loginWithKakao();
      if (result.success) {
        alert(`✅ 카카오 로그인 성공! 환영합니다, ${result.user?.name}님!`);
        navigate('/dashboard');
      } else {
        console.log('카카오 로그인 실패:', result.error);
      }
    } catch (error) {
      console.error('카카오 로그인 에러:', error);
      alert('카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleNaverLogin = async () => {
    setSocialLoading('naver');
    try {
      const result = await realSocialLoginService.loginWithNaver();
      if (result.success) {
        alert(`✅ 네이버 로그인 성공! 환영합니다, ${result.user?.name}님!`);
        navigate('/dashboard');
      } else {
        console.log('네이버 로그인 실패:', result.error);
      }
    } catch (error) {
      console.error('네이버 로그인 에러:', error);
      alert('네이버 로그인 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🌍 TravelMate</h1>
          <h2>회원가입</h2>
          <p>여행 동반자와 함께할 모험을 시작하세요</p>
        </div>

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
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">사용자명</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="사용자명을 입력하세요"
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={checkUsernameDuplicate}
                disabled={!formData.username || duplicateCheck.username.loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: duplicateCheck.username.checked
                    ? (duplicateCheck.username.available ? '#28a745' : '#dc3545')
                    : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: duplicateCheck.username.loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '12px'
                }}
              >
                {duplicateCheck.username.loading
                  ? '확인 중...'
                  : duplicateCheck.username.checked
                    ? (duplicateCheck.username.available ? '✅ 사용가능' : '❌ 중복됨')
                    : '중복확인'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={checkEmailDuplicate}
                disabled={!formData.email || duplicateCheck.email.loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: duplicateCheck.email.checked
                    ? (duplicateCheck.email.available ? '#28a745' : '#dc3545')
                    : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: duplicateCheck.email.loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '12px'
                }}
              >
                {duplicateCheck.email.loading
                  ? '확인 중...'
                  : duplicateCheck.email.checked
                    ? (duplicateCheck.email.available ? '✅ 사용가능' : '❌ 중복됨')
                    : '중복확인'}
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
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        {/* 소셜 로그인 - 백엔드 구현 완료 후 활성화 예정 */}
        {/* <div className="auth-divider">
          <span>또는</span>
        </div>

        <div className="social-login">
          <button
            className="social-btn google"
            onClick={handleGoogleLogin}
            disabled={socialLoading !== null}
          >
            <span>🔵</span>
            {socialLoading === 'google' ? '구글 로그인 중...' : 'Google로 가입'}
          </button>
          <button
            className="social-btn kakao"
            onClick={handleKakaoLogin}
            disabled={socialLoading !== null}
          >
            <span>🟡</span>
            {socialLoading === 'kakao' ? '카카오 로그인 중...' : 'KakaoTalk으로 가입'}
          </button>
          <button
            className="social-btn naver"
            onClick={handleNaverLogin}
            disabled={socialLoading !== null}
          >
            <span>🟢</span>
            {socialLoading === 'naver' ? '네이버 로그인 중...' : 'Naver로 가입'}
          </button>
        </div> */}

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