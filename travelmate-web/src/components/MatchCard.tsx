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
    <div className="bg-white/80 dark:bg-white/[0.08] backdrop-blur-xl border border-gray-200/50 dark:border-white/[0.12] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-xl dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-3.5 mb-3.5">
        <div>
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user.nickname}
              className="w-[52px] h-[52px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{user.nickname}</h3>
          <div className="flex gap-2 items-center text-gray-500 dark:text-white/60 text-sm">
            {user.age && <span>{user.age}세</span>}
            {user.travelStyle && (
              <span className="bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-md text-xs">
                {travelStyleLabels[user.travelStyle] || user.travelStyle}
              </span>
            )}
          </div>
        </div>
        <div
          className="w-14 h-14 rounded-full border-[3px] flex flex-col items-center justify-center shrink-0"
          style={{ borderColor: scoreColor }}
        >
          <span className="text-xl font-extrabold leading-none" style={{ color: scoreColor }}>
            {scorePercent}
          </span>
          <span className="text-[0.6rem] text-gray-400 dark:text-white/50">점</span>
        </div>
      </div>

      {user.bio && (
        <p className="text-gray-500 dark:text-white/60 text-sm mb-3 leading-relaxed line-clamp-2">
          {user.bio}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {user.languages?.slice(0, 3).map(lang => (
          <span
            key={lang}
            className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300"
          >
            {lang}
          </span>
        ))}
        {user.interests?.slice(0, 3).map(interest => (
          <span
            key={interest}
            className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
          >
            {interest}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3.5">
        {matchReasons.map((reason, idx) => (
          <span
            key={idx}
            className="bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 px-2.5 py-1 rounded-lg text-xs"
          >
            {reason}
          </span>
        ))}
      </div>

      <button
        className="w-full py-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/60 rounded-lg text-sm mb-3 transition-colors hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white"
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        {showBreakdown ? '점수 상세 숨기기' : '점수 상세 보기'}
      </button>

      {showBreakdown && <MatchScoreBreakdown breakdown={scoreBreakdown} />}

      <div className="mt-2">
        {showMessageInput ? (
          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요 (선택)"
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/[0.08] text-gray-900 dark:text-white text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-white/40 focus:ring-2 focus:ring-violet-500/50"
            />
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-bold transition-shadow hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] disabled:opacity-50"
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending ? '전송 중...' : '요청 보내기'}
              </button>
              <button
                className="px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 border border-gray-200 dark:border-white/15 rounded-xl transition-colors hover:bg-gray-200 dark:hover:bg-white/15"
                onClick={() => setShowMessageInput(false)}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
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
