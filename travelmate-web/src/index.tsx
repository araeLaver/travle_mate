import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeMonitoring } from './lib/monitoring';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Initialize monitoring (error tracking, performance, analytics)
initializeMonitoring();

const isDev = process.env.NODE_ENV === 'development';

// Register service worker for PWA support
serviceWorkerRegistration.register({
  onSuccess: registration => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('ServiceWorker registered successfully:', registration);
    }
  },
  onUpdate: registration => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('New content is available; please refresh.');
    }
    // 업데이트 알림을 위한 이벤트 발생
    const event = new CustomEvent('swUpdate', { detail: registration });
    window.dispatchEvent(event);
  },
  onOffline: () => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('App is running in offline mode.');
    }
  },
  onOnline: () => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('App is back online.');
    }
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
