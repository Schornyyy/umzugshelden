import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import CookieSettings from "@/components/CookieSettings";
import { Toaster } from "@/components/ui/sonner";
import { Raleway } from "next/font/google";

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
