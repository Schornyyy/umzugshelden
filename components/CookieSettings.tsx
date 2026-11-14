"use client";

import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
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
        <div className='fixed bottom-4 left-4 z-40'>
          <Button
            asChild
            variant='outline'
            className='bg-primary text-white hover:bg-primary/90 p-4  rounded-full shadow-md'>
            <button
              className='bg-primary transition-transform hover:scale-105 active:scale-95'
              onClick={resetConsent}>
              <CookieIcon width={24} height={24} color='white' />
            </button>
          </Button>
        </div>
      )}
    </>
  );
};

export default CookieSettings;
