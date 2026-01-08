import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

// SVG Icons
const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MessageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const MapIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const GlobeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const InfoIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: '여행 메이트 찾기', icon: <SearchIcon /> },
    { path: '/chat', label: '채팅', icon: <MessageIcon /> },
    { path: '/groups', label: '여행 그룹', icon: <MapIcon /> },
    { path: '/profile', label: '내 프로필', icon: <UserIcon /> },
    { path: '/', label: '홈으로', icon: <HomeIcon /> },
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
            <span className="logo-icon" aria-hidden="true">
              <GlobeIcon />
            </span>
            TravelMate
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
                <InfoIcon />
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
