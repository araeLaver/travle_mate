import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/accessibility.css';
import Layout from './layouts/Layout';
import AdminRoute from './components/auth/AdminRoute';
import AuthCallback from './components/AuthCallback';
import { ProtectedRoute, AuthRequiredRoute } from './components/auth/ProtectedRoute';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import Tutorial from './components/Tutorial';
import { ToastProvider } from './components/Toast';

// Lazy loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const ChatList = lazy(() => import('./pages/ChatList'));
const Groups = lazy(() => import('./pages/Groups'));
const CreateGroup = lazy(() => import('./pages/CreateGroup'));
const Profile = lazy(() => import('./pages/Profile'));
const NFTMap = lazy(() => import('./pages/NFTMap'));
const NFTCollection = lazy(() => import('./pages/NFTCollection'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const PointShop = lazy(() => import('./pages/PointShop'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const WalletConnect = lazy(() => import('./pages/WalletConnect'));
const AIRecommendation = lazy(() => import('./pages/AIRecommendation'));
const Payment = lazy(() => import('./pages/Payment'));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

// 전역 튜토리얼 컴포넌트 (Router 내부에서 사용)
const GlobalTutorial: React.FC = () => {
  const { isOpen, completeTutorial } = useTutorial();
  return <Tutorial isOpen={isOpen} onComplete={completeTutorial} />;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <TutorialProvider>
            <Router>
              <GlobalTutorial />
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* 인증이 필요 없는 페이지 */}
                <Route path="/" element={<Home />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* 채팅 목록 페이지 */}
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ChatList />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* 개별 채팅 페이지 */}
                <Route
                  path="/chat/:roomId"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Chat />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* 그룹 목록 페이지 (비회원 접근 가능) */}
                <Route
                  path="/groups"
                  element={
                    <Layout>
                      <Groups />
                    </Layout>
                  }
                />

                {/* 그룹 생성 페이지 (로그인 필수) */}
                <Route
                  path="/groups/create"
                  element={
                    <AuthRequiredRoute>
                      <Layout>
                        <CreateGroup />
                      </Layout>
                    </AuthRequiredRoute>
                  }
                />

                {/* 프로필 페이지 */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* NFT 수집 지도 페이지 */}
                <Route
                  path="/nft"
                  element={
                    <ProtectedRoute>
                      <NFTMap />
                    </ProtectedRoute>
                  }
                />

                {/* NFT 컬렉션 페이지 */}
                <Route
                  path="/nft/collection"
                  element={
                    <ProtectedRoute>
                      <NFTCollection />
                    </ProtectedRoute>
                  }
                />

                {/* 포인트/리더보드 페이지 */}
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />

                {/* 포인트 페이지 (리더보드 별칭) */}
                <Route
                  path="/points"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />

                {/* 지갑 연결 페이지 */}
                <Route
                  path="/wallet"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <WalletConnect />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* NFT 마켓플레이스 페이지 */}
                <Route
                  path="/marketplace"
                  element={
                    <ProtectedRoute>
                      <Marketplace />
                    </ProtectedRoute>
                  }
                />

                {/* 포인트 상점 페이지 */}
                <Route
                  path="/shop"
                  element={
                    <ProtectedRoute>
                      <PointShop />
                    </ProtectedRoute>
                  }
                />

                {/* 관리자 대시보드 */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                {/* 알림 설정 페이지 */}
                <Route
                  path="/settings/notifications"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <NotificationSettings />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* AI 추천 페이지 */}
                <Route
                  path="/ai"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AIRecommendation />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* 결제 페이지 */}
                <Route
                  path="/payment"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Payment />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              </Suspense>
            </Router>
          </TutorialProvider>
        </ToastProvider>
        {/* React Query DevTools (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
