import React from 'react';
import { TravelReviewResponse } from '../services/travelReviewService';

// ===== SVG 아이콘 =====

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 16, height: 16 }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 20, height: 20 }}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 14, height: 14 }}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// ===== 헬퍼 =====

const renderStars = (score: number) => (
  <div style={{ display: 'flex', gap: 2, color: '#fbbf24' }}>
    {[1, 2, 3, 4, 5].map(s => (
      <StarIcon key={s} filled={s <= score} />
    ))}
  </div>
);

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
};

// ===== Props =====

interface ReviewListProps {
  reviews: TravelReviewResponse[];
  isLoading?: boolean;
  emptyMessage?: string;
}

// ===== 메인 컴포넌트 =====

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  isLoading = false,
  emptyMessage = '아직 받은 평가가 없습니다.',
}) => {
  if (isLoading) {
    return (
      <div className="trl-loading">
        <div className="trl-spinner" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="trl-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // 평균 점수 계산 (전체 리뷰)
  const overallAvg = reviews.reduce((sum, r) => sum + r.averageScore, 0) / reviews.length;

  return (
    <div className="trl-container">
      {/* 통계 헤더 */}
      <div className="trl-stats">
        <div className="trl-avg-score">{overallAvg.toFixed(1)}</div>
        <div>
          {renderStars(Math.round(overallAvg))}
          <span className="trl-review-count">{reviews.length}개의 평가</span>
        </div>
      </div>

      {/* 리뷰 카드 목록 */}
      <div className="trl-list">
        {reviews.map(review => (
          <div key={review.id} className="trl-card">
            {/* 카드 헤더: 작성자 정보 + 날짜 */}
            <div className="trl-card-header">
              <div className="trl-reviewer">
                {review.reviewerSummary.profileImageUrl ? (
                  <img
                    src={review.reviewerSummary.profileImageUrl}
                    alt={review.reviewerSummary.nickname}
                    className="trl-avatar"
                  />
                ) : (
                  <div className="trl-avatar-placeholder">
                    <UserIcon />
                  </div>
                )}
                <div>
                  <div className="trl-reviewer-name">{review.reviewerSummary.nickname}</div>
                  <div className="trl-date">{formatDate(review.createdAt)}</div>
                </div>
              </div>

              {/* 평균 점수 뱃지 */}
              <div className="trl-avg-badge">{review.averageScore.toFixed(1)}</div>
            </div>

            {/* 항목별 별점 */}
            <div className="trl-scores">
              <div className="trl-score-row">
                <span className="trl-score-label">시간 약속</span>
                {renderStars(review.punctualityScore)}
              </div>
              <div className="trl-score-row">
                <span className="trl-score-label">매너</span>
                {renderStars(review.mannersScore)}
              </div>
              <div className="trl-score-row">
                <span className="trl-score-label">소통</span>
                {renderStars(review.communicationScore)}
              </div>
            </div>

            {/* 다시 여행 여부 */}
            <div className={`trl-travel-again ${review.wouldTravelAgain ? 'yes' : 'no'}`}>
              <HeartIcon filled={review.wouldTravelAgain} />
              <span>
                {review.wouldTravelAgain
                  ? '다시 함께 여행하고 싶어요'
                  : '다시 여행하기 어려울 것 같아요'}
              </span>
            </div>

            {/* 코멘트 */}
            {review.comment && (
              <p className="trl-comment">
                {'"'}
                {review.comment}
                {'"'}
              </p>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .trl-container { display: flex; flex-direction: column; gap: 16px; }
        .trl-stats {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.06);
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .trl-avg-score {
          font-size: 2rem;
          font-weight: 800;
          color: #fbbf24;
          line-height: 1;
        }
        .trl-review-count {
          display: block;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-top: 4px;
        }
        .trl-list { display: flex; flex-direction: column; gap: 12px; }
        .trl-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.2s;
        }
        .trl-card:hover { border-color: rgba(139,92,246,0.35); }
        .trl-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .trl-reviewer { display: flex; align-items: center; gap: 10px; }
        .trl-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .trl-avatar-placeholder {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .trl-reviewer-name { font-size: 14px; font-weight: 700; color: #fff; }
        .trl-date { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 2px; }
        .trl-avg-badge {
          background: rgba(251,191,36,0.15);
          color: #fbbf24;
          font-size: 14px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid rgba(251,191,36,0.3);
        }
        .trl-scores { display: flex; flex-direction: column; gap: 6px; }
        .trl-score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .trl-score-label { font-size: 13px; color: rgba(255,255,255,0.65); }
        .trl-travel-again {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 10px;
        }
        .trl-travel-again.yes {
          background: rgba(16,185,129,0.12);
          color: #6ee7b7;
        }
        .trl-travel-again.no {
          background: rgba(239,68,68,0.1);
          color: #fca5a5;
        }
        .trl-comment {
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          font-style: italic;
          line-height: 1.6;
          margin: 0;
          padding: 10px 14px;
          background: rgba(255,255,255,0.04);
          border-left: 3px solid rgba(139,92,246,0.5);
          border-radius: 0 8px 8px 0;
        }
        .trl-loading {
          display: flex; justify-content: center; padding: 40px;
        }
        .trl-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: trlSpin 0.8s linear infinite;
        }
        @keyframes trlSpin { to { transform: rotate(360deg); } }
        .trl-empty {
          text-align: center;
          padding: 32px;
          color: rgba(255,255,255,0.45);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default ReviewList;
