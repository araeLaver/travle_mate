import React, { useState } from 'react';
import { useCreateTravelReview } from '../hooks/useTravelReview';
import { CreateTravelReviewRequest } from '../services/travelReviewService';

// ===== SVG 아이콘 =====

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    style={{ width: 28, height: 28 }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ===== Props =====

interface ReviewFormProps {
  /** 리뷰 대상자 ID */
  revieweeId: number;
  /** 리뷰 대상자 닉네임 */
  revieweeNickname: string;
  /** 해당 매칭 요청 ID */
  matchRequestId: number;
  onSubmit?: () => void;
  onClose: () => void;
}

// ===== 별점 선택 서브컴포넌트 =====

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ label, value, onChange }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="tr-form-group">
      <label className="tr-label">{label}</label>
      <div className="tr-star-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`tr-star-btn ${star <= (hovered || value) ? 'filled' : ''}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            aria-label={`${star}점`}
          >
            <StarIcon filled={star <= (hovered || value)} />
          </button>
        ))}
        <span className="tr-rating-text">
          {value > 0 ? `${value}점` : '선택'}
        </span>
      </div>
    </div>
  );
};

// ===== 메인 컴포넌트 =====

const ReviewForm: React.FC<ReviewFormProps> = ({
  revieweeId,
  revieweeNickname,
  matchRequestId,
  onSubmit,
  onClose,
}) => {
  const [punctualityScore, setPunctualityScore] = useState(0);
  const [mannersScore, setMannersScore] = useState(0);
  const [communicationScore, setCommunicationScore] = useState(0);
  const [wouldTravelAgain, setWouldTravelAgain] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createReview = useCreateTravelReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (punctualityScore === 0 || mannersScore === 0 || communicationScore === 0) {
      setError('모든 항목의 점수를 선택해주세요.');
      return;
    }

    const payload: CreateTravelReviewRequest = {
      revieweeId,
      matchRequestId,
      punctualityScore,
      mannersScore,
      communicationScore,
      wouldTravelAgain,
      comment: comment.trim() || undefined,
    };

    createReview.mutate(payload, {
      onSuccess: () => {
        onSubmit?.();
        onClose();
      },
      onError: (err: Error) => {
        setError(err.message || '리뷰 작성에 실패했습니다.');
      },
    });
  };

  return (
    <div className="tr-overlay" onClick={onClose} data-testid="travel-review-overlay">
      <div
        className="tr-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="travel-review-modal"
      >
        {/* 헤더 */}
        <div className="tr-header">
          <h2>동행 평가 작성</h2>
          <button className="tr-close-btn" onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tr-form">
          {/* 대상자 표시 */}
          <div className="tr-reviewee-name">
            {revieweeNickname} 님에 대한 평가
          </div>

          {/* 별점 섹션 */}
          <StarRating
            label="시간 약속"
            value={punctualityScore}
            onChange={setPunctualityScore}
          />
          <StarRating
            label="매너"
            value={mannersScore}
            onChange={setMannersScore}
          />
          <StarRating
            label="소통"
            value={communicationScore}
            onChange={setCommunicationScore}
          />

          {/* 다시 함께 여행 */}
          <div className="tr-form-group">
            <label className="tr-checkbox-label">
              <input
                type="checkbox"
                checked={wouldTravelAgain}
                onChange={(e) => setWouldTravelAgain(e.target.checked)}
                className="tr-checkbox"
              />
              <span>다시 함께 여행하고 싶습니다</span>
            </label>
          </div>

          {/* 코멘트 */}
          <div className="tr-form-group">
            <label className="tr-label">코멘트 (선택)</label>
            <textarea
              className="tr-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="동행에 대한 솔직한 후기를 남겨주세요..."
              maxLength={500}
              rows={4}
            />
            <div className="tr-char-count">{comment.length} / 500</div>
          </div>

          {/* 에러 */}
          {error && <div className="tr-error">{error}</div>}

          {/* 버튼 */}
          <div className="tr-actions">
            <button
              type="button"
              className="tr-btn-cancel"
              onClick={onClose}
              disabled={createReview.isPending}
            >
              취소
            </button>
            <button
              type="submit"
              className="tr-btn-submit"
              disabled={createReview.isPending}
            >
              {createReview.isPending ? '제출 중...' : '평가 작성'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .tr-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .tr-modal {
          background: linear-gradient(135deg, rgba(26,11,46,0.98) 0%, rgba(45,20,80,0.98) 100%);
          border-radius: 20px;
          border: 1px solid rgba(138,43,226,0.3);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .tr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(138,43,226,0.2);
        }
        .tr-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }
        .tr-close-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: rgba(255,255,255,0.7);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .tr-close-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }
        .tr-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .tr-reviewee-name {
          font-size: 15px;
          font-weight: 600;
          color: #a855f7;
          text-align: center;
          padding: 12px;
          background: rgba(168,85,247,0.1);
          border-radius: 12px;
        }
        .tr-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tr-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }
        .tr-star-row {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .tr-star-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          color: rgba(255,255,255,0.25);
          transition: color 0.15s, transform 0.15s;
        }
        .tr-star-btn:hover,
        .tr-star-btn.filled { color: #fbbf24; transform: scale(1.1); }
        .tr-rating-text {
          margin-left: 10px;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          min-width: 28px;
        }
        .tr-checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
        }
        .tr-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #8b5cf6;
          cursor: pointer;
        }
        .tr-textarea {
          width: 100%;
          padding: 12px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(138,43,226,0.3);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          box-sizing: border-box;
        }
        .tr-textarea:focus {
          outline: none;
          border-color: rgba(138,43,226,0.6);
          background: rgba(255,255,255,0.08);
        }
        .tr-textarea::placeholder { color: rgba(255,255,255,0.35); }
        .tr-char-count {
          text-align: right;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
        }
        .tr-error {
          padding: 10px 14px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.35);
          border-radius: 10px;
          color: #f87171;
          font-size: 13px;
        }
        .tr-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
        .tr-btn-cancel,
        .tr-btn-submit {
          flex: 1;
          padding: 13px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .tr-btn-cancel {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
        }
        .tr-btn-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.16); }
        .tr-btn-submit {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: #fff;
        }
        .tr-btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(139,92,246,0.45);
        }
        .tr-btn-cancel:disabled,
        .tr-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        @media (max-width: 480px) {
          .tr-modal { border-radius: 20px 20px 0 0; max-height: 95vh; }
          .tr-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default ReviewForm;
