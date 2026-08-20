self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = {};
  }

  const title = payload.title || 'Chabaqa';
  const options = {
    body: payload.body || 'You have a new notification.',
    icon: '/Logos/ICO/brandmark.ico',
    badge: '/Logos/ICO/brandmark.ico',
    tag: payload.tag || 'chabaqa-notification',
    data: payload.data || {},
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = (event.notification && event.notification.data) || {};
  const targetPath = data.url || '/creator/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // Try to find an existing window/tab with the same origin
      for (const client of clientsArr) {
        try {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(targetPath, clientUrl.origin);

          // If a window is already on the same path, just focus it
          if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
            return client.focus();
          }
        } catch (_) {
          // URL parsing failed, skip this client
        }
      }

      // Navigate an existing window to the deep link, or open a new one
      for (const client of clientsArr) {
        if ('focus' in client && 'navigate' in client) {
          return client.navigate(targetPath).then(() => client.focus());
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }

      return null;
    }),
  );
});

