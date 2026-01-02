import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  fullPage = false,
}) => {
  const loadingLabel = text || '로딩 중';

  return (
    <div
      className={`loading-spinner-container ${fullPage ? 'full-page' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={loadingLabel}
    >
      <div className={`loading-spinner ${size}`} aria-hidden="true">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
      {!text && <span className="sr-only">로딩 중</span>}
    </div>
  );
};

export default LoadingSpinner;
