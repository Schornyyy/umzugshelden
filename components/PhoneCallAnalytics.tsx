"use client";

import { trackGoogleAnalyticsEvent } from "@/lib/googleAnalytics";
import { useEffect } from "react";

const PHONE_EVENT_TIMEOUT_MS = 800;

export default function PhoneCallAnalytics() {
  useEffect(() => {
    function trackPhoneClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const phoneLink = target.closest<HTMLAnchorElement>('a[href^="tel:"]');
      if (!phoneLink) return;

      const phoneHref = phoneLink.href;
      const eventLabel =
        phoneLink.dataset.analyticsLabel ??
        phoneLink.getAttribute("aria-label") ??
        phoneLink.id ??
        phoneLink.textContent?.trim() ??
        "";
      const eventParameters = {
        event_category: "Contact",
        event_label: eventLabel,
        phone_number:
          phoneLink.getAttribute("href")?.replace(/^tel:/, "") ?? "",
        link_text: phoneLink.textContent?.trim() ?? "",
        page_location: window.location.href,
        page_title: document.title,
      };

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        trackGoogleAnalyticsEvent("phone_call_click", eventParameters);
        return;
      }

      event.preventDefault();
      let navigationStarted = false;
      const continueToPhone = () => {
        if (navigationStarted) return;
        navigationStarted = true;
        window.location.href = phoneHref;
      };

      const tracked = trackGoogleAnalyticsEvent("phone_call_click", {
        ...eventParameters,
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
