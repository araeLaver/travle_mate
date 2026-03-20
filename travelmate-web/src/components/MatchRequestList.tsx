import React from 'react';
import { MatchRequestResponse, MatchUserSummary } from '../types';
import MatchScoreBreakdown from './MatchScoreBreakdown';

interface MatchRequestListProps {
  requests: MatchRequestResponse[];
  type: 'received' | 'sent';
  onAccept?: (requestId: number) => void;
  onReject?: (requestId: number) => void;
  onCancel?: (requestId: number) => void;
  isResponding?: boolean;
}

const MatchRequestList: React.FC<MatchRequestListProps> = ({
  requests,
  type,
  onAccept,
  onReject,
  onCancel,
  isResponding,
}) => {
  if (requests.length === 0) {
    return (
      <div className="match-empty">
        <p>{type === 'received' ? '받은 매칭 요청이 없습니다.' : '보낸 매칭 요청이 없습니다.'}</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderUser = (user: MatchUserSummary) => (
    <div className="match-request-user">
      <div className="match-request-avatar">
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt={user.nickname} />
        ) : (
          <div className="match-request-avatar-placeholder">
            {user.nickname.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <span className="match-request-nickname">{user.nickname}</span>
        {user.age && <span className="match-request-age">{user.age}세</span>}
      </div>
    </div>
  );

  return (
    <div className="match-request-list">
      {requests.map(req => {
        const displayUser = type === 'received' ? req.requester : req.receiver;

        return (
          <div key={req.id} className="match-request-item">
            <div className="match-request-header">
              {renderUser(displayUser)}
              <div className="match-request-score">
                <span>{Math.round(req.totalScore)}점</span>
              </div>
            </div>

            {req.message && <p className="match-request-message">&quot;{req.message}&quot;</p>}

            <div className="match-request-meta">
              <span>{formatDate(req.createdAt)}</span>
              {req.expiresAt && (
                <span className="match-request-expires">만료: {formatDate(req.expiresAt)}</span>
              )}
            </div>

            <MatchScoreBreakdown breakdown={req.scoreBreakdown} />

            <div className="match-request-actions">
              {type === 'received' && (
                <>
                  <button
                    className="btn-accept"
                    onClick={() => onAccept?.(req.id)}
                    disabled={isResponding}
                  >
                    수락
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => onReject?.(req.id)}
                    disabled={isResponding}
                  >
                    거절
                  </button>
                </>
              )}
              {type === 'sent' && (
                <button
                  className="btn-cancel-request"
                  onClick={() => onCancel?.(req.id)}
                  disabled={isResponding}
                >
                  취소
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MatchRequestList;
