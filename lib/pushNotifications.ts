export async function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (err) {
      console.error('Service worker registration failed:', err);
    }
  }
  return null;
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
    }
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'error';
  }
}

export async function sendLocalNotification(title: string, body: string, url = '/notifications') {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const options: any = {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
    data: { url },
    vibrate: [100, 50, 100],
  };

  // Try ServiceWorker showNotification first (with 1.5s timeout fallback)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      const swReadyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const registration = await Promise.race([swReadyPromise, timeoutPromise]);

      if (registration && registration.showNotification) {
        await registration.showNotification(title, options);
        return true;
      }
    } catch (err) {
      console.error('SW showNotification error:', err);
    }
  }

  // Fallback to standard Browser Notification
  try {
    new Notification(title, options);
    return true;
  } catch (e) {
    console.error('Standard Notification error:', e);
  }

  return false;
}
