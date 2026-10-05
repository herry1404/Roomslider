self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    console.error("Invalid push notification payload:", error);
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "RoomSlider", {
      body: payload.message || payload.body || "You have a new notification.",
      icon: payload.icon || "/pwa-192x192.png",
      badge: payload.badge || "/pwa-192x192.png",
      image: payload.image || undefined,
      requireInteraction: payload.requireInteraction === true || payload.priority === "high",
      vibrate: Array.isArray(payload.vibrate) ? payload.vibrate : undefined,
      tag: payload.requestId ? `blood-request-${payload.requestId}` : undefined,
      actions: Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : [],
      data: { url: payload.url || "/", requestId: payload.requestId || null },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const requestedUrl = new URL(event.notification.data?.url || "/", self.location.origin);
  if (event.action === "help" && event.notification.data?.requestId) {
    requestedUrl.searchParams.set("help", "1");
  }
  const targetUrl =
    requestedUrl.origin === self.location.origin
      ? requestedUrl.href
      : self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((windowClient) => windowClient.url.startsWith(self.location.origin));
      if (client) {
        return client.navigate(targetUrl).then((windowClient) => windowClient.focus());
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
