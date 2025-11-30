import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import ChatList from './pages/ChatList';
import Groups from './pages/Groups';
import CreateGroup from './pages/CreateGroup';
import Profile from './pages/Profile';
import AuthCallback from './components/AuthCallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
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

            {/* 그룹 생성 페이지 */}
            <Route
              path="/groups/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateGroup />
                  </Layout>
                </ProtectedRoute>
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
          </Routes>
        </Router>
        {/* React Query DevTools (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
