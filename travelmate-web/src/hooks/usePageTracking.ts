import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, logger } from '../lib/monitoring';

/**
 * Hook to track page views and navigation
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    analytics.trackPageView(location.pathname, {
      search: location.search,
      hash: location.hash,
    });

    // Log navigation
    logger.info(`Navigation to ${location.pathname}`, {
      search: location.search,
      hash: location.hash,
    });
  }, [location.pathname, location.search, location.hash]);
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const trackClick = (
    element: string,
    action: string,
    context?: Record<string, unknown>
  ): void => {
    analytics.trackAction(action, 'click', {
      element,
      ...context,
    });
  };

  const trackFormSubmit = (
    formName: string,
    success: boolean,
    context?: Record<string, unknown>
  ): void => {
    analytics.trackAction(
      success ? `${formName}_submit_success` : `${formName}_submit_failure`,
      'form',
      context
    );
  };

  const trackFeature = (
    featureName: string,
    context?: Record<string, unknown>
  ): void => {
    analytics.trackFeatureUsage(featureName, context);
  };

  return {
    trackClick,
    trackFormSubmit,
    trackFeature,
  };
}

export default usePageTracking;
