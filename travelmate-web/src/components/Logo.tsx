import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'white' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'default',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const iconColors = {
    default: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899'
    },
    white: {
      primary: '#ffffff',
      secondary: '#ffffff',
      accent: '#ffffff'
    },
    gradient: {
      primary: 'url(#logo-gradient)',
      secondary: 'url(#logo-gradient)',
      accent: 'url(#logo-gradient)'
    }
  };

  const colors = iconColors[variant];

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      )}

      {/* World Circle */}
      <circle
        cx="100"
        cy="100"
        r="85"
        stroke={colors.primary}
        strokeWidth="8"
        fill="none"
        opacity="0.3"
      />

      {/* Latitude Lines */}
      <ellipse
        cx="100"
        cy="100"
        rx="85"
        ry="40"
        stroke={colors.secondary}
        strokeWidth="4"
        fill="none"
        opacity="0.4"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="85"
        ry="60"
        stroke={colors.secondary}
        strokeWidth="3"
        fill="none"
        opacity="0.3"
      />

      {/* Longitude Line */}
      <ellipse
        cx="100"
        cy="100"
        rx="40"
        ry="85"
        stroke={colors.secondary}
        strokeWidth="4"
        fill="none"
        opacity="0.4"
      />

      {/* Airplane Icon */}
      <g transform="translate(80, 75)">
        <path
          d="M20 0L40 15L25 20L25 30L20 35L15 30L15 20L0 15L20 0Z"
          fill={colors.accent}
        />
        <circle cx="20" cy="12" r="3" fill={colors.primary} />
      </g>

      {/* Location Pin */}
      <g transform="translate(130, 120)">
        <path
          d="M10 0C4.5 0 0 4.5 0 10C0 17.5 10 30 10 30C10 30 20 17.5 20 10C20 4.5 15.5 0 10 0ZM10 14C7.8 14 6 12.2 6 10C6 7.8 7.8 6 10 6C12.2 6 14 7.8 14 10C14 12.2 12.2 14 10 14Z"
          fill={colors.primary}
        />
      </g>

      {/* Connection Lines - representing matching */}
      <line
        x1="60"
        y1="60"
        x2="140"
        y2="140"
        stroke={colors.accent}
        strokeWidth="3"
        strokeDasharray="5,5"
        opacity="0.5"
      />
      <circle cx="60" cy="60" r="6" fill={colors.accent} />
      <circle cx="140" cy="140" r="6" fill={colors.accent} />
    </svg>
  );
};

export default Logo;
