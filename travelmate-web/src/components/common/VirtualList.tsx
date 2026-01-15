import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  keyExtractor?: (item: T, index: number) => string | number;
}

interface VisibleRange {
  start: number;
  end: number;
}

/**
 * 가상화된 리스트 컴포넌트
 * 대량의 아이템을 효율적으로 렌더링
 */
function VirtualListInner<T>(
  props: VirtualListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
    className = '',
    onEndReached,
    endReachedThreshold = 200,
    keyExtractor = (_, index) => index,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 전체 리스트 높이
  const totalHeight = items.length * itemHeight;

  // 보이는 아이템 범위 계산
  const visibleRange = useMemo<VisibleRange>(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 스크롤 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // 끝에 도달 체크
    if (onEndReached) {
      const distanceFromEnd = totalHeight - (target.scrollTop + containerHeight);
      if (distanceFromEnd < endReachedThreshold) {
        onEndReached();
      }
    }
  }, [totalHeight, containerHeight, endReachedThreshold, onEndReached]);

  // 보이는 아이템만 렌더링
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const item = items[i];
      if (item) {
        result.push(
          <div
            key={keyExtractor(item, i)}
            style={{
              position: 'absolute',
              top: i * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, i)}
          </div>
        );
      }
    }

    return result;
  }, [items, visibleRange, itemHeight, renderItem, keyExtractor]);

  // ref 연결
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(containerRef.current);
      } else {
        ref.current = containerRef.current;
      }
    }
  }, [ref]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

// forwardRef를 사용한 제네릭 컴포넌트
export const VirtualList = React.forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

/**
 * 가변 높이 가상 리스트 (간단한 구현)
 */
interface VariableHeightListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, measure: () => void) => React.ReactNode;
  className?: string;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function VariableHeightList<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  className = '',
  keyExtractor = (_, index) => index,
}: VariableHeightListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeights = useRef<Map<number, number>>(new Map());
  const [, forceUpdate] = useState({});

  const measureItem = useCallback((index: number) => {
    return () => {
      const element = containerRef.current?.querySelector(`[data-index="${index}"]`);
      if (element) {
        const height = element.getBoundingClientRect().height;
        if (itemHeights.current.get(index) !== height) {
          itemHeights.current.set(index, height);
          forceUpdate({});
        }
      }
    };
  }, []);

  const getItemHeight = useCallback((index: number) => {
    return itemHeights.current.get(index) || estimatedItemHeight;
  }, [estimatedItemHeight]);

  const totalHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items.map((item, index) => {
          let top = 0;
          for (let i = 0; i < index; i++) {
            top += getItemHeight(i);
          }

          return (
            <div
              key={keyExtractor(item, index)}
              data-index={index}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, index, measureItem(index))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualList;
