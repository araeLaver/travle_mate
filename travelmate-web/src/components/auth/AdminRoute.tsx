import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { adminService } from '../../services/adminService';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // 먼저 로그인 여부 확인
      if (!authService.isAuthenticated()) {
        setIsChecking(false);
        setIsAdmin(false);
        return;
      }

      try {
        // 관리자 API 호출로 권한 확인
        await adminService.getLocationStats();
        setIsAdmin(true);
      } catch (error: unknown) {
        // 403 Forbidden이면 관리자 아님
        const apiError = error as { status?: number };
        if (apiError.status === 403 || apiError.status === 401) {
          setIsAdmin(false);
        } else {
          // 다른 오류는 네트워크 문제 등으로 간주, 재시도 필요
          // Admin check failed: treat as non-admin
          setIsAdmin(false);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminAccess();
  }, []);

  // 권한 확인 중
  if (isChecking) {
    return (
      <div className="admin-route-loading">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>권한 확인 중...</p>
        </div>
        <style>{`
          .admin-route-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
          }
          .loading-container {
            text-align: center;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #8b5cf6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 로그인하지 않은 경우 로그인 페이지로
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // 관리자가 아닌 경우 접근 거부 페이지 표시
  if (!isAdmin) {
    return (
      <div className="admin-route-denied">
        <div className="denied-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <h1>접근 권한이 없습니다</h1>
          <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
          <a href="/" className="btn-home">
            홈으로 돌아가기
          </a>
        </div>
        <style>{`
          .admin-route-denied {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
          }
          .denied-container {
            text-align: center;
            padding: 2rem;
          }
          .denied-container svg {
            color: #ef4444;
            margin-bottom: 1.5rem;
          }
          .denied-container h1 {
            font-size: 1.5rem;
            margin: 0 0 0.5rem;
          }
          .denied-container p {
            color: #94a3b8;
            margin: 0 0 2rem;
          }
          .btn-home {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            color: #fff;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .btn-home:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
