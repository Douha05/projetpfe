self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Nouvelle notification";
  const body = data.body || "";
  
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo192.png",
      badge: "/logo192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});