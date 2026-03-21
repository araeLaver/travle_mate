import { cn, formatNumber, truncate, debounce, isInViewport, logger } from './utils';

describe('utils', () => {
  describe('cn (class name merger)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
      expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('should return number as string for values less than 1000', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1)).toBe('1');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(10000)).toBe('10.0K');
      expect(formatNumber(999999)).toBe('1000.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(10000000)).toBe('10.0M');
      expect(formatNumber(999999999)).toBe('1000.0M');
    });

    it('should format billions with B suffix', () => {
      expect(formatNumber(1000000000)).toBe('1.0B');
      expect(formatNumber(1500000000)).toBe('1.5B');
      expect(formatNumber(10000000000)).toBe('10.0B');
    });
  });

  describe('truncate', () => {
    it('should return original text if shorter than maxLength', () => {
      expect(truncate('hello', 10)).toBe('hello');
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('should truncate text longer than maxLength', () => {
      expect(truncate('hello world', 5)).toBe('hello...');
      expect(truncate('hello world', 8)).toBe('hello wo...');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('should handle maxLength of 0', () => {
      expect(truncate('hello', 0)).toBe('...');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn();
      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the function', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should only call function once for multiple rapid calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isInViewport', () => {
    const mockElement = (rect: Partial<DOMRect>): HTMLElement => {
      const element = document.createElement('div');
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
        width: 100,
        height: 100,
        ...rect,
      });
      return element;
    };

    beforeEach(() => {
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    });

    it('should return true when element is fully in viewport', () => {
      const element = mockElement({
        top: 100,
        left: 100,
        bottom: 200,
        right: 200,
      });
      expect(isInViewport(element)).toBe(true);
    });

    it('should return false when element is above viewport', () => {
      const element = mockElement({
        top: -100,
        left: 100,
        bottom: -50,
        right: 200,
      });
      expect(isInViewport(element)).toBe(false);
    });

    it('should return false when element is below viewport', () => {
      const element = mockElement({
        top: 800,
        left: 100,
        bottom: 900,
        right: 200,
      });
      expect(isInViewport(element)).toBe(false);
    });

    it('should return false when element is left of viewport', () => {
      const element = mockElement({
        top: 100,
        left: -100,
        bottom: 200,
        right: -50,
      });
      expect(isInViewport(element)).toBe(false);
    });

    it('should return false when element is right of viewport', () => {
      const element = mockElement({
        top: 100,
        left: 1100,
        bottom: 200,
        right: 1200,
      });
      expect(isInViewport(element)).toBe(false);
    });

    it('should return true when element touches viewport edges', () => {
      const element = mockElement({
        top: 0,
        left: 0,
        bottom: 768,
        right: 1024,
      });
      expect(isInViewport(element)).toBe(true);
    });
  });

  describe('logger', () => {
    const originalEnv = process.env.NODE_ENV;
    const consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation(),
    };

    beforeEach(() => {
      Object.values(consoleSpy).forEach(spy => spy.mockClear());
    });

    afterAll(() => {
      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
      process.env.NODE_ENV = originalEnv;
    });

    it('should always log warnings', () => {
      logger.warn('warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('warning message');
    });

    it('should always log errors', () => {
      logger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('error message');
    });

    it('should pass multiple arguments', () => {
      logger.error('error', 123, { key: 'value' });
      expect(consoleSpy.error).toHaveBeenCalledWith('error', 123, { key: 'value' });
    });
  });
});
