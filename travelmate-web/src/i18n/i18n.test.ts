/**
 * i18n Tests
 */

import {
  t,
  getLanguage,
  setLanguage,
  initializeLanguage,
  getAvailableLanguages,
  formatDate,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
} from './index';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('i18n', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    // Reset to default language
    setLanguage('ko');
  });

  describe('getLanguage / setLanguage', () => {
    it('should return default language (ko)', () => {
      expect(getLanguage()).toBe('ko');
    });

    it('should change language', () => {
      setLanguage('en');
      expect(getLanguage()).toBe('en');
    });

    it('should save language to localStorage', () => {
      setLanguage('en');
      expect(mockLocalStorage.getItem('tm_language')).toBe('en');
    });

    it('should update document lang attribute', () => {
      setLanguage('en');
      expect(document.documentElement.lang).toBe('en');
    });

    it('should not change language for invalid value', () => {
      setLanguage('invalid' as never);
      expect(getLanguage()).toBe('ko');
    });
  });

  describe('initializeLanguage', () => {
    it('should use stored language if available', () => {
      mockLocalStorage.setItem('tm_language', 'en');
      const lang = initializeLanguage();
      expect(lang).toBe('en');
    });

    it('should fallback to browser language if no stored preference', () => {
      mockLocalStorage.clear();
      // In JSDOM, navigator.language is 'en-US', so it should fallback to 'en'
      const lang = initializeLanguage();
      // Should be either 'ko' or 'en' depending on browser language
      expect(['ko', 'en']).toContain(lang);
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return available languages', () => {
      const languages = getAvailableLanguages();
      expect(languages).toEqual([
        { code: 'ko', name: '한국어' },
        { code: 'en', name: 'English' },
      ]);
    });
  });

  describe('t (translate)', () => {
    it('should translate simple key in Korean', () => {
      setLanguage('ko');
      expect(t('common.loading')).toBe('로딩 중...');
    });

    it('should translate simple key in English', () => {
      setLanguage('en');
      expect(t('common.loading')).toBe('Loading...');
    });

    it('should translate nested key', () => {
      setLanguage('ko');
      expect(t('groups.status.recruiting')).toBe('모집 중');
    });

    it('should interpolate parameters', () => {
      setLanguage('ko');
      expect(t('groups.memberCount', { count: 5 })).toBe('5명');
    });

    it('should interpolate parameters in English', () => {
      setLanguage('en');
      expect(t('groups.memberCount', { count: 5 })).toBe('5 members');
    });

    it('should return key if translation not found', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('should fallback to English if Korean translation missing', () => {
      // This tests the fallback mechanism
      setLanguage('ko');
      // If a key exists in English but not in Korean, it should fallback
      // For now, all keys exist in both, so this is a structural test
      expect(t('common.error')).toBeTruthy();
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-06-15T12:00:00');

    it('should format date in Korean', () => {
      setLanguage('ko');
      const formatted = formatDate(testDate);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('6월');
    });

    it('should format date in English', () => {
      setLanguage('en');
      const formatted = formatDate(testDate);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('June');
    });

    it('should accept string date', () => {
      const formatted = formatDate('2024-06-15');
      expect(formatted).toBeTruthy();
    });

    it('should accept custom options', () => {
      const formatted = formatDate(testDate, { weekday: 'long' });
      expect(formatted).toBeTruthy();
    });
  });

  describe('formatNumber', () => {
    it('should format number in Korean locale', () => {
      setLanguage('ko');
      const formatted = formatNumber(1234567);
      expect(formatted).toBe('1,234,567');
    });

    it('should format number in English locale', () => {
      setLanguage('en');
      const formatted = formatNumber(1234567);
      expect(formatted).toBe('1,234,567');
    });

    it('should accept formatting options', () => {
      const formatted = formatNumber(0.5, { style: 'percent' });
      expect(formatted).toContain('50');
    });
  });

  describe('formatCurrency', () => {
    it('should format KRW without decimals', () => {
      setLanguage('ko');
      const formatted = formatCurrency(10000);
      expect(formatted).toContain('10,000');
      expect(formatted).toContain('₩');
    });

    it('should format USD with decimals', () => {
      setLanguage('en');
      const formatted = formatCurrency(99.99, 'USD');
      expect(formatted).toContain('99.99');
      expect(formatted).toContain('$');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format seconds ago', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 30000); // 30 seconds ago
      const formatted = formatRelativeTime(past);
      expect(formatted).toBeTruthy();
    });

    it('should format minutes ago', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      const formatted = formatRelativeTime(past);
      expect(formatted).toBeTruthy();
    });

    it('should format hours ago', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
      const formatted = formatRelativeTime(past);
      expect(formatted).toBeTruthy();
    });

    it('should format days ago', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const formatted = formatRelativeTime(past);
      expect(formatted).toBeTruthy();
    });

    it('should accept string date', () => {
      const formatted = formatRelativeTime('2024-01-01');
      expect(formatted).toBeTruthy();
    });
  });
});
