import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number; // 당기는 최소 거리 (px), 기본값 60
  disabled?: boolean;
}

interface UsePullToRefreshResult {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh(
  containerRef: React.RefObject<HTMLElement | null>,
  { onRefresh, threshold = 60, disabled = false }: UsePullToRefreshOptions
): UsePullToRefreshResult {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const isAtTop = useCallback((): boolean => {
    const el = containerRef.current;
    if (!el) return window.scrollY === 0;
    return el.scrollTop === 0;
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current ?? window;
    if (disabled) return;

    const handleTouchStart = (e: Event) => {
      const touch = (e as TouchEvent).touches[0];
      if (!isAtTop()) return;
      startYRef.current = touch.clientY;
      isDraggingRef.current = false;
    };

    const handleTouchMove = (e: Event) => {
      if (startYRef.current === null) return;
      if (!isAtTop()) return;

      const touch = (e as TouchEvent).touches[0];
      const dy = touch.clientY - startYRef.current;

      if (dy <= 0) {
        // 위로 스크롤 - 풀투리프레시 취소
        startYRef.current = null;
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      isDraggingRef.current = true;
      setIsPulling(true);
      // 저항감을 주어 실제 당긴 거리의 절반만 반영
      const dampedDistance = Math.min(dy * 0.5, threshold * 1.5);
      setPullDistance(dampedDistance);

      // 기본 스크롤 동작 방지
      if (dy > 5) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isDraggingRef.current) {
        startYRef.current = null;
        return;
      }

      const currentDistance = pullDistance;
      startYRef.current = null;
      isDraggingRef.current = false;
      setIsPulling(false);
      setPullDistance(0);

      if (currentDistance >= threshold * 0.5 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
    // pullDistance를 deps에 포함하면 매번 재등록되므로 ref를 통해 접근
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, disabled, isAtTop, onRefresh, threshold, isRefreshing]);

  return { isPulling, pullDistance, isRefreshing };
}

export default usePullToRefresh;
