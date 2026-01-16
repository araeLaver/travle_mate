/**
 * 성능 최적화 유틸리티
 */

/**
 * 메모이제이션된 함수 생성
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * LRU 캐시가 있는 메모이제이션
 */
export function memoizeWithLRU<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 100,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keyOrder: string[] = [];

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      // Move to end (most recently used)
      const index = keyOrder.indexOf(key);
      if (index > -1) {
        keyOrder.splice(index, 1);
        keyOrder.push(key);
      }
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn(...args) as ReturnType<T>;

    // Add to cache
    cache.set(key, result);
    keyOrder.push(key);

    // Evict oldest if over limit
    while (keyOrder.length > maxSize) {
      const oldest = keyOrder.shift();
      if (oldest) {
        cache.delete(oldest);
      }
    }

    return result;
  }) as T;
}

/**
 * 배열 청크 분할
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 유니크 배열 생성
 */
export function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) {
    return Array.from(new Set(array));
  }

  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 배열 그룹화
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * 딥 프리즈 (불변 객체 생성)
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.keys(obj).forEach(prop => {
    const value = (obj as Record<string, unknown>)[prop];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as object);
    }
  });
  return Object.freeze(obj);
}

/**
 * 얕은 비교
 */
export function shallowEqual(
  obj1: Record<string, unknown> | null | undefined,
  obj2: Record<string, unknown> | null | undefined
): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => obj1[key] === obj2[key]);
}

/**
 * 깊은 비교
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (a === null || b === null) return a === b;

  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

/**
 * requestIdleCallback 폴리필
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && window.requestIdleCallback
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) =>
        setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);

export const cancelIdleCallback =
  typeof window !== 'undefined' && window.cancelIdleCallback
    ? window.cancelIdleCallback
    : clearTimeout;

/**
 * 유휴 시간에 작업 실행
 */
export function runWhenIdle<T>(tasks: (() => T)[], onComplete?: (results: T[]) => void): void {
  const results: T[] = [];
  let index = 0;

  function processNext(deadline: IdleDeadline) {
    while (index < tasks.length && deadline.timeRemaining() > 0) {
      results.push(tasks[index]());
      index++;
    }

    if (index < tasks.length) {
      requestIdleCallback(processNext);
    } else {
      onComplete?.(results);
    }
  }

  requestIdleCallback(processNext);
}

/**
 * 배열 정렬 (안정 정렬)
 */
export function stableSort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
  return array
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const order = compareFn(a.item, b.item);
      return order !== 0 ? order : a.index - b.index;
    })
    .map(({ item }) => item);
}

/**
 * 지연 평가 생성기
 */
export function* lazyMap<T, U>(array: T[], mapFn: (item: T, index: number) => U): Generator<U> {
  for (let index = 0; index < array.length; index++) {
    yield mapFn(array[index], index);
  }
}

/**
 * 지연 필터
 */
export function* lazyFilter<T>(
  array: T[],
  predicate: (item: T, index: number) => boolean
): Generator<T> {
  for (let index = 0; index < array.length; index++) {
    if (predicate(array[index], index)) {
      yield array[index];
    }
  }
}

/**
 * 페이지네이션 오프셋 계산
 */
export function calculateOffset(page: number, pageSize: number): number {
  return Math.max(0, (page - 1) * pageSize);
}

/**
 * 총 페이지 수 계산
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

/**
 * 숫자 포맷팅 (간략화)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * 바이트 포맷팅
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const performanceUtils = {
  memoize,
  memoizeWithLRU,
  chunk,
  unique,
  groupBy,
  deepFreeze,
  shallowEqual,
  deepEqual,
  requestIdleCallback,
  cancelIdleCallback,
  runWhenIdle,
  stableSort,
  lazyMap,
  lazyFilter,
  calculateOffset,
  calculateTotalPages,
  formatCompactNumber,
  formatBytes,
};

export default performanceUtils;
