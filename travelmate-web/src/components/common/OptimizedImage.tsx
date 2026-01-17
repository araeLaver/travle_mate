import React, { useState, useEffect, useRef, memo } from 'react';
import { useLazyImage } from '../../hooks/useIntersectionObserver';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholder?: string;
  blurDataURL?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 최적화된 이미지 컴포넌트
 * - Lazy loading
 * - 플레이스홀더 지원
 * - 에러 핸들링
 * - 페이드인 애니메이션
 */
function OptimizedImageComponent({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  blurDataURL,
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // 블러 플레이스홀더 생성
  const defaultPlaceholder = blurDataURL ||
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+';

  // Hook은 항상 호출 (React Hooks 규칙 준수)
  const lazyImageResult = useLazyImage(src, defaultPlaceholder);

  // Priority 이미지는 즉시 로드, 아니면 lazy loading 사용
  const imageSrc = priority ? src : lazyImageResult.imageSrc;
  const lazyLoaded = priority ? true : lazyImageResult.isLoaded;
  const ref = priority ? imgRef : lazyImageResult.ref;

  useEffect(() => {
    if (lazyLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [lazyLoaded, onLoad]);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* 플레이스홀더 */}
      {!isLoaded && placeholder && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full blur-sm scale-110"
          style={{ objectFit }}
          aria-hidden="true"
        />
      )}

      {/* 실제 이미지 */}
      <img
        ref={ref as React.RefObject<HTMLImageElement>}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ objectFit }}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
      />

      {/* 로딩 스피너 */}
      {!isLoaded && !placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export const OptimizedImage = memo(OptimizedImageComponent);

/**
 * 아바타 이미지 컴포넌트
 */
interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

function AvatarImageComponent({
  src,
  alt,
  size = 'md',
  className = '',
  fallback,
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClass = sizeMap[size];

  // 폴백 이니셜 생성
  const initials = alt
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium rounded-full ${sizeClass} ${className}`}
      >
        {fallback || initials || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ${sizeClass} ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}

export const AvatarImage = memo(AvatarImageComponent);

/**
 * 이미지 갤러리용 썸네일
 */
interface ThumbnailProps {
  src: string;
  alt: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

function ThumbnailComponent({
  src,
  alt,
  onClick,
  selected = false,
  className = '',
}: ThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-16 h-16 rounded-lg overflow-hidden transition-all ${
        selected ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:opacity-80'
      } ${className}`}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        className="w-full h-full"
        objectFit="cover"
      />
    </button>
  );
}

export const Thumbnail = memo(ThumbnailComponent);

export default OptimizedImage;
