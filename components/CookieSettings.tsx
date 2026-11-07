"use client";

import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CookieIcon } from "lucide-react";
import AnalyticsCookies from "./cookies/AnalyticsCookie";
import { usePathname } from "next/navigation";

const CookieSettings: React.FC = () => {
  const pathname = usePathname();
  const isLandingpage = pathname.startsWith("/landingpage/");

  const resetConsent = () => {
    Cookies.remove("cookieConsentGScreatives");
    window.location.reload();
  };

  return (
    <>
      <AnalyticsCookies />
      {!isLandingpage && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className='fixed bottom-4 left-4 z-40'>
          <Button
            asChild
            variant='outline'
            className='bg-primary text-white hover:bg-primary/90 p-4  rounded-full shadow-md'>
            <motion.button
              className='bg-primary'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetConsent}>
              <CookieIcon width={24} height={24} color='white' />
            </motion.button>
          </Button>
        </motion.div>
      )}
    </>
  );
};

export default CookieSettings;
