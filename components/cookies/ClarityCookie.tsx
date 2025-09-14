"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import Clarity from "@microsoft/clarity";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

const injectClarityScript = (id: string) => {
  if (typeof window === "undefined") return;
  if (document.getElementById("ms-clarity")) return; // prevent double-inject
  const s = document.createElement("script");
  s.id = "ms-clarity";
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${id}`;
  document.body.appendChild(s);
};

const ClarityCookie = () => {
  const initialized = useRef(false);

  const maybeInit = (consent?: { analytics?: boolean }) => {
    try {
      const allow =
        typeof consent?.analytics === "boolean"
          ? consent.analytics
          : (() => {
              const saved = Cookies.get("cookieConsentLandschaftshelden");
              if (!saved) return false;
              return Boolean(JSON.parse(saved)?.analytics);
            })();

      if (!allow) return;
      if (!CLARITY_ID) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Clarity not initialized: NEXT_PUBLIC_CLARITY_ID is missing."
          );
        }
        return;
      }
      if (initialized.current) return;
      initialized.current = true;
      injectClarityScript(CLARITY_ID);
      Clarity.init(CLARITY_ID);
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    // try on mount
    maybeInit();

    // respond to consent updates without page reload
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { analytics?: boolean };
      maybeInit(detail);
    };
    window.addEventListener(
      "cookieConsentUpdated",
      handler as unknown as EventListener
    );
    return () =>
      window.removeEventListener(
        "cookieConsentUpdated",
        handler as unknown as EventListener
      );
  }, []);

  return null;
};

export default ClarityCookie;
