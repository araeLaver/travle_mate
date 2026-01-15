/**
 * Accessibility Utilities Tests
 */

import {
  generateId,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  getRatingLabel,
  formatNumberAccessible,
  getTimeLabel,
  getContrastRatio,
  meetsContrastStandard,
  announce,
  isElementVisible,
} from './accessibility';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('accessibility utilities', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      expect(id1).not.toBe(id2);
    });

    it('should use default prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^a11y-\d+$/);
    });

    it('should use custom prefix', () => {
      const id = generateId('modal');
      expect(id).toMatch(/^modal-\d+$/);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return true when user prefers reduced motion', () => {
      mockMatchMedia(true);
      expect(prefersReducedMotion()).toBe(true);
    });

    it('should return false when user does not prefer reduced motion', () => {
      mockMatchMedia(false);
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('prefersHighContrast', () => {
    it('should return true when user prefers high contrast', () => {
      mockMatchMedia(true);
      expect(prefersHighContrast()).toBe(true);
    });

    it('should return false when user does not prefer high contrast', () => {
      mockMatchMedia(false);
      expect(prefersHighContrast()).toBe(false);
    });
  });

  describe('prefersDarkMode', () => {
    it('should return true when user prefers dark mode', () => {
      mockMatchMedia(true);
      expect(prefersDarkMode()).toBe(true);
    });

    it('should return false when user does not prefer dark mode', () => {
      mockMatchMedia(false);
      expect(prefersDarkMode()).toBe(false);
    });
  });

  describe('getRatingLabel', () => {
    it('should return accessible rating label', () => {
      expect(getRatingLabel(4)).toBe('4 out of 5 stars');
    });

    it('should handle custom max rating', () => {
      expect(getRatingLabel(8, 10)).toBe('8 out of 10 stars');
    });

    it('should handle zero rating', () => {
      expect(getRatingLabel(0)).toBe('0 out of 5 stars');
    });
  });

  describe('formatNumberAccessible', () => {
    it('should format large numbers with commas', () => {
      expect(formatNumberAccessible(1234567)).toBe('1,234,567');
    });

    it('should handle small numbers', () => {
      expect(formatNumberAccessible(42)).toBe('42');
    });

    it('should handle zero', () => {
      expect(formatNumberAccessible(0)).toBe('0');
    });
  });

  describe('getTimeLabel', () => {
    it('should return "Just now" for recent time', () => {
      const now = new Date();
      expect(getTimeLabel(now)).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const past = new Date(Date.now() - 5 * 60 * 1000);
      expect(getTimeLabel(past)).toBe('5 minutes ago');
    });

    it('should return hours ago', () => {
      const past = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(getTimeLabel(past)).toBe('2 hours ago');
    });

    it('should return days ago', () => {
      const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(getTimeLabel(past)).toBe('3 days ago');
    });

    it('should return full date for old dates', () => {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const label = getTimeLabel(past);
      expect(label).toContain('202');
    });

    it('should handle singular time units', () => {
      const past = new Date(Date.now() - 1 * 60 * 60 * 1000);
      expect(getTimeLabel(past)).toBe('1 hour ago');
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1 for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 0);
    });

    it('should calculate ratio for arbitrary colors', () => {
      const ratio = getContrastRatio('#4F46E5', '#ffffff');
      expect(ratio).toBeGreaterThan(1);
    });
  });

  describe('meetsContrastStandard', () => {
    it('should pass AA for normal text with ratio >= 4.5', () => {
      expect(meetsContrastStandard(4.5, 'AA', 'normal')).toBe(true);
      expect(meetsContrastStandard(4.4, 'AA', 'normal')).toBe(false);
    });

    it('should pass AA for large text with ratio >= 3', () => {
      expect(meetsContrastStandard(3, 'AA', 'large')).toBe(true);
      expect(meetsContrastStandard(2.9, 'AA', 'large')).toBe(false);
    });

    it('should pass AAA for normal text with ratio >= 7', () => {
      expect(meetsContrastStandard(7, 'AAA', 'normal')).toBe(true);
      expect(meetsContrastStandard(6.9, 'AAA', 'normal')).toBe(false);
    });

    it('should pass AAA for large text with ratio >= 4.5', () => {
      expect(meetsContrastStandard(4.5, 'AAA', 'large')).toBe(true);
      expect(meetsContrastStandard(4.4, 'AAA', 'large')).toBe(false);
    });
  });

  describe('announce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create announcement element', () => {
      announce('Test message');

      jest.advanceTimersByTime(100);

      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Cleanup
      jest.advanceTimersByTime(1000);
    });

    it('should use polite priority by default', () => {
      announce('Test message');

      jest.advanceTimersByTime(100);

      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion).toBeTruthy();

      jest.advanceTimersByTime(1000);
    });

    it('should use assertive priority when specified', () => {
      announce('Urgent message', 'assertive');

      jest.advanceTimersByTime(100);

      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      expect(assertiveRegion).toBeTruthy();

      jest.advanceTimersByTime(1000);
    });
  });

  describe('isElementVisible', () => {
    it('should return true for visible element', () => {
      const element = document.createElement('div');
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '100px';
      element.style.height = '100px';
      document.body.appendChild(element);

      expect(isElementVisible(element)).toBe(true);

      document.body.removeChild(element);
    });

    it('should return false for element outside viewport', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      // Mock getBoundingClientRect to simulate element outside viewport
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        top: -1000,
        left: -1000,
        bottom: -900,
        right: -900,
        width: 100,
        height: 100,
      });

      expect(isElementVisible(element)).toBe(false);

      document.body.removeChild(element);
    });
  });
});
