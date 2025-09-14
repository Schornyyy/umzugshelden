"use client";

import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CookieIcon } from "lucide-react";
import AnalyticsCookies from "./cookies/AnalyticsCookie";
import ClarityCookie from "./cookies/ClarityCookie";
import GoogleAnalyticsCookie from "./cookies/GoogleAnalyticsCookie";
import { Suspense, useEffect } from "react";
import Clarity from "@microsoft/clarity";

const CookieSettings: React.FC = () => {
  const resetConsent = () => {
    Cookies.remove("cookieConsentLandschaftshelden");
    window.location.reload();
  };

  const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "";
  useEffect(() => {
    Clarity.init(CLARITY_ID);
  }, [CLARITY_ID]);

  return (
    <>
      <AnalyticsCookies />
      <ClarityCookie />
      <Suspense fallback={null}>
        <GoogleAnalyticsCookie />
      </Suspense>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className='fixed bottom-4 right-4 z-40'>
        <Button
          asChild
          variant='outline'
          className='bg-green-700 text-white hover:bg-green-600 p-4  rounded-full shadow-md'>
          <motion.button
            className='bg-green-500'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetConsent}>
            <CookieIcon width={24} height={24} color='white' />
          </motion.button>
        </Button>
      </motion.div>
    </>
  );
};

export default CookieSettings;
