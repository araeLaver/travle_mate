/**
 * Firebase Configuration for Push Notifications
 */

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// VAPID key for web push
export const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

// Check if Firebase config is properly set
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId
  );
};

// Dynamically load Firebase SDK
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let firebaseApp: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let messaging: any = null;

export const initializeFirebase = async () => {
  if (!isFirebaseConfigured()) {
    // eslint-disable-next-line no-console
    console.warn('Firebase is not configured. Push notifications disabled.');
    return null;
  }

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, isSupported } = await import('firebase/messaging');

    // Check if messaging is supported
    const supported = await isSupported();
    if (!supported) {
      // eslint-disable-next-line no-console
      console.warn('Firebase Messaging is not supported in this browser.');
      return null;
    }

    // Initialize Firebase app if not already initialized
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }

    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
};

export const getFirebaseMessaging = async () => {
  if (messaging) return messaging;
  return initializeFirebase();
};

export default firebaseConfig;
