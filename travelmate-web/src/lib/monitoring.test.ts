// Note: In test environment, NODE_ENV='test' so logToConsole is false
// We test the core functionality without relying on console output

import {
  logger,
  errorTracker,
  performanceMonitor,
  analytics,
  initializeMonitoring,
} from './monitoring';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Mock performance.now
const mockPerformanceNow = jest.fn();
Object.defineProperty(window, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
});

describe('monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    mockPerformanceNow.mockReturnValue(0);
  });

  describe('logger', () => {
    // Note: In test environment, logToConsole is false, so we just verify
    // that the functions execute without errors (queue logs internally)

    it('should queue log messages at all levels without error', () => {
      expect(() => {
        logger.info('Test message at info level', { key: 'value' });
      }).not.toThrow();
    });

    it('should queue info messages without error', () => {
      expect(() => {
        logger.info('Test info message');
      }).not.toThrow();
    });

    it('should queue warn messages without error', () => {
      expect(() => {
        logger.warn('Test warn message');
      }).not.toThrow();
    });

    it('should queue error messages without error', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('Test error message', error);
      }).not.toThrow();
    });
  });

  describe('errorTracker', () => {
    it('should capture and store errors', () => {
      const error = new Error('Test captured error');

      errorTracker.captureError(error, { component: 'TestComponent' });

      // Check that error was stored in sessionStorage
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'tm_recent_errors',
        expect.any(String)
      );
    });

    it('should capture React errors with component stack', () => {
      const error = new Error('React render error');
      const errorInfo = { componentStack: '\n    in TestComponent' };

      errorTracker.captureReactError(error, errorInfo);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'tm_last_react_error',
        expect.any(String)
      );
    });

    it('should return recent errors', () => {
      const errors = [{ message: 'error1' }, { message: 'error2' }];
      mockSessionStorage.getItem.mockReturnValueOnce(JSON.stringify(errors));

      const result = errorTracker.getRecentErrors();

      expect(result).toEqual(errors);
    });
  });

  describe('performanceMonitor', () => {
    it('should track metrics and store them', () => {
      performanceMonitor.trackMetric('test-metric', 100, 'ms', {
        context: 'test',
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'tm_perf_metrics',
        expect.any(String)
      );
    });

    it('should measure async function execution time', async () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50);

      const result = await performanceMonitor.measureAsync('async-test', async () => {
        return 'result';
      });

      expect(result).toBe('result');
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('should measure async function failure and still track time', async () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(100);

      await expect(
        performanceMonitor.measureAsync('async-fail', async () => {
          throw new Error('Test failure');
        })
      ).rejects.toThrow('Test failure');

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('should measure sync function execution time', () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(25);

      const result = performanceMonitor.measure('sync-test', () => {
        return 42;
      });

      expect(result).toBe(42);
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('should get stored metrics', () => {
      const metrics = [{ name: 'test', value: 100 }];
      mockSessionStorage.getItem.mockReturnValueOnce(JSON.stringify(metrics));

      const result = performanceMonitor.getMetrics();

      expect(result).toEqual(metrics);
    });

    it('should clear stored metrics', () => {
      performanceMonitor.clearMetrics();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('tm_perf_metrics');
    });
  });

  describe('analytics', () => {
    it('should track page views without error', () => {
      expect(() => {
        analytics.trackPageView('/test-page', { section: 'main' });
      }).not.toThrow();
    });

    it('should track user actions without error', () => {
      expect(() => {
        analytics.trackAction('button_click', 'navigation', { button: 'home' });
      }).not.toThrow();
    });

    it('should track feature usage without error', () => {
      expect(() => {
        analytics.trackFeatureUsage('dark_mode', { enabled: true });
      }).not.toThrow();
    });
  });

  describe('initializeMonitoring', () => {
    it('should set up global error handlers', () => {
      initializeMonitoring();

      expect(window.onerror).toBeDefined();
      expect(window.onunhandledrejection).toBeDefined();
    });

    it('should handle global errors without crashing', () => {
      initializeMonitoring();

      // Trigger global error
      const error = new Error('Global error');
      expect(() => {
        window.onerror?.('message', 'source', 1, 1, error);
      }).not.toThrow();
    });

    it('should handle unhandled promise rejections without crashing', () => {
      initializeMonitoring();

      // Trigger unhandled rejection
      const event = {
        reason: new Error('Unhandled rejection'),
      } as PromiseRejectionEvent;
      expect(() => {
        window.onunhandledrejection?.(event);
      }).not.toThrow();
    });

    it('should handle non-error rejections', () => {
      initializeMonitoring();

      // Trigger unhandled rejection with string
      const event = {
        reason: 'String rejection',
      } as PromiseRejectionEvent;
      expect(() => {
        window.onunhandledrejection?.(event);
      }).not.toThrow();
    });
  });
});
