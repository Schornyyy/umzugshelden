"use client";

import { CompanyDataProvider } from "@/provider/CompanyDataProvider";
import { useParams } from "next/navigation";
import { ReactNode } from "react";

export default function AdminLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const { userid } = useParams<{ userid?: string }>();

  if (!userid) {
    return <>{children}</>;
  }

  return <CompanyDataProvider>{children}</CompanyDataProvider>;
}