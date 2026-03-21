/**
 * Deep Link Service
 * Handles URL scheme (travelmate://) and universal links (https://travelmate.app)
 */

import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationRef = NavigationContainerRef<RootStackParamList>;

let navigationRef: NavigationRef | null = null;

export function setNavigationRef(ref: NavigationRef | null) {
  navigationRef = ref;
}

interface DeepLinkRoute {
  screen: keyof RootStackParamList;
  params?: Record<string, unknown>;
}

function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsed = new URL(url.replace('travelmate://', 'https://travelmate.app/'));
    const path = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
    const segments = path.split('/');

    switch (segments[0]) {
      case 'location':
      case 'share': {
        const locationId = parseInt(segments[1], 10);
        if (!isNaN(locationId)) {
          return { screen: 'LocationDetail', params: { locationId } };
        }
        break;
      }
      case 'profile':
      case 'user': {
        const userId = parseInt(segments[1], 10);
        if (!isNaN(userId)) {
          return { screen: 'UserProfile', params: { userId } };
        }
        break;
      }
      case 'chat':
      case 'group': {
        const groupId = parseInt(segments[1], 10);
        if (!isNaN(groupId)) {
          return {
            screen: 'ChatRoom',
            params: { groupId, groupName: parsed.searchParams.get('name') || '채팅' },
          };
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

function navigate(route: DeepLinkRoute) {
  if (!navigationRef?.isReady()) return;
  navigationRef.navigate(route.screen as any, route.params as any);
}

function handleUrl(url: string | null) {
  if (!url) return;
  const route = parseDeepLink(url);
  if (route) {
    navigate(route);
  }
}

export async function initDeepLinks() {
  // Handle URL that opened the app
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl) {
    // Delay to allow navigation to mount
    setTimeout(() => handleUrl(initialUrl), 500);
  }

  // Listen for incoming URLs while app is open
  const subscription = Linking.addEventListener('url', (event) => {
    handleUrl(event.url);
  });

  return () => subscription.remove();
}

/** Linking config for React Navigation */
export const linkingConfig = {
  prefixes: ['travelmate://', 'https://travelmate.app'],
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
      Review: 'review/:matchId',
    },
  },
};
