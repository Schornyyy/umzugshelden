"use client";

import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import { useEffect } from "react";

const PHONE_EVENT_TIMEOUT_MS = 800;

export default function LandingpageAnalytics() {
  useEffect(() => {
    function trackPhoneClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const phoneLink = target.closest<HTMLAnchorElement>('a[href^="tel:"]');
      if (!phoneLink) return;

      const phoneHref = phoneLink.href;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        trackGoogleAnalyticsEvent("click_to_call", {
          phone_number: phoneLink.getAttribute("href")?.replace(/^tel:/, "") ?? "",
          link_text: phoneLink.textContent?.trim() ?? "",
          page_location: window.location.href,
        });
        return;
      }

      event.preventDefault();
      let navigationStarted = false;
      const continueToPhone = () => {
        if (navigationStarted) return;
        navigationStarted = true;
        window.location.href = phoneHref;
      };

      const tracked = trackGoogleAnalyticsEvent("click_to_call", {
        phone_number: phoneLink.getAttribute("href")?.replace(/^tel:/, "") ?? "",
        link_text: phoneLink.textContent?.trim() ?? "",
        page_location: window.location.href,
        event_callback: continueToPhone,
        event_timeout: PHONE_EVENT_TIMEOUT_MS,
      });

      if (!tracked) {
        continueToPhone();
        return;
      }
      window.setTimeout(continueToPhone, PHONE_EVENT_TIMEOUT_MS);
    }

    document.addEventListener("click", trackPhoneClick);
    return () => document.removeEventListener("click", trackPhoneClick);
  }, []);

  return null;
}
