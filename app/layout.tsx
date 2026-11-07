import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import CookieSettings from "@/components/CookieSettings";
import { Toaster } from "@/components/ui/sonner";
import { Raleway } from "next/font/google";
import Script from "next/script";
import PhoneCallAnalytics from "@/components/PhoneCallAnalytics";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.umzugshelden.io"),
  title: "Umzugshelden — Ihr zuverlässiger Umzugsservice",
  description:
    "Umzugshelden – Professioneller Umzugsservice: schnell, zuverlässig und günstig. Kostenlose Anfrage stellen!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='de' className={raleway.variable}>
      <head>
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <Script
          async
          src='https://www.googletagmanager.com/gtag/js?id=G-J23E7LL230'
          strategy='beforeInteractive'
        />
        <Script id='google-analytics' strategy='beforeInteractive'>
          {`
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){window.dataLayer.push(arguments);}
            window.gtag('js', new Date());
            window.gtag('config', 'G-J23E7LL230');
          `}
        </Script>
        <Script id='ms-clarity' strategy='beforeInteractive'>
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "z9yk4u5yfi");
          `}
        </Script>
      </head>
      <body>
        <PhoneCallAnalytics />
        <CookieBanner />
        <CookieSettings />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
