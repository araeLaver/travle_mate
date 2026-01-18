/**
 * Hooks Index
 *
 * Re-exports all custom hooks for easy importing.
 */

// Authentication & User
export { useFollow } from './useFollow';

// Geolocation
export { useGeolocation } from './useGeolocation';

// Notifications
export { useNotifications } from './useNotifications';

// Page Tracking
export { usePageTracking } from './usePageTracking';

// Internationalization
export { useTranslation } from './useTranslation';

// OAuth
export { useKakaoSDK } from './useKakaoSDK';

// Accessibility
export {
  useAnnounce,
  useFocusTrap,
  useId,
  useMediaPreferences,
  useListNavigation,
  useLiveRegion,
  useSkipLink,
  useKeyboardNavigation,
} from './useAccessibility';
