import React from 'react';
import { MatchScoreBreakdown as BreakdownType } from '../types';

interface MatchScoreBreakdownProps {
  breakdown: BreakdownType;
}

const scoreItems = [
  { key: 'travelStyleScore' as const, label: '여행 스타일', max: 30, color: '#8b5cf6' },
  { key: 'scheduleOverlapScore' as const, label: '일정 겹침', max: 25, color: '#3b82f6' },
  { key: 'budgetScore' as const, label: '예산 유사도', max: 20, color: '#10b981' },
  { key: 'languageScore' as const, label: '언어 공통성', max: 15, color: '#f59e0b' },
  { key: 'ratingScore' as const, label: '사용자 평점', max: 10, color: '#ec4899' },
];

const MatchScoreBreakdown: React.FC<MatchScoreBreakdownProps> = ({ breakdown }) => {
  return (
    <div className="mb-4 p-3 bg-gray-100 dark:bg-black/15 rounded-xl">
      {scoreItems.map(({ key, label, max, color }) => {
        const value = breakdown[key] ?? 0;
        const percent = (value / max) * 100;

        return (
          <div key={key} className="mb-2.5 last:mb-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500 dark:text-white/70 text-xs">{label}</span>
              <span className="text-gray-700 dark:text-white/90 text-xs font-semibold">
                {typeof value === 'number' ? value.toFixed(1) : Number(value).toFixed(1)}/{max}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
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
