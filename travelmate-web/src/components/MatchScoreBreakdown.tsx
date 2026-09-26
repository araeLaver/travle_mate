import React from 'react';
import { MatchScoreBreakdown as BreakdownType } from '../types';

interface MatchScoreBreakdownProps {
  breakdown: BreakdownType;
}

const scoreItems = [
  { key: 'travelStyleScore' as const, label: '여행 스타일', max: 30, color: '#4A3AFF' },
  { key: 'scheduleOverlapScore' as const, label: '일정 겹침', max: 25, color: '#2E7DF6' },
  { key: 'budgetScore' as const, label: '예산 유사도', max: 20, color: '#3F8F5F' },
  { key: 'languageScore' as const, label: '언어 공통성', max: 15, color: '#E0952A' },
  { key: 'ratingScore' as const, label: '사용자 평점', max: 10, color: '#8B45E8' },
];

const MatchScoreBreakdown: React.FC<MatchScoreBreakdownProps> = ({ breakdown }) => {
  return (
    <div className="mb-4 p-3 bg-sand-100 dark:bg-black/15 rounded-xl">
      {scoreItems.map(({ key, label, max, color }) => {
        const value = breakdown[key] ?? 0;
        const percent = (value / max) * 100;

        return (
          <div key={key} className="mb-2.5 last:mb-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#74747F] dark:text-white/70 text-xs">{label}</span>
              <span className="text-ink dark:text-white/90 text-xs font-bold">
                {typeof value === 'number' ? value.toFixed(1) : Number(value).toFixed(1)}/{max}
              </span>
            </div>
            <div className="h-1.5 bg-[#EDECE8] dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MatchScoreBreakdown;
