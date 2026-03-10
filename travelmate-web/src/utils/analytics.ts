declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(path: string): void {
  if (window.gtag) {
    window.gtag('config', 'G-GT2487FZ6L', { page_path: path });
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
}
