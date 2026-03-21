import React from 'react';
import './LoadingSpinner.css';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className="btn-spinner">
          <span className="loading-spinner small" aria-hidden="true">
            <span className="spinner-ring"></span>
            <span className="spinner-ring"></span>
            <span className="spinner-ring"></span>
          </span>
          <span>{loadingText || children}</span>
          <span className="sr-only">처리 중</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
