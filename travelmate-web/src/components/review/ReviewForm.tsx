import React, { useState } from 'react';
import {
  locationReviewService,
  CreateReviewRequest,
  VisitedSeason,
} from '../../services/locationReviewService';
import './ReviewForm.css';

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

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface ReviewFormProps {
  locationId: number;
  locationName: string;
  onSubmit: () => void;
  onClose: () => void;
}

const SEASONS: { value: VisitedSeason; label: string }[] = [
  { value: 'SPRING', label: '봄' },
  { value: 'SUMMER', label: '여름' },
  { value: 'FALL', label: '가을' },
  { value: 'WINTER', label: '겨울' },
];

const ReviewForm: React.FC<ReviewFormProps> = ({ locationId, locationName, onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [visitedSeason, setVisitedSeason] = useState<VisitedSeason | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('평점을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateReviewRequest = {
        rating,
        comment: comment.trim() || undefined,
        visitedSeason: visitedSeason || undefined,
      };

      await locationReviewService.createReview(locationId, request);
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : '리뷰 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-form-overlay" onClick={onClose} data-testid="review-form-overlay">
      <div
        className="review-form-modal"
        onClick={e => e.stopPropagation()}
        data-testid="review-form-modal"
      >
        <div className="review-form-header">
          <h2>리뷰 작성</h2>
          <button className="close-btn" onClick={onClose} data-testid="close-btn">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="location-name">{locationName}</div>

          {/* 별점 */}
          <div className="form-group">
            <label>평점 *</label>
            <div className="star-rating" data-testid="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  data-testid={`star-btn-${star}`}
                >
                  <StarIcon filled={star <= (hoverRating || rating)} />
                </button>
              ))}
              <span className="rating-text">{rating > 0 ? `${rating}점` : '선택해주세요'}</span>
            </div>
          </div>

          {/* 방문 계절 */}
          <div className="form-group">
            <label>방문 계절</label>
            <div className="season-options">
              {SEASONS.map(season => (
                <button
                  key={season.value}
                  type="button"
                  className={`season-btn ${visitedSeason === season.value ? 'selected' : ''}`}
                  onClick={() =>
                    setVisitedSeason(visitedSeason === season.value ? '' : season.value)
                  }
                >
                  {season.label}
                </button>
              ))}
            </div>
          </div>

          {/* 리뷰 내용 */}
          <div className="form-group">
            <label>리뷰 내용</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="이 장소에 대한 경험을 공유해주세요..."
              maxLength={1000}
              rows={5}
            />
            <div className="char-count" data-testid="char-count">
              {comment.length}/1000
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && <div className="error-message">{error}</div>}

          {/* 버튼 */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '작성 중...' : '리뷰 작성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
