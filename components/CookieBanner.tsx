"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import Link from "next/link";

type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true, // Immer aktiv
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const savedConsent = Cookies.get("cookieConsentLandschaftshelden");
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      setConsent(JSON.parse(savedConsent));
    }
  }, []);

  const handleAccept = () => {
    Cookies.set("cookieConsentLandschaftshelden", JSON.stringify(consent), {
      expires: 365,
    });
    setShowBanner(false);
    try {
      window.dispatchEvent(
        new CustomEvent("cookieConsentUpdated", { detail: { ...consent } })
      );
    } catch {}
  };

  const handleToggle = (category: keyof CookieConsent) => {
    setConsent((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  if (!showBanner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-6 rounded-t-lg shadow-lg z-50'>
      <p className='mb-4 text-sm'>
        Diese Website verwendet Cookies, um ihre Funktionalität sicherzustellen
        und Ihr Nutzererlebnis zu verbessern. Sie können auswählen, welche Arten
        von Cookies Sie erlauben möchten. Essenzielle Cookies sind für den
        Betrieb der Website erforderlich und können nicht deaktiviert werden.
        Weitere Informationen finden Sie in unserer{" "}
        <Link href={"/datenschutz"} className='text-primary'>
          Datenschutzerklärung.
        </Link>
      </p>

      <div className='flex flex-col gap-3'>
        <div className='flex flex-row gap-3'>
          <span>Statistik</span>
          <Switch
            checked={consent.analytics}
            onCheckedChange={() => handleToggle("analytics")}
          />
        </div>

        <div className='flex flex-row gap-3'>
          <span>Marketing</span>
          <Switch
            className='bg-green-500'
            checked={consent.marketing}
            onCheckedChange={() => handleToggle("marketing")}
          />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.009 }}
        whileTap={{ scale: 0.95 }}
        className='mt-4 w-full bg-green-500 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-all'
        onClick={handleAccept}>
        Akzeptieren
      </motion.button>
    </motion.div>
  );
};

export default CookieBanner;
