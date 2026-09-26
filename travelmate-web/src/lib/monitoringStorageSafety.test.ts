describe('monitoring storage safety', () => {
  const originalSessionStorage = Object.getOwnPropertyDescriptor(window, 'sessionStorage');

  afterEach(() => {
    jest.resetModules();
    if (originalSessionStorage) {
      Object.defineProperty(window, 'sessionStorage', originalSessionStorage);
    }
  });

  it('does not crash when sessionStorage methods fail at import time', () => {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem() {
          throw new Error('sessionStorage get blocked');
        },
        setItem() {
          throw new Error('sessionStorage set blocked');
        },
        removeItem() {
          throw new Error('sessionStorage remove blocked');
        },
      },
    });

    let monitoring: typeof import('./monitoring') | undefined;

    expect(() => {
      jest.isolateModules(() => {
        monitoring = require('./monitoring') as typeof import('./monitoring');
      });
    }).not.toThrow();

    expect(() => monitoring?.logger.info('storage blocked')).not.toThrow();
    expect(() => monitoring?.errorTracker.captureError(new Error('storage blocked'))).not.toThrow();
    expect(() => monitoring?.performanceMonitor.trackMetric('blocked-storage', 1)).not.toThrow();
    expect(monitoring?.errorTracker.getRecentErrors()).toEqual([]);
    expect(monitoring?.performanceMonitor.getMetrics()).toEqual([]);
  });
});
