"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Analytics } from "@vercel/analytics/react";

const AnalyticsCookies = () => {
  const [isConsentGiven, setIsConsentGiven] = useState<boolean>(false);

  useEffect(() => {
    const savedConsent = Cookies.get("cookieConsentGScreatives");
    if (savedConsent) {
      const parsedConsent = JSON.parse(savedConsent);
      setIsConsentGiven(parsedConsent.analytics);
    }
  }, []);

  if (!isConsentGiven) return null;

  return (
    <>
      <Analytics />
    </>
  );
};

export default AnalyticsCookies;
