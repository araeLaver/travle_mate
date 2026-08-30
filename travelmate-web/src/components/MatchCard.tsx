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
  const scoreColor = scorePercent >= 75 ? '#3F8F5F' : scorePercent >= 50 ? '#E0952A' : '#B4453B';

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
    <div className="bg-white dark:bg-white/[0.08] rounded-[18px] shadow-[0_10px_30px_rgba(16,16,20,0.06)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(16,16,20,0.1)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-3.5 mb-3.5">
        <div>
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={user.nickname}
              className="w-[52px] h-[52px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[52px] h-[52px] rounded-full bg-primary-400 flex items-center justify-center text-xl font-bold text-white">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-extrabold tracking-tight text-ink dark:text-white mb-1">
            {user.nickname}
          </h3>
          <div className="flex gap-2 items-center text-gray-500 dark:text-white/60 text-sm">
            {user.age && <span>{user.age}세</span>}
            {user.travelStyle && (
              <span className="bg-primary-100 dark:bg-primary-500/20 text-primary-500 dark:text-primary-400 px-2 py-0.5 rounded-[7px] text-xs font-bold">
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
            className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rarity-rare/10 dark:bg-blue-500/20 text-rarity-rare dark:text-blue-300"
          >
            {lang}
          </span>
        ))}
        {user.interests?.slice(0, 3).map(interest => (
          <span
            key={interest}
            className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-success/10 dark:bg-emerald-500/20 text-success dark:text-emerald-300"
          >
            {interest}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3.5">
        {matchReasons.map((reason, idx) => (
          <span
            key={idx}
            className="bg-rarity-legendary/10 dark:bg-amber-500/15 text-rarity-legendary dark:text-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold"
          >
            {reason}
          </span>
        ))}
      </div>

      <button
        className="w-full py-2 bg-sand-100 dark:bg-white/5 text-[#74747F] dark:text-white/60 rounded-lg text-sm font-bold mb-3 transition-colors hover:bg-sand-200 dark:hover:bg-white/10 hover:text-ink dark:hover:text-white"
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
              className="w-full px-3.5 py-2.5 rounded-[13px] border border-transparent bg-sand-100 dark:bg-white/[0.08] text-ink dark:text-white text-sm outline-none placeholder:text-[#9A9AA4] dark:placeholder:text-white/40 focus:bg-white focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-[0_8px_22px_rgba(74,58,255,0.3)] disabled:opacity-50"
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending ? '전송 중...' : '요청 보내기'}
              </button>
              <button
                className="px-4 py-2.5 bg-sand-200 dark:bg-white/10 text-ink dark:text-white/70 rounded-xl font-bold transition-colors hover:bg-sand-400 dark:hover:bg-white/15"
                onClick={() => setShowMessageInput(false)}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            className="w-full py-3 bg-primary-500 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(74,58,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
