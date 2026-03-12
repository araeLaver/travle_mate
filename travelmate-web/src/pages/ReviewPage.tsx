import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useCreateReview } from '../hooks/useReview';
import { TripReviewForm } from '../components/review';
import { CreateReviewDto } from '../services/reviewService';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const ReviewPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const targetUserId = userId ? parseInt(userId, 10) : NaN;

  // 대상 유저 프로필 조회 (profileService.getProfile은 string userId를 받음)
  const { data: profile, isLoading: isProfileLoading } = useProfile(userId);

  const { mutate: createReview, isPending, error: mutationError } = useCreateReview();

  const handleSubmit = (data: CreateReviewDto) => {
    createReview(data, {
      onSuccess: () => {
        navigate(`/profile/${userId}`, { replace: true });
      },
    });
  };

  // userId가 유효하지 않은 경우
  if (!userId || isNaN(targetUserId)) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            잘못된 접근입니다
          </h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 프로필 로딩 중
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 animate-spin mb-4 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      </div>
    );
  }

  const targetUserName = profile?.name ?? '알 수 없는 유저';

  const apiErrorMessage =
    mutationError instanceof Error
      ? mutationError.message
      : mutationError
        ? '후기 제출에 실패했습니다. 다시 시도해주세요.'
        : null;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      {/* Background blobs */}
      <div
        className="absolute top-20 left-10 w-72 h-72 bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite' }}
      />
      <div
        className="absolute top-40 right-10 w-96 h-96 bg-pink-400/20 dark:bg-pink-600/15 rounded-full blur-3xl"
        style={{ animation: 'blob 7s infinite 2s' }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3">
        <div className="max-w-2xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl px-6 py-3 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Logo size="md" />
              <span className="font-bold text-gray-900 dark:text-white">Fryndo</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                뒤로가기
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-16">
        {/* 대상 유저 아바타 */}
        {profile && (
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden mb-3">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile.location ? `📍 ${profile.location.city}, ${profile.location.country}` : ''}
            </p>
          </div>
        )}

        {/* 폼 카드 */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-xl">
          <TripReviewForm
            targetUserId={targetUserId}
            targetUserName={targetUserName}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            error={apiErrorMessage}
          />
        </div>
      </main>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default ReviewPage;
