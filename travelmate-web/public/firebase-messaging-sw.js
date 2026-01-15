/* eslint-disable no-undef */
/**
 * Firebase Messaging Service Worker
 *
 * Handles background push notifications from Firebase Cloud Messaging
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration - should match your app's config
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);

  const { title, body, icon, image, data } = payload.notification || {};
  const notificationTitle = title || 'TravelMate';
  const notificationOptions = {
    body: body || '',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: image,
    data: payload.data || data,
    tag: payload.data?.type || 'default',
    requireInteraction: false,
    actions: getNotificationActions(payload.data?.type),
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'FOLLOW':
      return [
        { action: 'view-profile', title: '프로필 보기' },
        { action: 'dismiss', title: '닫기' },
      ];
    case 'MESSAGE':
      return [
        { action: 'reply', title: '답장' },
        { action: 'dismiss', title: '닫기' },
      ];
    case 'NFT_COLLECTED':
    case 'MINTING_COMPLETE':
      return [
        { action: 'view-nft', title: 'NFT 보기' },
        { action: 'dismiss', title: '닫기' },
      ];
    case 'GROUP_INVITE':
      return [
        { action: 'view-group', title: '그룹 보기' },
        { action: 'dismiss', title: '닫기' },
      ];
    default:
      return [{ action: 'dismiss', title: '닫기' }];
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  const { action } = event;
  const { data } = event.notification;

  let targetUrl = '/';

  // Determine target URL based on action and data
  if (action === 'dismiss') {
    return;
  }

  if (data?.clickAction) {
    targetUrl = data.clickAction;
  } else {
    switch (data?.type) {
      case 'FOLLOW':
        targetUrl = `/profile/${data.followerId}`;
        break;
      case 'MESSAGE':
        targetUrl = `/chat/${data.chatRoomId}`;
        break;
      case 'NFT_COLLECTED':
      case 'MINTING_COMPLETE':
        targetUrl = `/nft/collection`;
        break;
      case 'GROUP_INVITE':
        targetUrl = `/groups/${data.groupId}`;
        break;
      case 'REVIEW_HELPFUL':
        targetUrl = `/reviews`;
        break;
      case 'NEARBY_NFT':
        targetUrl = `/nft/map`;
        break;
      case 'RANK_CHANGE':
        targetUrl = `/leaderboard`;
        break;
    }
  }

  // Focus on existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  // Analytics or cleanup if needed
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[firebase-messaging-sw.js] Push subscription changed:', event);
  // Re-subscribe if needed
});
