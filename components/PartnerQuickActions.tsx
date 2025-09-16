"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PartnerQuickActions({
  partnerId,
  website,
  email,
  phone,
}: {
  partnerId: string;
  website?: string;
  email?: string;
  phone?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const openWebsite = async () => {
    if (!website) return;
    setBusy("web");
    try {
      // Tracking und Redirect via API
      window.open(
        `/api/partner-click/${partnerId}`,
        "_blank",
        "noopener,noreferrer"
      );
    } finally {
      setBusy(null);
    }
  };

  const clickEmail = async () => {
    if (!email) return;
    setBusy("mail");
    try {
      // Tracking asynchron, dann mailto
      fetch(
        `/api/partner-email/${partnerId}?to=${encodeURIComponent(email)}`
      ).catch(() => {});
      window.location.href = `mailto:${email}`;
    } finally {
      setBusy(null);
    }
  };

  const clickPhone = async () => {
    if (!phone) return;
    setBusy("phone");
    try {
      fetch(
        `/api/partner-phone/${partnerId}?to=${encodeURIComponent(phone)}`
      ).catch(() => {});
      window.location.href = `tel:${phone}`;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className='flex flex-wrap gap-2'>
      <Button
        onClick={openWebsite}
        disabled={!website || busy === "web"}
        className='bg-green-600 hover:bg-green-700'>
        {busy === "web" ? "Öffne…" : "Website öffnen"}
      </Button>
      <Button
        onClick={clickEmail}
        disabled={!email || busy === "mail"}
        variant='outline'>
        {busy === "mail" ? "Öffne…" : "E‑Mail senden"}
      </Button>
      <Button
        onClick={clickPhone}
        disabled={!phone || busy === "phone"}
        variant='outline'>
        {busy === "phone" ? "Öffne…" : "Anrufen"}
      </Button>
    </div>
  );
}
