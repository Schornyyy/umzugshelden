"use client";

import { Phone } from "lucide-react";
import { usePathname } from "next/navigation";

const PHONE_HREF = "tel:+4915168567708";

export default function MobileCallButton() {
  const pathname = usePathname();
  if (pathname === "/blog" || pathname.startsWith("/blog/")) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden"
      />
      <a
        href={PHONE_HREF}
        className="fixed inset-x-0 bottom-0 z-50 flex min-h-14 items-center justify-center gap-2 bg-primary px-4 pb-[env(safe-area-inset-bottom)] font-sans text-base font-bold text-white shadow-[0_-8px_30px_rgba(15,23,42,0.18)] md:hidden">
        <Phone size={20} /> Kostenlos anrufen
      </a>
    </>
  );
}
