"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const injectGaTag = (id: string) => {
  if (typeof window === "undefined") return;
  if (document.getElementById("ga4-tag")) return;

  // gtag loader
  const s = document.createElement("script");
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  s.async = true;
  s.id = "ga4-tag";
  document.head.appendChild(s);

  // gtag config
  const cfg = document.createElement("script");
  cfg.id = "ga4-config";
  cfg.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} 
    gtag('js', new Date());
    gtag('config', '${id}', { send_page_view: false });
  `;
  document.head.appendChild(cfg);
};

const GoogleAnalyticsCookie = () => {
  const initialized = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const maybeInit = (consent?: { analytics?: boolean }) => {
    const allow =
      typeof consent?.analytics === "boolean"
        ? consent.analytics
        : (() => {
            const saved = Cookies.get("cookieConsentLandschaftshelden");
            if (!saved) return false;
            try {
              return Boolean(JSON.parse(saved)?.analytics);
            } catch {
              return false;
            }
          })();

    if (!allow || !GA_ID || initialized.current) return;
    initialized.current = true;
    injectGaTag(GA_ID);
  };

  useEffect(() => {
    // Try initialize on mount
    maybeInit();

    // React to consent updates
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

  useEffect(() => {
    // Send SPA page_view when GA is active
    if (!initialized.current || !GA_ID) return;
    const url = `${window.location.pathname}${window.location.search}`;
    // @ts-expect-error - gtag injected globally at runtime
    window.gtag?.("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
};

export default GoogleAnalyticsCookie;
