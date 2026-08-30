import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from '../components/NotificationCenter';
import { authService } from '../services/authService';
import Logo from '../components/Logo';
import Icon, { IconName } from '../components/icons/Icon';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // 메인 메뉴 (디자인 순서: 대시보드 → 수집 지도 → 내 컬렉션 → 그룹 → 채팅 → 마켓플레이스)
  const mainNavItems: NavItem[] = [
    { path: '/dashboard', label: '대시보드', icon: 'grid' },
    { path: '/nft/map', label: '수집 지도', icon: 'pin' },
    { path: '/nft/collection', label: '내 컬렉션', icon: 'stamp' },
    { path: '/itineraries', label: '여행 일정', icon: 'cal' },
    { path: '/groups', label: '그룹', icon: 'users' },
    { path: '/chat', label: '채팅', icon: 'chat' },
    { path: '/marketplace', label: '마켓플레이스', icon: 'tag' },
    { path: '/points/shop', label: '포인트 샵', icon: 'spark' },
  ];

  // 보조 메뉴 (디바이더 아래: 지갑 → 설정 성격의 항목)
  const secondaryNavItems: NavItem[] = [
    { path: '/wallet', label: '지갑', icon: 'wallet' },
    { path: '/profile', label: '내 프로필', icon: 'user' },
    { path: '/', label: '홈으로', icon: 'home' },
  ];

  const renderNavItem = (item: NavItem) => {
    const isActive =
      item.path === '/'
        ? location.pathname === item.path
        : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`nav-item ${isActive ? 'active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="nav-icon" aria-hidden="true">
          <Icon name={item.icon} size={20} color="currentColor" />
        </span>
        <span className="nav-label">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="layout">
      {/* 스킵 링크 */}
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>

      {/* 헤더 */}
      <header className="header" data-testid="navbar">
        <div className="header-content">
          <Link to="/dashboard" className="logo" aria-label="Fryndo 홈으로 이동">
            <span className="logo-icon" aria-hidden="true">
              <Logo size="sm" />
            </span>
            Fryndo
          </Link>
          <div className="header-actions">
            {authService.isAuthenticated() ? (
              <div className="user-actions" data-testid="user-menu">
                <NotificationCenter />
                <Link to="/settings/notifications" className="settings-link" aria-label="알림 설정">
                  <span className="settings-icon" aria-hidden="true">
                    <Icon name="gear" size={20} color="currentColor" />
                  </span>
                </Link>
              </div>
            ) : (
              <div className="guest-actions">
                <Link to="/login" className="auth-btn login" aria-label="로그인">
                  로그인
                </Link>
                <Link to="/register" className="auth-btn register" aria-label="회원가입">
                  무료로 시작
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="layout-body">
        {/* 사이드바 */}
        <aside className="sidebar" aria-label="주요 네비게이션">
          <nav className="nav" aria-label="메인 메뉴">
            {mainNavItems.map(renderNavItem)}
            <div className="nav-divider" role="separator" aria-hidden="true" />
            {secondaryNavItems.map(renderNavItem)}
          </nav>

          <div className="sidebar-footer">
            {authService.isAuthenticated() ? (
              <div className="promo-card" role="complementary" aria-label="Fryndo Plus 안내">
                <div className="promo-icon" aria-hidden="true">
                  <Icon name="crown" size={20} color="#E0952A" />
                </div>
                <div className="promo-text">
                  <p className="promo-title">Fryndo Plus</p>
                  <p className="promo-desc">희귀 스탬프 알림과 무제한 매칭을 이용해보세요</p>
                  <Link to="/payment" className="promo-cta">
                    7일 무료 체험
                  </Link>
                </div>
              </div>
            ) : (
              <div className="guest-notice" role="complementary" aria-label="회원가입 안내">
                <div className="notice-icon" aria-hidden="true">
                  <Icon name="spark" size={20} color="#4A3AFF" />
                </div>
                <div className="notice-text">
                  <p>더 많은 기능을 원한다면</p>
                  <Link to="/register" className="register-link">
                    회원가입하기
                  </Link>
                </div>
              </div>
            )}
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
