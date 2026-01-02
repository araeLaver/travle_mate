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
      {/* 스킵 링크 */}
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>

      {/* 헤더 */}
      <header className="header">
        <div className="header-content">
          <Link to="/dashboard" className="logo" aria-label="TravelMate 홈으로 이동">
            <span aria-hidden="true">🌍</span> TravelMate
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
        <aside className="sidebar" aria-label="주요 네비게이션">
          <nav className="nav" aria-label="메인 메뉴">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="guest-notice" role="complementary" aria-label="회원가입 안내">
              <div className="notice-icon" aria-hidden="true">
                ℹ️
              </div>
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
        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
