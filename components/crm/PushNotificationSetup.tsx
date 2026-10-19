"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/config/firebase";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { Bell, BellRing, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

type PushNotificationSetupProps = {
  ownerId: string;
};

const notificationStorageKey = (ownerId: string) =>
  `crm-push-notifications:${ownerId}`;

function waitForActiveServiceWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs = 15_000,
) {
  if (registration.active?.state === "activated") {
    return Promise.resolve(registration);
  }

  const pendingWorker = registration.installing ?? registration.waiting;
  if (!pendingWorker) {
    return Promise.reject(
      new Error("Der Benachrichtigungsdienst konnte nicht gestartet werden."),
    );
  }
  const worker: ServiceWorker = pendingWorker;

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.removeEventListener("statechange", handleStateChange);
      reject(
        new Error(
          "Der Benachrichtigungsdienst wurde nicht rechtzeitig aktiviert. Bitte laden Sie die Seite neu und versuchen Sie es erneut.",
        ),
      );
    }, timeoutMs);

    function finish() {
      window.clearTimeout(timeout);
      worker.removeEventListener("statechange", handleStateChange);
    }

    function handleStateChange() {
      if (worker.state === "activated") {
        finish();
        resolve(registration);
      } else if (worker.state === "redundant") {
        finish();
        reject(
          new Error(
            "Der Benachrichtigungsdienst konnte nicht installiert werden.",
          ),
        );
      }
    }

    worker.addEventListener("statechange", handleStateChange);
    handleStateChange();
  });
}

async function registerPushDevice(ownerId: string, sendTest: boolean) {
  if (!(await isSupported()) || !("serviceWorker" in navigator)) {
    throw new Error("Push wird von diesem Browser nicht unterstützt.");
  }
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_VAPID_KEY ist noch nicht konfiguriert.",
    );
  }
  const permission = sendTest
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== "granted") {
    throw new Error("Benachrichtigungen wurden nicht freigegeben.");
  }

  const pendingRegistration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/" },
  );
  await pendingRegistration.update();
  const registration = await waitForActiveServiceWorker(pendingRegistration);
  if (!registration.active) {
    throw new Error(
      "Der Benachrichtigungsdienst ist noch nicht aktiv. Bitte laden Sie die Seite neu und versuchen Sie es erneut.",
    );
  }
  const token = await getToken(getMessaging(), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) {
    throw new Error("Für dieses Gerät konnte kein Push-Token erstellt werden.");
  }

  await auth.authStateReady();
  const idToken = await auth.currentUser?.getIdToken(true);
  if (!idToken) throw new Error("Die Anmeldung ist abgelaufen.");
  const response = await fetch("/api/crm/push-subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ownerId, token, sendTest }),
  });
  const result = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!response.ok) {
    throw new Error(
      result?.error || "Das Gerät konnte nicht registriert werden.",
    );
  }
}

export default function PushNotificationSetup({
  ownerId,
}: PushNotificationSetupProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "enabled" | "unsupported" | "error"
  >("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void isSupported().then((supported) => {
      if (!supported) return;
      unsubscribe = onMessage(getMessaging(), (payload) => {
        const link = payload.data?.link;
        const notification = new Notification(
          payload.data?.title || "Besichtigungstermin starten",
          {
            body: payload.data?.body || "Der Termin beginnt in 10 Minuten.",
            icon: "/admin/icon",
          },
        );
        notification.onclick = () => {
          window.focus();
          if (link) window.location.assign(link);
          notification.close();
        };
      });
    });
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted" ||
      localStorage.getItem(notificationStorageKey(ownerId)) !== "enabled"
    ) {
      return;
    }

    let active = true;
    setStatus("loading");
    void registerPushDevice(ownerId, false)
      .then(() => {
        if (active) setStatus("enabled");
      })
      .catch((caughtError) => {
        console.error(
          "Push-Benachrichtigungen konnten nicht wiederhergestellt werden.",
          caughtError,
        );
        localStorage.removeItem(notificationStorageKey(ownerId));
        if (!active) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Push-Benachrichtigungen konnten nicht wiederhergestellt werden.",
        );
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [ownerId]);

  async function enableNotifications() {
    setStatus("loading");
    setError("");
    try {
      await registerPushDevice(ownerId, true);
      localStorage.setItem(notificationStorageKey(ownerId), "enabled");
      setStatus("enabled");
    } catch (caughtError) {
      console.error("Push-Benachrichtigungen konnten nicht aktiviert werden.", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Push-Benachrichtigungen konnten nicht aktiviert werden.",
      );
      setStatus("error");
    }
  }

  if (status === "unsupported") {
    return (
      <span className="text-xs text-slate-500">
        Push wird von diesem Browser nicht unterstützt.
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={status === "enabled" ? "outline" : "default"}
        onClick={() => void enableNotifications()}
        disabled={status === "loading" || status === "enabled"}>
        {status === "loading" ? (
          <LoaderCircle className="animate-spin" />
        ) : status === "enabled" ? (
          <BellRing />
        ) : (
          <Bell />
        )}
        {status === "enabled" ? "Erinnerungen aktiv" : "Erinnerungen aktivieren"}
      </Button>
      {error && <span className="max-w-xs text-right text-xs text-red-600">{error}</span>}
    </div>
  );
}
