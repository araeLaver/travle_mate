/**
 * 접근성 유틸리티 함수
 */

import { KeyboardEvent, RefObject } from 'react';

/**
 * Enter 또는 Space 키 입력 시 클릭 이벤트 처리
 * 클릭 가능한 div 등 비표준 요소에 키보드 접근성 추가
 */
export function handleKeyboardClick(event: KeyboardEvent, callback: () => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
}

/**
 * 키보드 이벤트 핸들러 생성 헬퍼
 */
export function createKeyboardHandler(callback: () => void) {
  return (event: KeyboardEvent) => handleKeyboardClick(event, callback);
}

/**
 * 모달/다이얼로그 내 포커스 트랩
 * 포커스가 모달 밖으로 나가지 않도록 함
 */
export function trapFocus(containerRef: RefObject<HTMLElement>): () => void {
  const container = containerRef.current;
  if (!container) return () => {};

  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: globalThis.KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab: 첫 번째 요소에서 마지막으로 이동
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab: 마지막 요소에서 첫 번째로 이동
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Escape 키 핸들러
 */
export function handleEscapeKey(event: KeyboardEvent, callback: () => void): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    callback();
  }
}

/**
 * 화살표 키 네비게이션 핸들러 (탭, 리스트 등)
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onIndexChange: (newIndex: number) => void,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): void {
  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

  if (event.key === prevKey) {
    event.preventDefault();
    const newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
    onIndexChange(newIndex);
  } else if (event.key === nextKey) {
    event.preventDefault();
    const newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
    onIndexChange(newIndex);
  } else if (event.key === 'Home') {
    event.preventDefault();
    onIndexChange(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    onIndexChange(totalItems - 1);
  }
}

/**
 * 스크린 리더에 메시지 알림 (aria-live 영역 사용)
 */
let liveRegion: HTMLElement | null = null;

export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // 라이브 영역이 없으면 생성
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // 우선순위 업데이트
  liveRegion.setAttribute('aria-live', priority);

  // 메시지 설정 (빈 문자열로 리셋 후 설정해야 동일 메시지도 다시 읽음)
  liveRegion.textContent = '';
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);
}

/**
 * 요소에 포커스 이동 (스크롤 방지 옵션)
 */
export function focusElement(element: HTMLElement | null, preventScroll = false): void {
  if (element) {
    element.focus({ preventScroll });
  }
}

/**
 * 포커스 가능한 요소인지 확인
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return focusableSelectors.some(selector => element.matches(selector));
}

/**
 * 토스트/알림 타입에 따른 aria-label 반환
 */
export function getAlertLabel(type: 'success' | 'error' | 'warning' | 'info'): string {
  const labels = {
    success: '성공',
    error: '오류',
    warning: '경고',
    info: '정보',
  };
  return labels[type];
}

/**
 * ID 생성 헬퍼 (aria-labelledby 등에 사용)
 */
let idCounter = 0;
export function generateId(prefix = 'a11y'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
