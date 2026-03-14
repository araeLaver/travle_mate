/**
 * useTranslation Hook
 *
 * React hook for using the i18n translation system.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  t,
  getLanguage,
  setLanguage,
  getAvailableLanguages,
  formatDate,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
  Language,
} from '../i18n';

interface UseTranslationReturn {
  /** Translate a key */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Current language */
  language: Language;
  /** Change language */
  changeLanguage: (lang: Language) => void;
  /** Available languages */
  languages: { code: Language; name: string }[];
  /** Format date */
  formatDate: typeof formatDate;
  /** Format number */
  formatNumber: typeof formatNumber;
  /** Format currency */
  formatCurrency: typeof formatCurrency;
  /** Format relative time */
  formatRelativeTime: typeof formatRelativeTime;
}

/**
 * Hook for using translations in React components
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, language, changeLanguage } = useTranslation();
 *
 *   return (
 *     <div>
 *       <p>{t('common.loading')}</p>
 *       <button onClick={() => changeLanguage('en')}>
 *         English
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTranslation(): UseTranslationReturn {
  const [language, setLang] = useState<Language>(getLanguage());

  // Listen for language changes (e.g., from other components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tm_language' && e.newValue) {
        setLang(e.newValue as Language);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    setLang(lang);
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
  }, []);

  // Listen for same-tab language changes
  useEffect(() => {
    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: Language }>;
      setLang(customEvent.detail.language);
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  return {
    t,
    language,
    changeLanguage,
    languages: getAvailableLanguages(),
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
  };
}

export default useTranslation;
