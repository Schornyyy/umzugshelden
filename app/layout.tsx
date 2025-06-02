import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import CookieSettings from "@/components/CookieSettings";

export const metadata: Metadata = {
  title: "Landschaftshelden - Portal für Garten & Landschaftsbauer",
  description: "Das Portal für Garten & Landschaftsbauer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' href='/favicon.ico' sizes='any' />
      </head>
      <body>
        <CookieBanner />
        <CookieSettings />
        {children}
      </body>
    </html>
  );
}
