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

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await registerServiceWorker();
    sendLocalNotification(
      'Episodio Bildirimleri Aktif! 🎉',
      'Artık takipçiler, mesajlar ve aktiviteler için kilit ekranına bildirim alacaksın.',
      '/notifications'
    );
  }
  return permission;
}

export async function sendLocalNotification(title: string, body: string, url = '/notifications') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const options: any = {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
        data: { url },
        vibrate: [100, 50, 100],
      };
      await registration.showNotification(title, options);
      return;
    }

    new Notification(title, {
      body,
      icon: '/icon.png',
    });
  } catch (e) {
    console.error('Failed to trigger notification:', e);
  }
}
