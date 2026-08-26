import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/accessibility.css';
import Layout from './layouts/Layout';
import AdminRoute from './components/auth/AdminRoute';
import AuthCallback from './components/AuthCallback';
import { ProtectedRoute, AuthRequiredRoute } from './components/auth/ProtectedRoute';
import { authService } from './services/authService';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import Tutorial from './components/Tutorial';
import { ToastProvider } from './components/Toast';
import { trackPageView } from './utils/analytics';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// Lazy loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Legal = lazy(() => import('./pages/Legal'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const ChatList = lazy(() => import('./pages/ChatList'));
const Groups = lazy(() => import('./pages/Groups'));
const CreateGroup = lazy(() => import('./pages/CreateGroup'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const AIRecommendation = lazy(() => import('./pages/AIRecommendation'));
const Matching = lazy(() => import('./pages/Matching'));
const Payment = lazy(() => import('./pages/Payment'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFail = lazy(() => import('./pages/PaymentFail'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const NFTMap = lazy(() => import('./pages/NFTMap'));
const NFTCollection = lazy(() => import('./pages/NFTCollection'));
const PointShop = lazy(() => import('./pages/PointShop'));
const WalletConnect = lazy(() => import('./pages/WalletConnect'));
const Itineraries = lazy(() => import('./pages/Itineraries'));
const ItineraryDetail = lazy(() => import('./pages/ItineraryDetail'));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

// GA4 페이지 뷰 자동 추적
const PageViewTracker: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
};

// 전역 튜토리얼 컴포넌트 (Router 내부에서 사용)
const GlobalTutorial: React.FC = () => {
  const { isOpen, completeTutorial } = useTutorial();
  return <Tutorial isOpen={isOpen} onComplete={completeTutorial} />;
};

// GoogleOAuthProvider는 항상 감싸줘야 useGoogleLogin 훅이 크래시하지 않음
// clientId가 비어있으면 Google 로그인 버튼이 작동하지 않지만 앱은 정상 동작

function App() {
  const [isSessionRestored, setIsSessionRestored] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        await authService.tryRestoreSession();
      } finally {
        if (isMounted) {
          setIsSessionRestored(true);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isSessionRestored) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ToastProvider>
            <TutorialProvider>
              <Router>
                <PageViewTracker />
                <GlobalTutorial />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* 인증이 필요 없는 페이지 */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/legal" element={<Legal />} />
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

                    {/* 동반자 매칭 페이지 */}
                    <Route
                      path="/matching"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Matching />
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
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/fail" element={<PaymentFail />} />

                    {/* NFT/마켓/지갑/포인트 기능 */}
                    <Route
                      path="/nft/map"
                      element={
                        <AuthRequiredRoute>
                          <Layout>
                            <NFTMap />
                          </Layout>
                        </AuthRequiredRoute>
                      }
                    />
                    <Route
                      path="/nft/collection"
                      element={
                        <AuthRequiredRoute>
                          <Layout>
                            <NFTCollection />
                          </Layout>
                        </AuthRequiredRoute>
                      }
                    />
                    <Route
                      path="/marketplace"
                      element={
                        <AuthRequiredRoute>
                          <Layout>
                            <Marketplace />
                          </Layout>
                        </AuthRequiredRoute>
                      }
                    />
                    <Route
                      path="/points/shop"
                      element={
                        <AuthRequiredRoute>
                          <Layout>
                            <PointShop />
                          </Layout>
                        </AuthRequiredRoute>
                      }
                    />
                    <Route
                      path="/wallet"
                      element={
                        <AuthRequiredRoute>
                          <Layout>
                            <WalletConnect />
                          </Layout>
                        </AuthRequiredRoute>
                      }
                    />

                    {/* 여행 일정 페이지 */}
                    <Route
                      path="/itineraries"
                      element={
                        <Layout>
                          <Itineraries />
                        </Layout>
                      }
                    />
                    <Route
                      path="/itineraries/:id"
                      element={
                        <Layout>
                          <ItineraryDetail />
                        </Layout>
                      }
                    />

                    {/* 정의되지 않은 모든 경로 → 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Router>
            </TutorialProvider>
          </ToastProvider>
        </GoogleOAuthProvider>
        {/* React Query DevTools (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
