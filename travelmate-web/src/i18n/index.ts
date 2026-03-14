/**
 * TravelMate i18n (Internationalization) System
 *
 * Lightweight translation system supporting Korean and English.
 */

import ko from './locales/ko';
import en from './locales/en';

export type Language = 'ko' | 'en';

export interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
  ko,
  en,
};

// Default language
let currentLanguage: Language = 'ko';

/**
 * Get the current language
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Set the current language
 */
export function setLanguage(lang: Language): void {
  if (translations[lang]) {
    currentLanguage = lang;
    // Save preference
    localStorage.setItem('tm_language', lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  }
}

/**
 * Initialize language from stored preference or browser setting
 */
export function initializeLanguage(): Language {
  // Check localStorage first
  const stored = localStorage.getItem('tm_language') as Language | null;
  if (stored && translations[stored]) {
    currentLanguage = stored;
    document.documentElement.lang = stored;
    return stored;
  }

  // Fall back to browser language
  const browserLang = navigator.language.split('-')[0] as Language;
  if (translations[browserLang]) {
    currentLanguage = browserLang;
    document.documentElement.lang = browserLang;
    return browserLang;
  }

  // Default to Korean
  currentLanguage = 'ko';
  document.documentElement.lang = 'ko';
  return 'ko';
}

/**
 * Get a nested translation value using dot notation
 */
function getNestedValue(obj: Translations, path: string): string | undefined {
  const keys = path.split('.');
  let current: Translations | string | undefined = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Translate a key to the current language
 * Supports dot notation for nested keys: 'common.loading'
 * Supports interpolation: 'Hello, {name}!' with { name: 'John' }
 */
export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  const translation = getNestedValue(translations[currentLanguage], key);

  if (!translation) {
    // Fall back to English if available
    const englishTranslation = getNestedValue(translations.en, key);
    if (englishTranslation) {
      // eslint-disable-next-line no-console
      console.warn(`Missing translation for '${key}' in ${currentLanguage}`);
      return interpolate(englishTranslation, params);
    }

    // Return the key itself if no translation found
    // eslint-disable-next-line no-console
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }

  return interpolate(translation, params);
}

/**
 * Interpolate parameters into a string
 */
function interpolate(
  str: string,
  params?: Record<string, string | number>
): string {
  if (!params) return str;

  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() ?? match;
  });
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'ko', name: '한국어' },
    { code: 'en', name: 'English' },
  ];
}

/**
 * Format date according to current locale
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(d);
}

/**
 * Format number according to current locale
 */
export function formatNumber(
  num: number,
  options?: Intl.NumberFormatOptions
): string {
  const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format currency according to current locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'KRW'
): string {
  const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
  }).format(amount);
}

/**
 * Format relative time (e.g., "3 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  return rtf.format(-seconds, 'second');
}

const i18nUtils = {
  t,
  getLanguage,
  setLanguage,
  initializeLanguage,
  getAvailableLanguages,
  formatDate,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
};

export default i18nUtils;
