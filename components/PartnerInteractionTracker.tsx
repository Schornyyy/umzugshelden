"use client";
import { useEffect } from "react";

async function send(
  type: "view" | "website" | "email" | "phone",
  partnerId: string
) {
  try {
    await fetch(`/api/partner-interaction?pid=${partnerId}&t=${type}`, {
      method: "POST",
      keepalive: type === "view",
    });
  } catch {
    /* ignore */
  }
}

export function PartnerInteractionTracker({
  partnerId,
}: {
  partnerId: string;
}) {
  useEffect(() => {
    send("view", partnerId);
  }, [partnerId]);
  return null;
}

export function wrapInteraction<T extends (e: unknown) => void>(
  partnerId: string,
  type: "website" | "email" | "phone",
  original?: T
) {
  return (e: Parameters<T>[0]) => {
    send(type, partnerId);
    if (original) original(e);
  };
}
