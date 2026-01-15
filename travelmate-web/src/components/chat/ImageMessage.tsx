import React, { useState } from 'react';
import './ImageMessage.css';

// SVG Icons
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const LoadingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

interface ImageMessageProps {
  imageUrl: string;
  thumbnailUrl?: string;
  alt?: string;
  isMyMessage?: boolean;
}

const ImageMessage: React.FC<ImageMessageProps> = ({
  imageUrl,
  thumbnailUrl,
  alt = '이미지 메시지',
  isMyMessage = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleClick = () => {
    if (!hasError) {
      setShowModal(true);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('이미지 다운로드 실패:', err);
    }
  };

  return (
    <>
      <div
        className={`image-message ${isMyMessage ? 'my-message' : ''}`}
        onClick={handleClick}
      >
        {isLoading && (
          <div className="image-loading">
            <LoadingIcon />
          </div>
        )}

        {hasError ? (
          <div className="image-error">
            <span>이미지를 불러올 수 없습니다</span>
          </div>
        ) : (
          <img
            src={thumbnailUrl || imageUrl}
            alt={alt}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        )}
      </div>

      {/* 이미지 모달 */}
      {showModal && (
        <div className="image-modal-overlay" onClick={handleClose}>
          <div className="image-modal">
            <div className="modal-header">
              <button className="close-btn" onClick={handleClose}>
                <CloseIcon />
              </button>
              <button className="download-btn" onClick={handleDownload}>
                <DownloadIcon />
              </button>
            </div>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <img src={imageUrl} alt={alt} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageMessage;
