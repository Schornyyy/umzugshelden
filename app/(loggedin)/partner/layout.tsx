"use client";

import React from "react";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pass-through layout; the sidebar lives under the [userid] nested layout
  return <>{children}</>;
}
