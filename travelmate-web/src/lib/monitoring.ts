/**
 * TravelMate Frontend Monitoring Utility
 *
 * Provides error tracking, performance monitoring, and analytics.
 * Can be integrated with Sentry, LogRocket, or custom backend logging.
 */

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration
const MONITORING_CONFIG = {
  enabled: isProduction,
  logToConsole: isDevelopment,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  maxQueueSize: 100,
  apiEndpoint: import.meta.env.VITE_API_URL + '/monitoring/logs',
};

// Types
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
  url?: string;
  userAgent?: string;
  sessionId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  sessionId: string;
  context?: Record<string, unknown>;
}

// Session ID generation
const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('tm_session_id');
  if (stored) return stored;

  const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  sessionStorage.setItem('tm_session_id', newId);
  return newId;
};

const sessionId = generateSessionId();

// Log queue for batching
let logQueue: LogEntry[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

/**
 * Flush logs to the server
 */
const flushLogs = async (): Promise<void> => {
  if (logQueue.length === 0) return;

  const logsToSend = [...logQueue];
  logQueue = [];

  if (!MONITORING_CONFIG.enabled) return;

  try {
    // In production, send to backend
    await fetch(MONITORING_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs: logsToSend }),
    }).catch(() => {
      // Silently fail - don't break the app for logging failures
    });
  } catch {
    // Silently fail
  }
};

/**
 * Schedule flush
 */
const scheduleFlush = (): void => {
  if (flushTimeout) return;

  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushLogs();
  }, MONITORING_CONFIG.flushInterval);
};

/**
 * Add log to queue
 */
const queueLog = (entry: LogEntry): void => {
  if (logQueue.length >= MONITORING_CONFIG.maxQueueSize) {
    logQueue.shift(); // Remove oldest
  }

  logQueue.push(entry);

  if (logQueue.length >= MONITORING_CONFIG.batchSize) {
    flushLogs();
  } else {
    scheduleFlush();
  }
};

/**
 * Create a log entry
 */
const createLogEntry = (
  level: LogEntry['level'],
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  context,
  stack: error?.stack,
  url: window.location.href,
  userAgent: navigator.userAgent,
  sessionId,
});

/**
 * Monitoring logger
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('debug', message, context);
    if (MONITORING_CONFIG.logToConsole) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, context);
    }
    queueLog(entry);
  },

  info: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('info', message, context);
    if (MONITORING_CONFIG.logToConsole) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, context);
    }
    queueLog(entry);
  },

  warn: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('warn', message, context);
    if (MONITORING_CONFIG.logToConsole) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, context);
    }
    queueLog(entry);
  },

  error: (message: string, error?: Error, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('error', message, context, error);
    if (MONITORING_CONFIG.logToConsole) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, error, context);
    }
    queueLog(entry);
  },
};

/**
 * Error tracking
 */
export const errorTracker = {
  /**
   * Report an error with context
   */
  captureError: (error: Error, context?: Record<string, unknown>): void => {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId,
      context,
    };

    logger.error(`Captured error: ${error.message}`, error, context);

    // In production, could send to Sentry or similar
    if (MONITORING_CONFIG.enabled) {
      // Sentry.captureException(error, { extra: context });
    }

    // Store recent errors for debugging
    const recentErrors = JSON.parse(sessionStorage.getItem('tm_recent_errors') || '[]');
    recentErrors.push(report);
    if (recentErrors.length > 10) recentErrors.shift();
    sessionStorage.setItem('tm_recent_errors', JSON.stringify(recentErrors));
  },

  /**
   * Report a React error boundary catch
   */
  captureReactError: (error: Error, errorInfo: { componentStack: string }): void => {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId,
    };

    logger.error(`React error boundary: ${error.message}`, error, {
      componentStack: errorInfo.componentStack,
    });

    // Store for debugging
    sessionStorage.setItem('tm_last_react_error', JSON.stringify(report));
  },

  /**
   * Get recent errors for debugging
   */
  getRecentErrors: (): ErrorReport[] => {
    return JSON.parse(sessionStorage.getItem('tm_recent_errors') || '[]');
  },
};

/**
 * Performance monitoring
 */
