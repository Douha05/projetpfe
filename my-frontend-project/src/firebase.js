const PUBLIC_VAPID_KEY = "BCYQWkzdfm6R4Eagw2u9IZm8qFJgbPoRaCxLsFcELMN9-hAPA--WVzThYBnFwKdaD_eyIMtl8fTJ9TPYxntLysI";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const requestNotificationPermission = async () => {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications non supportées");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Permission refusée");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    console.log("✅ Service Worker prêt");

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    console.log("✅ Abonnement push créé");
    return JSON.stringify(subscription);
  } catch (err) {
    console.error("Erreur Push:", err);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "PUSH_NOTIFICATION") {
      callback(event.data);
    }
  });
};