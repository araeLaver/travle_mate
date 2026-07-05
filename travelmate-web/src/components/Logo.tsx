import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

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
      ink: '#14213D',
      route: '#F97316',
      mint: '#2DD4BF',
      sand: '#F7F2E8',
    },
    white: {
      ink: '#FFFFFF',
      route: '#FFFFFF',
      mint: '#FFFFFF',
      sand: 'rgba(255,255,255,0.18)',
    },
    gradient: {
      ink: 'url(#fryndo-ink)',
      route: '#F97316',
      mint: '#2DD4BF',
      sand: '#FFFDF7',
    },
  };

  const colors = palette[variant];

  return (
    <svg
      className={`${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      viewBox="0 0 160 160"
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
            x1="24"
            y1="20"
            x2="138"
            y2="138"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#14213D" />
            <stop offset="0.52" stopColor="#0F766E" />
            <stop offset="1" stopColor="#F97316" />
          </linearGradient>
        </defs>
      )}
      <rect x="14" y="14" width="132" height="132" rx="42" fill={colors.sand} />
      <path
        d="M42 92C42 66.5949 62.5949 46 88 46H120V68H88C74.7452 68 64 78.7452 64 92V122H42V92Z"
        fill={colors.ink}
      />
      <path
        d="M76 98C76 83.6406 87.6406 72 102 72H121V94H102C99.7909 94 98 95.7909 98 98V122H76V98Z"
        fill={colors.route}
      />
      <circle cx="48" cy="48" r="12" fill={colors.mint} />
      <path
        d="M47 48C68.5 60 82.5 71.5 93 91"
        stroke={colors.mint}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="1 15"
      />
    </svg>
  );
};

export default Logo;
