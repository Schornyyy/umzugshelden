"use client";

import { ArrowRight, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { LEAD_FORM_ANCHOR, LEAD_PHONE_HREF } from "@/lib/leadContact";

/**
 * Mobile Aktionsleiste für Landingpages: Anruf + Sprung zum Formular (#angebot).
 * Wird ausgeblendet, solange das Formular sichtbar ist, damit sie es nicht verdeckt.
 */
export default function MobileStickyCta({
  phoneHref = LEAD_PHONE_HREF,
  formAnchor = LEAD_FORM_ANCHOR,
}: {
  phoneHref?: string;
  formAnchor?: string;
}) {
  const [formVisible, setFormVisible] = useState(true);

  useEffect(() => {
    const form = document.getElementById(formAnchor);
    if (!form) {
      setFormVisible(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, [formAnchor]);

  return (
    <div
      aria-hidden={formVisible}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.15)] backdrop-blur transition-transform duration-300 sm:hidden ${
        formVisible ? "translate-y-full" : "translate-y-0"
      }`}
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
      <div className='flex gap-2'>
        <a
          href={phoneHref}
          tabIndex={formVisible ? -1 : undefined}
          data-analytics-label='Landingpage Sticky Anruf'
          className='flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-navy font-sans text-sm font-bold text-navy'>
          <Phone size={18} /> Anrufen
        </a>
        <a
          href={`#${formAnchor}`}
          tabIndex={formVisible ? -1 : undefined}
          className='flex min-h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-primary font-sans text-sm font-bold text-white shadow-lg shadow-orange-200'>
          Angebot anfordern <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
}
