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

export function trackLoginSuccess(): void {
  trackEvent('login_success');
}

export function trackSignUpComplete(): void {
  trackEvent('sign_up_complete');
}

export function trackChatMessageSent(): void {
  trackEvent('chat_message_sent');
}

export function trackMatchRequestSent(receiverId?: string): void {
  trackEvent('match_request_sent', receiverId ? { receiverId } : undefined);
}

export function trackMatchRecommendationViewed(count?: number): void {
  trackEvent('match_recommendation_viewed', count !== undefined ? { count } : undefined);
}
