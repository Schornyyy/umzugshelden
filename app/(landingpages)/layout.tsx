import { CheckCircle2, Phone } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const PHONE_HREF = "tel:+4915168567708";
const PHONE_LABEL = "+49 151 68567708";

export default function LandingpageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white pb-24 text-slate-950 sm:pb-0">
      <div className="hidden bg-navy px-4 py-2 text-white sm:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center text-xs font-semibold sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-primary" />
            Kostenlose Anfrage
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-primary" />
            Persönliche Beratung
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-primary" />
            Transparente Leistungen
          </span>
        </div>
      </div>

      <header className="bg-navy sm:border-b sm:border-slate-200 sm:bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-auto sm:px-6 sm:py-3 lg:px-8">
          <div className="flex items-center gap-3" aria-label="Umzugshelden">
            <Image
              src="/images/Umzugshelden.png"
              alt=""
              width={52}
              height={52}
              priority
              className="hidden h-11 w-11 object-contain sm:block"
            />
            <span>
              <span className="block font-sans text-base font-bold leading-none text-white sm:text-lg sm:text-navy">
                Umzugshelden
              </span>
              <span className="mt-1 hidden text-xs text-slate-500 sm:block">
                Umzug &amp; Entrümpelung aus einer Hand
              </span>
            </span>
          </div>
          <a
            href={PHONE_HREF}
            className="hidden items-center gap-3 rounded-lg px-3 py-2 text-right transition hover:bg-slate-50 sm:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <Phone size={19} />
            </span>
            <span>
              <span className="block text-xs font-medium text-slate-500">
                Jetzt direkt anrufen
              </span>
              <span className="block font-sans text-lg font-bold text-navy">
                {PHONE_LABEL}
              </span>
            </span>
          </a>
        </div>
      </header>

      {children}

      <a
        href={PHONE_HREF}
        className="fixed inset-x-4 z-50 flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary px-5 font-sans text-base font-bold text-white shadow-[0_8px_30px_rgba(15,23,42,0.35)] sm:hidden"
        style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <Phone size={20} /> Kostenlos anrufen
      </a>
    </div>
  );
}
