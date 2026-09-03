import Constants from 'expo-constants';

const DEFAULT_WEB_URL = 'https://fryndo.com';
const EXPO_PUBLIC_WEB_URL_ENV_KEY = 'EXPO_PUBLIC_WEB_URL';

const getNonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const getExtraString = (key: string): string | undefined => {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  return getNonEmptyString(extra?.[key]);
};

export const getWebBaseUrl = (): string =>
  trimTrailingSlash(
    getNonEmptyString(process.env.EXPO_PUBLIC_WEB_URL) ||
      getNonEmptyString(process.env[EXPO_PUBLIC_WEB_URL_ENV_KEY]) ||
      getNonEmptyString(process.env.WEB_URL) ||
      getExtraString('webUrl') ||
      DEFAULT_WEB_URL
  );

export const buildWebUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getWebBaseUrl()}${normalizedPath}`;
};
