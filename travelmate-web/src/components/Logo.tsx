import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

/**
 * Fryndo compass mark — design system option 1b (선택).
 * Rounded tile + ink circle + indigo compass needle.
 */
const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'default',
  size = 'md',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const palette = {
    default: {
      tile: '#F0EFEB',
      ring: '#101014',
      needle: '#4A3AFF',
    },
    white: {
      tile: 'rgba(255,255,255,0.92)',
      ring: '#101014',
      needle: '#4A3AFF',
    },
    gradient: {
      tile: '#F0EFEB',
      ring: 'url(#fryndo-ink)',
      needle: '#4A3AFF',
    },
  };

  const colors = palette[variant];

  return (
    <svg
      className={`${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      role="img"
      aria-label="Fryndo logo"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient
            id="fryndo-ink"
            x1="8"
            y1="8"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#101014" />
            <stop offset="1" stopColor="#4A3AFF" />
          </linearGradient>
        </defs>
      )}
      <rect width="40" height="40" rx="11" fill={colors.tile} />
      <circle cx="20" cy="20" r="11.3" fill="none" stroke={colors.ring} strokeWidth="1.8" />
      <path d="m25 15-3 8-8 3 3-8Z" fill={colors.needle} />
    </svg>
  );
};

export default Logo;
