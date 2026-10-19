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

export default function PushNotificationSetup({
  ownerId,
}: PushNotificationSetupProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "enabled" | "unsupported" | "error"
  >("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      setStatus("enabled");
    }
  }, []);

  useEffect(() => {
    if (status !== "enabled") return;
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
  }, [status]);

  async function enableNotifications() {
    setStatus("loading");
    setError("");
    try {
      if (!(await isSupported()) || !("serviceWorker" in navigator)) {
        setStatus("unsupported");
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
      if (!vapidKey) {
        throw new Error(
          "NEXT_PUBLIC_FIREBASE_VAPID_KEY ist noch nicht konfiguriert.",
        );
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Benachrichtigungen wurden nicht freigegeben.");
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
      );
      const token = await getToken(getMessaging(), {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) {
        throw new Error("Für dieses Gerät konnte kein Push-Token erstellt werden.");
      }

      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Die Anmeldung ist abgelaufen.");
      const response = await fetch("/api/crm/push-subscriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ownerId, token }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          result?.error || "Das Gerät konnte nicht registriert werden.",
        );
      }
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
