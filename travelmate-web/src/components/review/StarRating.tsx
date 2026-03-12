import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  /** 읽기 전용 모드 (표시만 할 때) */
  readOnly?: boolean;
  /** 별 크기 (tailwind w/h class) - 기본값 6 */
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 6,
}) => {
  const [hovered, setHovered] = useState(0);

  const displayValue = hovered > 0 ? hovered : value;

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="별점 선택"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            aria-label={`${star}점`}
            onClick={() => !readOnly && onChange(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={[
              `w-${size} h-${size}`,
              'transition-transform duration-100',
              readOnly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded',
              filled
                ? 'text-amber-400'
                : 'text-gray-300 dark:text-gray-600',
            ].join(' ')}
          >
            <svg
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              className="w-full h-full"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}

      {!readOnly && (
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 min-w-[3rem]">
          {value > 0 ? `${value}점` : '선택'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
