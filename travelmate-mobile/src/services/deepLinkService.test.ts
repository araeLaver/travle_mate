import { describe, expect, it, jest } from '@jest/globals';
import {
  handleDeepLinkUrl,
  linkingConfig,
  parseDeepLink,
  setNavigationRef,
} from './deepLinkService';

jest.mock('react-native', () => ({
  Linking: {
    getInitialURL: jest.fn(() => Promise.resolve(null)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

describe('deepLinkService parsing', () => {
  it('parses supported custom scheme and universal links', () => {
    expect(parseDeepLink('fryndo://location/42')).toEqual({
      screen: 'LocationDetail',
      params: { locationId: 42 },
    });
    expect(parseDeepLink('https://fryndo.com/user/77')).toEqual({
      screen: 'UserProfile',
      params: { userId: 77 },
    });
    expect(parseDeepLink('fryndo://chat/9?name=서울%20채팅')).toEqual({
      screen: 'ChatRoom',
      params: { groupId: 9, groupName: '서울 채팅' },
    });
  });

  it('parses review links with match and target user ids', () => {
    expect(parseDeepLink('https://fryndo.com/review/15/88')).toEqual({
      screen: 'Review',
      params: { matchId: 15, targetUserId: 88 },
    });
  });

  it('rejects partial, missing, zero, and negative numeric ids', () => {
    expect(parseDeepLink('fryndo://location/42abc')).toBeNull();
    expect(parseDeepLink('fryndo://location/0')).toBeNull();
    expect(parseDeepLink('fryndo://chat/-9')).toBeNull();
    expect(parseDeepLink('https://fryndo.com/review/15')).toBeNull();
    expect(parseDeepLink('https://fryndo.com/user/1.5')).toBeNull();
  });

  it('keeps React Navigation review parsing strict for malformed ids', () => {
    const reviewConfig = (linkingConfig.config.screens.Review as {
      parse: {
        matchId: (value: string) => number;
        targetUserId: (value: string) => number;
      };
    });

    expect(reviewConfig.parse.matchId('15')).toBe(15);
    expect(reviewConfig.parse.targetUserId('88')).toBe(88);
    expect(Number.isNaN(reviewConfig.parse.matchId('15abc'))).toBe(true);
    expect(Number.isNaN(reviewConfig.parse.targetUserId('0'))).toBe(true);
  });

  it('navigates parsed deep links only when navigation is ready', () => {
    const navigate = jest.fn();
    setNavigationRef({
      isReady: () => true,
      navigate,
    } as any);

    expect(handleDeepLinkUrl('fryndo://chat/9?name=서울%20채팅')).toBe(true);
    expect(navigate).toHaveBeenCalledWith('ChatRoom', {
      groupId: 9,
      groupName: '서울 채팅',
    });

    navigate.mockClear();
    setNavigationRef({
      isReady: () => false,
      navigate,
    } as any);

    expect(handleDeepLinkUrl('fryndo://chat/9')).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate invalid or empty deep links', () => {
    const navigate = jest.fn();
    setNavigationRef({
      isReady: () => true,
      navigate,
    } as any);

    expect(handleDeepLinkUrl(null)).toBe(false);
    expect(handleDeepLinkUrl('fryndo://location/42abc')).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
