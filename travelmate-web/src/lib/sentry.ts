import * as Sentry from '@sentry/react';

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
const ENVIRONMENT = process.env.REACT_APP_ENV || 'development';

/**
 * Initialize Sentry for error tracking
 */
export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `travelmate-web@${process.env.REACT_APP_VERSION || '1.0.0'}`,

    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0,

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Integration options
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.travelmate\.app/,
          /^https:\/\/travelmate\.app/,
        ],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Before send hook
    beforeSend(event, hint) {
      // Filter out specific errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors in development
        if (ENVIRONMENT === 'development' && error.message.includes('Network Error')) {
          return null;
        }

        // Ignore chunk load errors (common with code splitting)
        if (error.message.includes('Loading chunk')) {
          return null;
        }
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'fb_xd_fragment',
      // Chrome errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network errors
      'Failed to fetch',
      'NetworkError',
      'Load failed',
      // User-initiated navigation
      'AbortError',
    ],

    // URLs to ignore
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
      // Safari extensions
      /^safari-extension:\/\//i,
    ],
  });

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
 * Track a business event
 */
export const trackEvent = (eventName: string, data?: Record<string, unknown>) => {
  addBreadcrumb('event', eventName, data);
};

/**
 * Track NFT collection
 */
export const trackNftCollection = (locationId: number, locationName: string) => {
  trackEvent('nft_collection', {
    location_id: locationId,
    location_name: locationName,
  });
};

/**
 * Track NFT minting
 */
export const trackNftMinting = (collectionId: number, success: boolean, txHash?: string) => {
  trackEvent('nft_minting', {
    collection_id: collectionId,
    success,
    tx_hash: txHash,
  });
};

/**
 * Track page view
 */
export const trackPageView = (pageName: string, params?: Record<string, unknown>) => {
  trackEvent('page_view', {
    page: pageName,
    ...params,
  });
};

/**
 * Error Boundary fallback component props
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profiler component for performance monitoring
 */
export const SentryProfiler = Sentry.withProfiler;

export default Sentry;
