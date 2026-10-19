importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js");

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

firebase.initializeApp({
  apiKey: "AIzaSyBYUdfLuf5xfEmbzqF9w6DtULVuTdRuOUs",
  authDomain: "nextjs-jobsmith.firebaseapp.com",
  projectId: "nextjs-jobsmith",
  storageBucket: "nextjs-jobsmith.appspot.com",
  messagingSenderId: "20216257290",
  appId: "1:20216257290:web:a5a09db039cf5f916838f3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const link = payload.data?.link || "/admin";
  self.registration.showNotification(
    payload.data?.title || "Besichtigungstermin starten",
    {
      body: payload.data?.body || "Der Termin beginnt in 10 Minuten.",
      icon: "/admin/icon",
      badge: "/admin/icon",
      data: { link },
    },
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/admin";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const matchingWindow = windows.find((windowClient) =>
        windowClient.url.includes(link),
      );
      if (matchingWindow) return matchingWindow.focus();
      return clients.openWindow(link);
    }),
  );
});
