import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // true면 로그인 필수, false면 비회원도 접근 가능
}

// 로그인 필수 라우트 (그룹 생성 등)
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = false }) => {
  const isAuthenticated = authService.isAuthenticated();

  // requireAuth가 true일 때만 로그인 페이지로 리다이렉트
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 비회원도 페이지 접근 가능 (더미 데이터 표시)
  return <>{children}</>;
};

// 로그인 필수 라우트 (별칭)
export const AuthRequiredRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute requireAuth={true}>{children}</ProtectedRoute>;
};
