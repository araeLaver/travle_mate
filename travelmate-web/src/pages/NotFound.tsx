import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 404 페이지. 정의되지 않은 경로(catch-all)에서 렌더링된다.
 * 공개 런칭 시 미지 URL에서 빈 화면 대신 안내와 홈 복귀 경로를 제공한다.
 */
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white dark:bg-gray-900">
      <p className="text-7xl font-extrabold text-orange-500">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
        요청하신 주소가 변경되었거나 더 이상 존재하지 않습니다. 주소를 다시 확인해 주세요.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600"
        >
          홈으로 돌아가기
        </Link>
        <Link
          to="/matching"
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          메이트 찾기
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