export const performanceMonitor = {
  /**
   * Track a performance metric
   */
  trackMetric: (
    name: string,
    value: number,
    unit: string = 'ms',
    context?: Record<string, unknown>
  ): void => {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context,
    };

    if (MONITORING_CONFIG.logToConsole) {
      // eslint-disable-next-line no-console
      console.debug(`[PERF] ${name}: ${value}${unit}`, context);
    }

    // Store metrics
    const metrics = JSON.parse(sessionStorage.getItem('tm_perf_metrics') || '[]');
    metrics.push(metric);
    if (metrics.length > 50) metrics.shift();
    sessionStorage.setItem('tm_perf_metrics', JSON.stringify(metrics));
  },

  /**
   * Measure execution time of an async function
   */
  measureAsync: async <T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      performanceMonitor.trackMetric(name, duration, 'ms', {
        ...context,
        success: true,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.trackMetric(name, duration, 'ms', {
        ...context,
        success: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  /**
   * Measure execution time of a sync function
   */
  measure: <T>(name: string, fn: () => T, context?: Record<string, unknown>): T => {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      performanceMonitor.trackMetric(name, duration, 'ms', {
        ...context,
        success: true,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.trackMetric(name, duration, 'ms', {
        ...context,
        success: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  /**
   * Get stored performance metrics
   */
  getMetrics: (): PerformanceMetric[] => {
    return JSON.parse(sessionStorage.getItem('tm_perf_metrics') || '[]');
  },

  /**
   * Clear stored metrics
   */
  clearMetrics: (): void => {
    sessionStorage.removeItem('tm_perf_metrics');
  },
};

/**
 * Web Vitals reporting
 */
export const webVitals = {
  /**
   * Report Core Web Vitals
   */
  reportWebVitals: (onReport?: (metric: PerformanceMetric) => void): void => {
    // Import web-vitals dynamically
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const handleMetric = (metric: { name: string; value: number; rating: string }) => {
        const perfMetric: PerformanceMetric = {
          name: metric.name,
          value: metric.value,
          unit: 'ms',
          timestamp: new Date().toISOString(),
          context: { rating: metric.rating },
        };

        performanceMonitor.trackMetric(`web-vital-${metric.name}`, metric.value, 'ms', {
          rating: metric.rating,
        });

        if (onReport) {
          onReport(perfMetric);
        }

        logger.info(`Web Vital: ${metric.name}`, {
          value: metric.value,
          rating: metric.rating,
        });
      };

      onCLS(handleMetric);
      onFCP(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
      onINP(handleMetric);
    });
  },
};

/**
 * User analytics
 */
export const analytics = {
  /**
   * Track page view
   */
  trackPageView: (pageName: string, context?: Record<string, unknown>): void => {
    logger.info(`Page view: ${pageName}`, {
      ...context,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track user action
   */
  trackAction: (action: string, category: string, context?: Record<string, unknown>): void => {
    logger.info(`User action: ${action}`, {
      category,
      ...context,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track feature usage
   */
  trackFeatureUsage: (feature: string, context?: Record<string, unknown>): void => {
    logger.info(`Feature usage: ${feature}`, {
      ...context,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Initialize monitoring
 */
export const initializeMonitoring = (): void => {
  // Global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    errorTracker.captureError(error || new Error(String(message)), { source, lineno, colno });
    return false;
  };

  // Unhandled promise rejection handler
  window.onunhandledrejection = event => {
    errorTracker.captureError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandledrejection' }
    );
  };

  // Report web vitals
  webVitals.reportWebVitals();

  // Track initial page view
  analytics.trackPageView(window.location.pathname);

  // Flush logs before page unload
  window.addEventListener('beforeunload', () => {
    flushLogs();
  });

  logger.info('Monitoring initialized', {
    sessionId,
    environment: process.env.NODE_ENV,
  });
};

/**
 * Create a monitored API call wrapper
 */
export const createMonitoredApiCall = <T>(
  name: string,
  apiCall: () => Promise<T>
): (() => Promise<T>) => {
  return async () => {
    return performanceMonitor.measureAsync(`api-${name}`, apiCall, { type: 'api-call' });
  };
};

const monitoringUtils = {
  logger,
  errorTracker,
  performanceMonitor,
  webVitals,
  analytics,
  initializeMonitoring,
  createMonitoredApiCall,
};

export default monitoringUtils;
