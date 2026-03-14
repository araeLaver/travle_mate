/**
 * Accessibility Utilities
 *
 * Utilities and helpers for improving accessibility (a11y).
 */

/**
 * Announce a message to screen readers via aria-live region
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute(
    'style',
    'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;'
  );

  document.body.appendChild(announcement);

  // Allow the element to be added to the DOM before setting text
  setTimeout(() => {
    announcement.textContent = message;
  }, 100);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within an element (for modals, dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = element.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get unique ID for accessibility attributes
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Check if user prefers dark color scheme
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className =
    'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-indigo-600 focus:text-white';

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return link;
}

/**
 * Handle keyboard navigation for interactive lists
 */
export function handleListKeyboard(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect: (index: number) => void
): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      onSelect(Math.min(currentIndex + 1, items.length - 1));
      break;
    case 'ArrowUp':
      event.preventDefault();
      onSelect(Math.max(currentIndex - 1, 0));
      break;
    case 'Home':
      event.preventDefault();
      onSelect(0);
      break;
    case 'End':
      event.preventDefault();
      onSelect(items.length - 1);
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      items[currentIndex]?.click();
      break;
  }
}

/**
 * Get accessible label for rating
 */
export function getRatingLabel(rating: number, maxRating: number = 5): string {
  return `${rating} out of ${maxRating} stars`;
}

/**
 * Format number for screen readers (e.g., 1.5K -> 1,500)
 */
export function formatNumberAccessible(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Get accessible time description
 */
export function getTimeLabel(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Check if element is visible in viewport
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/**
 * Get contrast ratio between two colors (for accessibility validation)
 */
export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsContrastStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const standards = {
    AA: { normal: 4.5, large: 3 },
    AAA: { normal: 7, large: 4.5 },
  };

  return ratio >= standards[level][size];
}

const accessibilityUtils = {
  announce,
  trapFocus,
  generateId,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  createSkipLink,
  handleListKeyboard,
  getRatingLabel,
  formatNumberAccessible,
  getTimeLabel,
  isElementVisible,
  getContrastRatio,
  meetsContrastStandard,
};

export default accessibilityUtils;
