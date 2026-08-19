import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockConstants = {
  expoConfig: {
    extra: {
      webUrl: 'https://travelmate.app',
    },
  },
};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: mockConstants,
}));

const originalWebUrl = process.env.WEB_URL;
const originalExpoPublicWebUrl = process.env.EXPO_PUBLIC_WEB_URL;

const loadConfig = () => {
  jest.resetModules();
  return require('./appConfig') as typeof import('./appConfig');
};

describe('mobile appConfig', () => {
  beforeEach(() => {
    delete process.env.WEB_URL;
    delete process.env.EXPO_PUBLIC_WEB_URL;
    mockConstants.expoConfig.extra.webUrl = 'https://travelmate.app';
  });

  afterAll(() => {
    if (originalWebUrl === undefined) {
      delete process.env.WEB_URL;
    } else {
      process.env.WEB_URL = originalWebUrl;
    }

    if (originalExpoPublicWebUrl === undefined) {
      delete process.env.EXPO_PUBLIC_WEB_URL;
    } else {
      process.env.EXPO_PUBLIC_WEB_URL = originalExpoPublicWebUrl;
    }
  });

  it('builds app web URLs from app config extra without duplicate slashes', () => {
    mockConstants.expoConfig.extra.webUrl = 'https://travelmate.app/';
    const { buildWebUrl } = loadConfig();

    expect(buildWebUrl('/privacy')).toBe('https://travelmate.app/privacy');
    expect(buildWebUrl('terms')).toBe('https://travelmate.app/terms');
  });

  it('prefers EXPO_PUBLIC_WEB_URL over legacy WEB_URL and app config extra', () => {
    process.env.EXPO_PUBLIC_WEB_URL = 'https://public.example.com/';
    process.env.WEB_URL = 'https://legacy.example.com';
    mockConstants.expoConfig.extra.webUrl = 'https://extra.example.com';
    const { getWebBaseUrl } = loadConfig();

    expect(getWebBaseUrl()).toBe('https://public.example.com');
  });

  it('falls back to the TravelMate app domain when configured values are blank', () => {
    process.env.EXPO_PUBLIC_WEB_URL = '   ';
    process.env.WEB_URL = '   ';
    mockConstants.expoConfig.extra.webUrl = '   ';
    const { buildWebUrl } = loadConfig();

    expect(buildWebUrl('/terms')).toBe('https://travelmate.app/terms');
  });
});
