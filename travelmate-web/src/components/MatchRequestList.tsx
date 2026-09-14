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
      <div className="text-center py-12 text-gray-400 dark:text-white/50">
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
    <div className="flex items-center gap-3">
      <div>
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user.nickname}
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-primary-400 flex items-center justify-center font-bold text-white">
            {user.nickname.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <span className="text-ink dark:text-white font-bold">{user.nickname}</span>
        {user.age && (
          <span className="text-gray-400 dark:text-white/50 text-sm ml-2">{user.age}세</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {requests.map(req => {
        const displayUser = type === 'received' ? req.requester : req.receiver;

        return (
          <div
            key={req.id}
            className="bg-white dark:bg-white/[0.08] rounded-[18px] shadow-[0_10px_30px_rgba(16,16,20,0.06)] p-5"
          >
            <div className="flex justify-between items-center mb-3">
              {renderUser(displayUser)}
              <div className="bg-primary-100 dark:bg-primary-500/20 text-primary-500 dark:text-primary-400 px-3.5 py-1.5 rounded-xl font-extrabold">
                <span>{Math.round(req.totalScore)}점</span>
              </div>
            </div>

            {req.message && (
              <p className="text-gray-500 dark:text-white/60 italic text-sm mb-2.5">
                {'"'}
                {req.message}
                {'"'}
              </p>
            )}

            <div className="flex gap-4 text-gray-400 dark:text-white/40 text-xs mb-3">
              <span>{formatDate(req.createdAt)}</span>
              {req.expiresAt && (
                <span className="text-rarity-legendary dark:text-amber-400">
                  만료: {formatDate(req.expiresAt)}
                </span>
              )}
            </div>

            <MatchScoreBreakdown breakdown={req.scoreBreakdown} />

            <div className="flex gap-2.5 mt-3.5">
              {type === 'received' && (
                <>
                  <button
                    className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-[0_8px_22px_rgba(74,58,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onAccept?.(req.id)}
                    disabled={isResponding}
                  >
                    수락
                  </button>
                  <button
                    className="flex-1 py-2.5 bg-white dark:bg-red-500/20 text-danger dark:text-red-300 border border-[#F0D6D3] dark:border-red-500/30 rounded-xl font-bold transition-colors hover:bg-[#FDF4F3] dark:hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onReject?.(req.id)}
                    disabled={isResponding}
                  >
                    거절
                  </button>
                </>
              )}
              {type === 'sent' && (
                <button
                  className="flex-1 py-2.5 bg-sand-200 dark:bg-white/10 text-ink dark:text-white/70 rounded-xl font-bold transition-colors hover:bg-sand-400 dark:hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
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
