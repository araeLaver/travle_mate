import React, { useState } from 'react';
import { MatchRecommendation } from '../types';
import MatchScoreBreakdown from './MatchScoreBreakdown';

interface MatchCardProps {
  recommendation: MatchRecommendation;
  onSendRequest: (receiverId: number, message?: string) => void;
  isSending?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ recommendation, onSendRequest, isSending }) => {
  const { user, totalScore, scoreBreakdown, matchReasons } = recommendation;
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  const scorePercent = Math.round(totalScore);
  const scoreColor = scorePercent >= 75 ? '#10b981' : scorePercent >= 50 ? '#f59e0b' : '#ef4444';

  const travelStyleLabels: Record<string, string> = {
    ADVENTURE: '모험',
    CULTURE: '문화',
    FOOD: '미식',
    RELAXATION: '휴양',
    NATURE: '자연',
    SHOPPING: '쇼핑',
  };

  const handleSend = () => {
    onSendRequest(user.id, message || undefined);
    setMessage('');
    setShowMessageInput(false);
  };

  return (
    <div className="match-card">
      <div className="match-card-header">
        <div className="match-card-avatar">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.nickname} />
          ) : (
            <div className="match-card-avatar-placeholder">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="match-card-info">
          <h3 className="match-card-name">{user.nickname}</h3>
          <div className="match-card-meta">
            {user.age && <span>{user.age}세</span>}
            {user.travelStyle && (
              <span className="match-card-style-badge">
                {travelStyleLabels[user.travelStyle] || user.travelStyle}
              </span>
            )}
          </div>
        </div>
        <div className="match-card-score" style={{ borderColor: scoreColor }}>
          <span className="score-value" style={{ color: scoreColor }}>
            {scorePercent}
          </span>
          <span className="score-label">점</span>
        </div>
      </div>

      {user.bio && <p className="match-card-bio">{user.bio}</p>}

      <div className="match-card-tags">
        {user.languages?.slice(0, 3).map(lang => (
          <span key={lang} className="match-tag match-tag-lang">
            {lang}
          </span>
        ))}
        {user.interests?.slice(0, 3).map(interest => (
          <span key={interest} className="match-tag match-tag-interest">
            {interest}
          </span>
        ))}
      </div>

      <div className="match-card-reasons">
        {matchReasons.map((reason, idx) => (
          <span key={idx} className="match-reason">
            {reason}
          </span>
        ))}
      </div>

      <button
        className="match-card-breakdown-toggle"
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        {showBreakdown ? '점수 상세 숨기기' : '점수 상세 보기'}
      </button>

      {showBreakdown && <MatchScoreBreakdown breakdown={scoreBreakdown} />}

      <div className="match-card-actions">
        {showMessageInput ? (
          <div className="match-card-message-input">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요 (선택)"
              maxLength={500}
            />
            <div className="match-card-message-buttons">
              <button className="btn-send" onClick={handleSend} disabled={isSending}>
                {isSending ? '전송 중...' : '요청 보내기'}
              </button>
              <button className="btn-cancel" onClick={() => setShowMessageInput(false)}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn-match-request"
            onClick={() => setShowMessageInput(true)}
            disabled={isSending}
          >
            매칭 요청
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
