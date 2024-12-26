import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "JobSmith",
  description: "Das Portal für Garten & Landschaftsbauer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        
      >
        {children}
      </body>
    </html>
  );
}
