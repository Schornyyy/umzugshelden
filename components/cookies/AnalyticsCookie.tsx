"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Analytics } from "@vercel/analytics/react";
import { usePathname } from "next/navigation";

const AnalyticsCookies = () => {
  const pathname = usePathname();
  const isLandingpage = pathname.startsWith("/landingpage/");
  const [isConsentGiven, setIsConsentGiven] =
    useState<boolean>(isLandingpage);

  useEffect(() => {
    if (isLandingpage) {
      setIsConsentGiven(true);
      return;
    }

    const savedConsent = Cookies.get("cookieConsentGScreatives");
    if (savedConsent) {
      const parsedConsent = JSON.parse(savedConsent);
      setIsConsentGiven(parsedConsent.analytics);
    }
  }, [isLandingpage]);

  if (!isConsentGiven) return null;

  return (
    <>
      <Analytics />
    </>
  );
};

export default AnalyticsCookies;
