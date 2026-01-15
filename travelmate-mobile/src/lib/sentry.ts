import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || '';
const ENVIRONMENT = __DEV__ ? 'development' : 'production';
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

/**
 * Initialize Sentry for React Native
 */
export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `travelmate-mobile@${APP_VERSION}`,
    dist: Constants.expoConfig?.extra?.buildNumber || '1',

    // Enable automatic instrumentation
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Performance monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0,

    // Enable native crash handling
    enableNative: true,
    enableNativeCrashHandling: true,
    enableAutoPerformanceTracing: true,

    // React Native specific
    enableNativeNagger: true,
    attachScreenshot: true,
    attachViewHierarchy: true,

    // Breadcrumbs
    maxBreadcrumbs: 100,
    enableAutoNativeBreadcrumbs: true,

    // Before send hook
    beforeSend(event, hint) {
      // Filter out specific errors in development
      if (__DEV__) {
        const error = hint.originalException;
        if (error instanceof Error) {
          if (error.message.includes('Network request failed')) {
            return null;
          }
        }
      }

      return event;
    },

    // Ignored errors
    ignoreErrors: [
      // Network errors
      'Network request failed',
      'Network Error',
      'Failed to fetch',
      // Navigation errors
      'Navigation aborted',
      // Development errors
      'Unable to connect to development server',
    ],
  });

  // Set initial tags
  Sentry.setTag('platform', Constants.platform?.os || 'unknown');
  Sentry.setTag('expo_sdk', Constants.expoConfig?.sdkVersion || 'unknown');

  console.log('Sentry initialized for environment:', ENVIRONMENT);
};

/**
 * Set user context
 */
export const setUser = (user: { id: string; email?: string; username?: string } | null) => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Capture an exception
 */
export const captureException = (
  error: Error,
  context?: Record<string, unknown>
) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

/**
 * Capture a message
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(message, level);
};

/**
 * Add a breadcrumb
 */
export const addBreadcrumb = (
  category: string,
  message: string,
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
};

/**
 * Set a tag
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Track screen view
 */
export const trackScreenView = (screenName: string, params?: Record<string, unknown>) => {
  addBreadcrumb('navigation', `View ${screenName}`, params);
  Sentry.setTag('current_screen', screenName);
};

/**
 * Track user action
 */
export const trackAction = (action: string, data?: Record<string, unknown>) => {
  addBreadcrumb('user_action', action, data);
};

/**
 * Track NFT collection
 */
export const trackNftCollection = (locationId: number, locationName: string) => {
  trackAction('nft_collection', {
    location_id: locationId,
    location_name: locationName,
  });
};

/**
 * Track NFT minting
 */
export const trackNftMinting = (collectionId: number, success: boolean, txHash?: string) => {
  trackAction('nft_minting', {
    collection_id: collectionId,
    success,
    tx_hash: txHash,
  });
};

/**
 * Track payment
 */
export const trackPayment = (productId: string, success: boolean, error?: string) => {
  trackAction('payment', {
    product_id: productId,
    success,
    error,
  });
};

/**
 * Start a performance transaction
 */
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Wrap navigation with Sentry
 */
export const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

/**
 * Wrap component with Sentry for performance monitoring
 */
export const withSentryProfiler = Sentry.wrap;

export default Sentry;
