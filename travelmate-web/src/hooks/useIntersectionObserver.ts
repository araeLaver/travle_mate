import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface IntersectionResult {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

/**
 * Intersection Observer 훅
 * 요소가 뷰포트에 진입했는지 감지
 */
export function useIntersectionObserver<T extends Element>(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<T>, IntersectionResult] {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const elementRef = useRef<T>(null);
  const [result, setResult] = useState<IntersectionResult>({
    isIntersecting: false,
  });

  const frozen = result.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || frozen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setResult({
          isIntersecting: entry.isIntersecting,
          entry,
        });
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, frozen]);

  return [elementRef, result];
}

/**
 * 무한 스크롤 훅
 */
export function useInfiniteScroll(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
): React.RefObject<HTMLDivElement> {
  const [sentinelRef, { isIntersecting }] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '100px',
    ...options,
  });

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (isIntersecting) {
      callbackRef.current();
    }
  }, [isIntersecting]);

  return sentinelRef;
}

/**
 * Lazy Loading 이미지 훅
 */
export function useLazyImage(
  src: string,
  placeholder?: string
): { imageSrc: string; isLoaded: boolean; ref: React.RefObject<HTMLImageElement> } {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, { isIntersecting }] = useIntersectionObserver<HTMLImageElement>({
    freezeOnceVisible: true,
    rootMargin: '200px',
  });

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isIntersecting, src]);

  return { imageSrc, isLoaded, ref };
}

/**
 * 가시성 변화 감지 훅
 */
export function useOnScreen<T extends Element>(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<T>, boolean] {
  const [ref, { isIntersecting }] = useIntersectionObserver<T>(options);
  return [ref, isIntersecting];
}

/**
 * 컴포넌트 마운트 시 뷰포트에 있는지 확인
 */
export function useIsVisible<T extends Element>(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<T>, boolean] {
  const [ref, result] = useIntersectionObserver<T>({
    freezeOnceVisible: true,
    ...options,
  });
  return [ref, result.isIntersecting];
}

export default useIntersectionObserver;
