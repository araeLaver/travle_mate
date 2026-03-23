/**
 * useAccessibility Hook
 *
 * React hook for accessibility features.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import {
  announce,
  trapFocus,
  generateId,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
} from '../lib/accessibility';

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnounce() {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announce(message, priority);
  }, []);
}

/**
 * Hook for trapping focus within a container (for modals/dialogs)
 */
export function useFocusTrap(isActive: boolean = true): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Trap focus
    const cleanup = trapFocus(ref.current);

    return () => {
      cleanup();
      // Restore focus to previous element
      previousFocusRef.current?.focus();
    };
  }, [isActive]);

  return ref;
}

/**
 * Hook for generating unique IDs for accessibility attributes
 */
export function useId(prefix: string = 'a11y'): string {
  const idRef = useRef<string | null>(null);

  if (idRef.current === null) {
    idRef.current = generateId(prefix);
  }

  return idRef.current;
}

interface MediaPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersDarkMode: boolean;
}

/**
 * Hook for detecting user media preferences
 */
export function useMediaPreferences(): MediaPreferences {
  const [preferences, setPreferences] = useState<MediaPreferences>({
    prefersReducedMotion: prefersReducedMotion(),
    prefersHighContrast: prefersHighContrast(),
    prefersDarkMode: prefersDarkMode(),
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrast = window.matchMedia('(prefers-contrast: more)');
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)');

    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: reducedMotion.matches,
        prefersHighContrast: highContrast.matches,
        prefersDarkMode: darkMode.matches,
      });
    };

    reducedMotion.addEventListener('change', updatePreferences);
    highContrast.addEventListener('change', updatePreferences);
    darkMode.addEventListener('change', updatePreferences);

    return () => {
      reducedMotion.removeEventListener('change', updatePreferences);
      highContrast.removeEventListener('change', updatePreferences);
      darkMode.removeEventListener('change', updatePreferences);
    };
  }, []);

  return preferences;
}

/**
 * Hook for keyboard navigation in lists
 */
export function useListNavigation(itemCount: number, onSelect?: (index: number) => void) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let newIndex = activeIndex;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          newIndex = Math.min(activeIndex + 1, itemCount - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = Math.max(activeIndex - 1, 0);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = itemCount - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect?.(activeIndex);
          return;
        default:
          return;
      }

      setActiveIndex(newIndex);
    },
    [activeIndex, itemCount, onSelect]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      'aria-selected': index === activeIndex,
      tabIndex: index === activeIndex ? 0 : -1,
      role: 'option',
    }),
    [activeIndex]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getItemProps,
  };
}

/**
 * Hook for managing live regions
 */
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback(
    (newMessage: string, newPriority: 'polite' | 'assertive' = 'polite') => {
      // Clear first to ensure announcement
      setMessage('');
      setPriority(newPriority);

      setTimeout(() => {
        setMessage(newMessage);
      }, 100);
    },
    []
  );

  const LiveRegion = useCallback(
    () => (
      <div aria-live={priority} aria-atomic="true" className="sr-only" role="status">
        {message}
      </div>
    ),
    [message, priority]
  );

  return { announce, LiveRegion };
}

/**
 * Hook for skip link functionality
 */
export function useSkipLink(targetId: string) {
  const skipToContent = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [targetId]);

  return skipToContent;
}

/**
 * Hook for detecting keyboard vs mouse navigation
 */
export function useKeyboardNavigation(): boolean {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}

const accessibilityHooks = {
  useAnnounce,
  useFocusTrap,
  useId,
  useMediaPreferences,
  useListNavigation,
  useLiveRegion,
  useSkipLink,
  useKeyboardNavigation,
};

export default accessibilityHooks;
