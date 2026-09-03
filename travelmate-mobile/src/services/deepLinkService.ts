/**
 * Deep Link Service
 * Handles URL scheme (fryndo://) and universal links (https://fryndo.com)
 */

import { Linking } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';

type NavigationRef = NavigationContainerRef<RootStackParamList>;

let navigationRef: NavigationRef | null = null;

export function setNavigationRef(ref: NavigationRef | null) {
  navigationRef = ref;
}

interface DeepLinkRoute {
  screen: keyof RootStackParamList;
  params?: Record<string, unknown>;
}

const parsePositiveIntegerSegment = (value: string | undefined): number | null => {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsed = new URL(url.replace('fryndo://', 'https://fryndo.com/'));
    const path = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
    const segments = path.split('/');

    switch (segments[0]) {
      case 'location':
      case 'share': {
        const locationId = parsePositiveIntegerSegment(segments[1]);
        if (locationId) {
          return { screen: 'LocationDetail', params: { locationId } };
        }
        break;
      }
      case 'profile':
      case 'user': {
        const userId = parsePositiveIntegerSegment(segments[1]);
        if (userId) {
          return { screen: 'UserProfile', params: { userId } };
        }
        break;
      }
      case 'chat':
      case 'group': {
        const groupId = parsePositiveIntegerSegment(segments[1]);
        if (groupId) {
          return {
            screen: 'ChatRoom',
            params: { groupId, groupName: parsed.searchParams.get('name') || '채팅' },
          };
        }
        break;
      }
      case 'review': {
        const matchId = parsePositiveIntegerSegment(segments[1]);
        const targetUserId = parsePositiveIntegerSegment(segments[2]);
        if (matchId && targetUserId) {
          return { screen: 'Review', params: { matchId, targetUserId } };
        }
        break;
      }
      case 'matching':
        return { screen: 'Matching' };
      case 'search':
        return { screen: 'UserSearch' };
      case 'notifications':
        return { screen: 'Notifications' };
      case 'settings':
        return { screen: 'Settings' };
      case 'premium':
        return { screen: 'Premium' };
      default:
        return null;
    }
  } catch {
    return null;
  }
  return null;
}

function navigate(route: DeepLinkRoute): boolean {
  if (!navigationRef?.isReady()) return false;
  navigationRef.navigate(route.screen as any, route.params as any);
  return true;
}

export function handleDeepLinkUrl(url: string | null): boolean {
  if (!url) return false;
  const route = parseDeepLink(url);
  if (route) {
    return navigate(route);
  }
  return false;
}

export async function initDeepLinks() {
  // Handle URL that opened the app
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl) {
    // Delay to allow navigation to mount
    setTimeout(() => handleDeepLinkUrl(initialUrl), 500);
  }

  // Listen for incoming URLs while app is open
  const subscription = Linking.addEventListener('url', (event) => {
    handleDeepLinkUrl(event.url);
  });

  return () => subscription.remove();
}

/** Linking config for React Navigation */
export const linkingConfig = {
  prefixes: ['fryndo://', 'https://fryndo.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: '',
          Map: 'map',
          Groups: 'groups',
          Collection: 'collection',
          Profile: 'me',
        },
      },
      LocationDetail: 'location/:locationId',
      UserProfile: 'user/:userId',
      UserSearch: 'search',
      Matching: 'matching',
      ChatRoom: 'chat/:groupId',
      Notifications: 'notifications',
      Settings: 'settings',
      Premium: 'premium',
      Review: {
        path: 'review/:matchId/:targetUserId',
        parse: {
          matchId: (value: string) => parsePositiveIntegerSegment(value) ?? Number.NaN,
          targetUserId: (value: string) => parsePositiveIntegerSegment(value) ?? Number.NaN,
        },
      },
    },
  },
};
