/**
 * Service Worker Registration
 * PWA 오프라인 지원을 위한 서비스 워커 등록
 */

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config?: Config): void {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          // eslint-disable-next-line no-console
          console.log('Service Worker is ready for development.');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });

    // 네트워크 상태 이벤트 리스너
    window.addEventListener('online', () => {
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      config?.onOffline?.();
    });
  }
}

function registerValidSW(swUrl: string, config?: Config): void {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // eslint-disable-next-line no-console
              console.log('New content is available and will be used when all tabs are closed.');
              config?.onUpdate?.(registration);
            } else {
              // eslint-disable-next-line no-console
              console.log('Content is cached for offline use.');
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config): void {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      // eslint-disable-next-line no-console
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error(error.message);
      });
  }
}

/**
 * 서비스 워커 업데이트 적용
 */
export function applyUpdate(registration: ServiceWorkerRegistration): void {
  const waitingServiceWorker = registration.waiting;
  if (waitingServiceWorker) {
    waitingServiceWorker.addEventListener('statechange', event => {
      const target = event.target as ServiceWorker;
      if (target.state === 'activated') {
        window.location.reload();
      }
    });
    waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
  }
}
