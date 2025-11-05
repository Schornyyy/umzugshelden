import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import CookieSettings from "@/components/CookieSettings";
import { Toaster } from "@/components/ui/sonner";
// Using locally hosted Poppins via @font-face in globals.css

export const metadata: Metadata = {
  title: "GS-Creatives - Webdesign & Digitale Präsenz",
  description:
    "GS-Creatives – Portfolio, Webdesign-Services und Agenturen für Ihren digitalen Auftritt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='de'>
      <head>
        <link rel='icon' href='/favicon.ico' sizes='any' />
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
