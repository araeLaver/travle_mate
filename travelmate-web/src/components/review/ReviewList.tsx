import React, { useState, useEffect, useCallback } from 'react';
import {
  locationReviewService,
  LocationReviewResponse,
} from '../../services/locationReviewService';
import { authService } from '../../services/authService';
import './ReviewList.css';

// SVG Icons
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

interface ReviewListProps {
  locationId: number;
  onReviewDeleted?: () => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ locationId, onReviewDeleted }) => {
  const [reviews, setReviews] = useState<LocationReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<'recent' | 'helpful'>('recent');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<{ averageRating: number; reviewCount: number } | null>(null);

  const currentUser = authService.getUser();

  const loadReviews = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    setIsLoading(true);

    try {
      const [reviewsResponse, statsResponse] = await Promise.all([
        locationReviewService.getLocationReviews(locationId, sort, currentPage),
        reset ? locationReviewService.getLocationReviewStats(locationId) : Promise.resolve(null),
      ]);

      if (reset) {
        setReviews(reviewsResponse.content);
        if (statsResponse) {
          setStats(statsResponse);
        }
      } else {
        setReviews(prev => [...prev, ...reviewsResponse.content]);
      }

      setHasMore(!reviewsResponse.last);
      setPage(currentPage);
    } catch (err) {
      console.error('리뷰 로딩 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, sort, page]);

  useEffect(() => {
    loadReviews(true);
  }, [locationId, sort]);

  const handleSortChange = (newSort: 'recent' | 'helpful') => {
    setSort(newSort);
    setPage(0);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadReviews();
  };

  const handleToggleHelpful = async (reviewId: number) => {
    try {
      const result = await locationReviewService.toggleHelpful(reviewId);
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? {
                ...review,
                isHelpful: result.isHelpful,
                helpfulCount: result.isHelpful
                  ? review.helpfulCount + 1
                  : review.helpfulCount - 1,
              }
            : review
        )
      );
    } catch (err) {
      console.error('도움됨 토글 실패:', err);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;

    try {
      await locationReviewService.deleteReview(reviewId);
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      if (stats) {
        setStats({ ...stats, reviewCount: stats.reviewCount - 1 });
      }
      onReviewDeleted?.();
    } catch (err) {
      console.error('리뷰 삭제 실패:', err);
    }
  };

  const formatDate = (dateString: string) => {
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

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <StarIcon key={star} filled={star <= rating} />
        ))}
      </div>
    );
  };

  return (
    <div className="review-list">
      {/* 통계 헤더 */}
      {stats && (
        <div className="review-stats">
          <div className="average-rating">
            <span className="rating-value">{stats.averageRating.toFixed(1)}</span>
            {renderStars(Math.round(stats.averageRating))}
          </div>
          <span className="review-count">{stats.reviewCount}개의 리뷰</span>
        </div>
      )}

      {/* 정렬 옵션 */}
      <div className="sort-options">
        <button
          className={`sort-btn ${sort === 'recent' ? 'active' : ''}`}
          onClick={() => handleSortChange('recent')}
        >
          최신순
        </button>
        <button
          className={`sort-btn ${sort === 'helpful' ? 'active' : ''}`}
          onClick={() => handleSortChange('helpful')}
        >
          도움순
        </button>
      </div>

      {/* 리뷰 목록 */}
      {reviews.length === 0 && !isLoading ? (
        <div className="empty-reviews">
          <p>아직 리뷰가 없습니다.</p>
          <p>첫 번째 리뷰를 작성해보세요!</p>
        </div>
      ) : (
        <div className="reviews">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  {review.reviewer.profileImageUrl ? (
                    <img
                      src={review.reviewer.profileImageUrl}
                      alt={review.reviewer.nickname}
                      className="reviewer-avatar"
                    />
                  ) : (
                    <div className="reviewer-avatar placeholder" data-testid={`reviewer-avatar-placeholder-${review.reviewer.id}`}>
                      <UserIcon />
                    </div>
                  )}
                  <div className="reviewer-details">
                    <span className="reviewer-name">{review.reviewer.nickname}</span>
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                <div className="review-rating">{renderStars(review.rating)}</div>
              </div>

              {review.visitedSeasonDisplay && (
                <div className="visited-season">
                  <span className="season-badge">{review.visitedSeasonDisplay} 방문</span>
                </div>
              )}

              {review.comment && <p className="review-comment">{review.comment}</p>}

              {review.photoUrls && review.photoUrls.length > 0 && (
                <div className="review-photos">
                  {review.photoUrls.map((url, index) => (
                    <img key={index} src={url} alt={`리뷰 사진 ${index + 1}`} />
                  ))}
                </div>
              )}

              <div className="review-footer">
                <button
                  className={`helpful-btn ${review.isHelpful ? 'active' : ''}`}
                  onClick={() => handleToggleHelpful(review.id)}
                  data-testid={`helpful-btn-${review.id}`}
                >
                  <ThumbsUpIcon />
                  <span>도움됨 {review.helpfulCount > 0 && `(${review.helpfulCount})`}</span>
                </button>

                {currentUser && currentUser.id === review.reviewer.id && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteReview(review.id)}
                    data-testid={`delete-btn-${review.id}`}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="loading">
          <div className="loading-spinner" data-testid="loading-spinner" />
        </div>
      )}

      {/* 더 보기 */}
      {hasMore && !isLoading && reviews.length > 0 && (
        <button className="load-more-btn" onClick={handleLoadMore}>
          더 보기
        </button>
      )}
    </div>
  );
};

export default ReviewList;
