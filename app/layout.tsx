import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import CookieSettings from "@/components/CookieSettings";
import { Toaster } from "@/components/ui/sonner";
import { Raleway } from "next/font/google";
import Script from "next/script";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://umzugshelden.io"),
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
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J23E7LL230');
          `}
        </Script>
      </head>
      <body>
        <CookieBanner />
        <CookieSettings />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
