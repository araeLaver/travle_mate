import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: '여행 메이트 찾기', icon: '🔍' },
    { path: '/chat', label: '채팅', icon: '💬' },
    { path: '/groups', label: '여행 그룹', icon: '🗺️' },
    { path: '/profile', label: '내 프로필', icon: '👤' },
    { path: '/', label: '홈으로', icon: '🏠' },
  ];

  return (
    <div className="layout">
      {/* 헤더 */}
      <header className="header">
        <div className="header-content">
          <Link to="/dashboard" className="logo">
            🌍 TravelMate
          </Link>
          <div className="header-actions">
            <div className="guest-actions">
              <Link to="/login" className="auth-btn login">
                로그인
              </Link>
              <Link to="/register" className="auth-btn register">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="layout-body">
        {/* 사이드바 */}
        <aside className="sidebar">
          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
          
          <div className="sidebar-footer">
            <div className="guest-notice">
              <div className="notice-icon">ℹ️</div>
              <div className="notice-text">
                <p>더 많은 기능을 원한다면</p>
                <Link to="/register" className="register-link">
                  회원가입하기
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;