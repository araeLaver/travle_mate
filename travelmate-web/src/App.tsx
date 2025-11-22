import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import Layout from './layouts/Layout';
import HomeNew from './pages/HomeNew';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
        {/* 인증이 필요 없는 페이지 */}
        <Route path="/" element={<HomeNew />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        {/* 채팅 목록 페이지 */}
        <Route path="/chat" element={
          <Layout>
            <ChatList />
          </Layout>
        } />
        
        {/* 개별 채팅 페이지 */}
        <Route path="/chat/:roomId" element={
          <Layout>
            <Chat />
          </Layout>
        } />
        
        {/* 그룹 목록 페이지 */}
        <Route path="/groups" element={
          <Layout>
            <Groups />
          </Layout>
        } />
        
        {/* 그룹 생성 페이지 */}
        <Route path="/groups/create" element={
          <Layout>
            <CreateGroup />
          </Layout>
        } />
        
        {/* 프로필 페이지 */}
        <Route path="/profile" element={
          <Layout>
            <Profile />
          </Layout>
        } />
        </Routes>
      </Router>
      {/* React Query DevTools (개발 환경에서만 표시) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;