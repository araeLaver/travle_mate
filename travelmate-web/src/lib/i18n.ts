import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
import koCommon from '../locales/ko/common.json';
import koAuth from '../locales/ko/auth.json';
import koNavigation from '../locales/ko/navigation.json';
import koNft from '../locales/ko/nft.json';
import koItinerary from '../locales/ko/itinerary.json';
import koChat from '../locales/ko/chat.json';
import koErrors from '../locales/ko/errors.json';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enNavigation from '../locales/en/navigation.json';
import enNft from '../locales/en/nft.json';
import enItinerary from '../locales/en/itinerary.json';
import enChat from '../locales/en/chat.json';
import enErrors from '../locales/en/errors.json';

const resources = {
  ko: {
    common: koCommon,
    auth: koAuth,
    navigation: koNavigation,
    nft: koNft,
    itinerary: koItinerary,
    chat: koChat,
    errors: koErrors,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    nft: enNft,
    itinerary: enItinerary,
    chat: enChat,
    errors: enErrors,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: ['common', 'auth', 'navigation', 'nft', 'itinerary', 'chat', 'errors'],

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    react: {
      useSuspense: true,
    },
  });

export const supportedLanguages = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  localStorage.setItem('i18nextLng', lang);
};

export const getCurrentLanguage = () => {
  return i18n.language || 'ko';
};

export default i18n;
