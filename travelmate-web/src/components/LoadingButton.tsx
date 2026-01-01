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
    <button {...props} disabled={disabled || isLoading}>
      {isLoading ? (
        <span className="btn-spinner">
          <span className="loading-spinner small">
            <span className="spinner-ring"></span>
            <span className="spinner-ring"></span>
            <span className="spinner-ring"></span>
          </span>
          {loadingText || children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
