import type { Metadata, Viewport } from "next";
import React, { ReactNode } from "react";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: "Umzugshelden Admin",
  description: "Umzugshelden Verwaltungsbereich",
  applicationName: "Umzugshelden Admin",
  manifest: "/admin/manifest.webmanifest",
  icons: {
    icon: "/admin/icon",
    apple: "/admin/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Umzugshelden Admin",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  viewportFit: "cover",
};

const layout = ({ children }: { children: ReactNode }) => {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
};

export default layout;
